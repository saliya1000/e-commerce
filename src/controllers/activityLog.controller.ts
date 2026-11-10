import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

const STAFF_ROLES = ['admin', 'superadmin', 'support', 'sales'];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) return `${hours}h ${remainingMins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

// Ensure caller is strictly superadmin
const assertSuperadmin = (req: Request, res: Response): boolean => {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({ error: 'Access forbidden: Only superadmins can view user activity reports.' });
    return false;
  }
  return true;
};

/**
 * GET /api/admin/activity-logs/summary
 * Returns high-level statistics grouped by role and staff member overview.
 */
export const getActivitySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!assertSuperadmin(req, res)) return;

    // 1. Fetch all staff users
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: STAFF_ROLES } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    const userIds = staffUsers.map(u => u.id);

    // 2. Fetch active sessions right now
    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId: { in: userIds },
        status: 'ACTIVE'
      },
      select: { userId: true, loginTime: true }
    });

    const activeUserSet = new Set(activeSessions.map(s => s.userId));

    // 3. Fetch latest session per user
    const latestSessions = await prisma.userSession.findMany({
      where: { userId: { in: userIds } },
      orderBy: { loginTime: 'desc' }
    });

    const userLatestSessionMap = new Map<string, any>();
    for (const s of latestSessions) {
      if (!userLatestSessionMap.has(s.userId)) {
        userLatestSessionMap.set(s.userId, s);
      }
    }

    // 4. Counts of sessions and audit logs per user
    const sessionCountByUser = await prisma.userSession.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true }
    });
    const sessionCountMap = new Map(sessionCountByUser.map(s => [s.userId, s._count.id]));

    const actionCountByUser = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true }
    });
    const actionCountMap = new Map(actionCountByUser.map(a => [a.userId, a._count.id]));

    // 5. Construct user-wise list
    const usersWithStats = staffUsers.map(u => {
      const latest = userLatestSessionMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt,
        isActiveNow: activeUserSet.has(u.id),
        lastLogin: latest?.loginTime || null,
        lastLogout: latest?.logoutTime || null,
        totalSessions: sessionCountMap.get(u.id) || 0,
        totalActions: actionCountMap.get(u.id) || 0
      };
    });

    // 6. Aggregate by Role
    const rolesSummary: Record<string, any> = {};
    for (const role of STAFF_ROLES) {
      const roleUsers = usersWithStats.filter(u => u.role === role);
      const activeCount = roleUsers.filter(u => u.isActiveNow).length;
      const totalSessions = roleUsers.reduce((acc, u) => acc + u.totalSessions, 0);
      const totalActions = roleUsers.reduce((acc, u) => acc + u.totalActions, 0);
      
      let lastActive: Date | null = null;
      for (const u of roleUsers) {
        if (u.lastLogin && (!lastActive || new Date(u.lastLogin) > new Date(lastActive))) {
          lastActive = u.lastLogin;
        }
      }

      rolesSummary[role] = {
        role,
        totalUsers: roleUsers.length,
        activeUsersNow: activeCount,
        totalSessions,
        totalActions,
        lastActive
      };
    }

    // 7. Today's action count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const actionsToday = await prisma.auditLog.count({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startOfToday }
      }
    });

    const totalAuditLogs = await prisma.auditLog.count({
      where: { userId: { in: userIds } }
    });

    res.json({
      rolesSummary,
      staffUsers: usersWithStats,
      stats: {
        totalStaff: staffUsers.length,
        activeSessionsNow: activeSessions.length,
        actionsToday,
        totalActionsAllTime: totalAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/activity-logs/sessions
 * Returns detailed login/logout sessions.
 */
export const getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!assertSuperadmin(req, res)) return;

    const { role, userId, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    } else if (role && typeof role === 'string' && role !== 'all') {
      where.user = { role };
    } else {
      where.user = { role: { in: STAFF_ROLES } };
    }

    if (status === 'ACTIVE' || status === 'LOGGED_OUT') {
      where.status = status;
    }

    const [totalCount, sessions] = await Promise.all([
      prisma.userSession.count({ where }),
      prisma.userSession.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { loginTime: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    const now = Date.now();
    const formattedSessions = sessions.map(s => {
      let durationSeconds = 0;
      if (s.logoutTime) {
        durationSeconds = Math.max(0, (new Date(s.logoutTime).getTime() - new Date(s.loginTime).getTime()) / 1000);
      } else {
        durationSeconds = Math.max(0, (now - new Date(s.loginTime).getTime()) / 1000);
      }

      return {
        id: s.id,
        userId: s.userId,
        user: s.user,
        loginTime: s.loginTime,
        logoutTime: s.logoutTime,
        durationSeconds: Math.floor(durationSeconds),
        durationFormatted: formatDuration(durationSeconds),
        status: s.status,
        ipAddress: s.ipAddress || 'Unknown',
        userAgent: s.userAgent || 'Unknown'
      };
    });

    res.json({
      sessions: formattedSessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/activity-logs
 * Returns audit action logs filterable by role, user, action type, date.
 */
export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!assertSuperadmin(req, res)) return;

    const { role, userId, action, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    } else if (role && typeof role === 'string' && role !== 'all') {
      where.user = { role };
    } else {
      where.user = { role: { in: STAFF_ROLES } };
    }

    if (action && typeof action === 'string' && action !== 'all') {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { resource: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
        { details: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    const formattedLogs = logs.map(l => {
      let parsedDetails: any = null;
      if (l.details) {
        try {
          parsedDetails = JSON.parse(l.details);
        } catch {
          parsedDetails = l.details;
        }
      }
      return {
        id: l.id,
        userId: l.userId,
        user: l.user,
        action: l.action,
        resource: l.resource,
        details: parsedDetails,
        ipAddress: l.ipAddress || 'Unknown',
        createdAt: l.createdAt
      };
    });

    res.json({
      logs: formattedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/activity-logs/users/:userId
 * Complete dossier for an individual staff user account.
 */
export const getUserActivityDossier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!assertSuperadmin(req, res)) return;

    const { userId } = req.params as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [recentSessions, recentActions, totalSessions, totalActions, activeSession] = await Promise.all([
      prisma.userSession.findMany({
        where: { userId },
        orderBy: { loginTime: 'desc' },
        take: 20
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.userSession.count({ where: { userId } }),
      prisma.auditLog.count({ where: { userId } }),
      prisma.userSession.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { loginTime: 'desc' }
      })
    ]);

    const now = Date.now();
    const formattedSessions = recentSessions.map(s => {
      const durationSeconds = s.logoutTime 
        ? Math.max(0, (new Date(s.logoutTime).getTime() - new Date(s.loginTime).getTime()) / 1000)
        : Math.max(0, (now - new Date(s.loginTime).getTime()) / 1000);
      return {
        id: s.id,
        loginTime: s.loginTime,
        logoutTime: s.logoutTime,
        durationSeconds: Math.floor(durationSeconds),
        durationFormatted: formatDuration(durationSeconds),
        status: s.status,
        ipAddress: s.ipAddress || 'Unknown',
        userAgent: s.userAgent || 'Unknown'
      };
    });

    const formattedActions = recentActions.map(a => {
      let parsed = null;
      try { parsed = JSON.parse(a.details || '{}'); } catch { parsed = a.details; }
      return {
        id: a.id,
        action: a.action,
        resource: a.resource,
        details: parsed,
        ipAddress: a.ipAddress || 'Unknown',
        createdAt: a.createdAt
      };
    });

    // Action breakdown by prefix / category
    const actionCategories: Record<string, number> = {};
    for (const a of recentActions) {
      const cat = a.action.includes('_') ? a.action.split('_')[0] : a.action;
      actionCategories[cat] = (actionCategories[cat] || 0) + 1;
    }

    res.json({
      user,
      isActiveNow: !!activeSession,
      activeSession: activeSession ? {
        id: activeSession.id,
        loginTime: activeSession.loginTime,
        ipAddress: activeSession.ipAddress,
        durationFormatted: formatDuration(Math.max(0, (now - new Date(activeSession.loginTime).getTime()) / 1000))
      } : null,
      stats: {
        totalSessions,
        totalActions,
        lastLogin: recentSessions[0]?.loginTime || null,
        lastLogout: recentSessions[0]?.logoutTime || null,
        actionCategories
      },
      sessions: formattedSessions,
      actions: formattedActions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/activity-logs/export
 * Downloads activity logs as a structured CSV file.
 */
export const exportActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!assertSuperadmin(req, res)) return;

    const { role, userId } = req.query;
    const where: any = {};

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    } else if (role && typeof role === 'string' && role !== 'all') {
      where.user = { role };
    } else {
      where.user = { role: { in: STAFF_ROLES } };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 2000
    });

    const headers = ['Log ID', 'Timestamp', 'User Email', 'User Name', 'Role', 'Action', 'Resource', 'IP Address', 'Details'];
    const rows = logs.map(l => {
      const userName = `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.trim() || 'N/A';
      const cleanDetails = (l.details || '').replace(/"/g, '""');
      return [
        `"${l.id}"`,
        `"${l.createdAt.toISOString()}"`,
        `"${l.user?.email || 'N/A'}"`,
        `"${userName}"`,
        `"${l.user?.role || 'N/A'}"`,
        `"${l.action}"`,
        `"${l.resource}"`,
        `"${l.ipAddress || ''}"`,
        `"${cleanDetails}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=user_activity_report_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};
