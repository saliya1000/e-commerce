import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  ShieldAlert, 
  Users, 
  Clock, 
  Activity, 
  LogIn, 
  LogOut, 
  Download, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  Eye
} from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  isActiveNow: boolean;
  lastLogin: string | null;
  lastLogout: string | null;
  totalSessions: number;
  totalActions: number;
}

interface RoleSummary {
  role: string;
  totalUsers: number;
  activeUsersNow: number;
  totalSessions: number;
  totalActions: number;
  lastActive: string | null;
}

interface UserSession {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  loginTime: string;
  logoutTime: string | null;
  durationSeconds: number;
  durationFormatted: string;
  status: 'ACTIVE' | 'LOGGED_OUT';
  ipAddress: string;
  userAgent: string;
}

interface AuditLogItem {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  createdAt: string;
}

export const AdminActivityLogs: React.FC = () => {
  // Top Level View Mode: 'roles' | 'user-account' | 'sessions' | 'actions'
  const [viewMode, setViewMode] = useState<'roles' | 'user-account' | 'sessions' | 'actions'>('roles');

  // Summary State
  const [summary, setSummary] = useState<{
    rolesSummary: Record<string, RoleSummary>;
    staffUsers: StaffUser[];
    stats: {
      totalStaff: number;
      activeSessionsNow: number;
      actionsToday: number;
      totalActionsAllTime: number;
    };
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Role-Wise View State
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [roleLogs, setRoleLogs] = useState<AuditLogItem[]>([]);
  const [loadingRoleLogs, setLoadingRoleLogs] = useState(false);

  // User Account-Wise View State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDossier, setUserDossier] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [accountSubTab, setAccountSubTab] = useState<'sessions' | 'actions'>('sessions');

  // Sessions Tab State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionTotalPages, setSessionTotalPages] = useState(1);
  const [sessionRoleFilter, setSessionRoleFilter] = useState('all');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Actions Tab State
  const [actions, setActions] = useState<AuditLogItem[]>([]);
  const [actionPage, setActionPage] = useState(1);
  const [actionTotalPages, setActionTotalPages] = useState(1);
  const [actionSearch, setActionSearch] = useState('');
  const [actionRoleFilter, setActionRoleFilter] = useState('all');
  const [loadingActions, setLoadingActions] = useState(false);

  // Details Modal
  const [modalDetails, setModalDetails] = useState<any>(null);

  // Initial Data Load
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get('/admin/activity-logs/summary');
      setSummary(res.data);
      if (res.data.staffUsers && res.data.staffUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(res.data.staffUsers[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch activity summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch Role Logs when Role Tab or Filter changes
  useEffect(() => {
    if (viewMode === 'roles') {
      fetchRoleLogs();
    }
  }, [viewMode, selectedRole]);

  const fetchRoleLogs = async () => {
    setLoadingRoleLogs(true);
    try {
      const res = await api.get('/admin/activity-logs', {
        params: { role: selectedRole, limit: 15 }
      });
      setRoleLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch role logs:', err);
    } finally {
      setLoadingRoleLogs(false);
    }
  };

  // Fetch User Dossier when Account View or User changes
  useEffect(() => {
    if (viewMode === 'user-account' && selectedUserId) {
      fetchUserDossier(selectedUserId);
    }
  }, [viewMode, selectedUserId]);

  const fetchUserDossier = async (userId: string) => {
    setLoadingDossier(true);
    try {
      const res = await api.get(`/admin/activity-logs/users/${userId}`);
      setUserDossier(res.data);
    } catch (err) {
      console.error('Failed to fetch user dossier:', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  // Fetch Sessions
  useEffect(() => {
    if (viewMode === 'sessions') {
      fetchSessions();
    }
  }, [viewMode, sessionPage, sessionRoleFilter, sessionStatusFilter]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/admin/activity-logs/sessions', {
        params: {
          page: sessionPage,
          limit: 15,
          role: sessionRoleFilter,
          status: sessionStatusFilter
        }
      });
      setSessions(res.data.sessions || []);
      setSessionTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch Actions
  useEffect(() => {
    if (viewMode === 'actions') {
      fetchActions();
    }
  }, [viewMode, actionPage, actionRoleFilter, actionSearch]);

  const fetchActions = async () => {
    setLoadingActions(true);
    try {
      const res = await api.get('/admin/activity-logs', {
        params: {
          page: actionPage,
          limit: 15,
          role: actionRoleFilter,
          search: actionSearch
        }
      });
      setActions(res.data.logs || []);
      setActionTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch actions:', err);
    } finally {
      setLoadingActions(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/admin/activity-logs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_activity_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Failed to export activity logs.');
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return { background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171' };
      case 'admin':
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' };
      case 'support':
        return { background: '#e0e7ff', color: '#4338ca', border: '1px solid #818cf8' };
      case 'sales':
        return { background: '#f3e8ff', color: '#7e22ce', border: '1px solid #c084fc' };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
    }
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('LOGIN')) return { background: '#dcfce7', color: '#15803d' };
    if (action.includes('LOGOUT')) return { background: '#f1f5f9', color: '#64748b' };
    if (action.includes('REFUND')) return { background: '#fee2e2', color: '#b91c1c' };
    if (action.includes('ORDER')) return { background: '#e0f2fe', color: '#0369a1' };
    if (action.includes('PRODUCT')) return { background: '#fef3c7', color: '#b45309' };
    if (action.includes('USER') || action.includes('ROLE')) return { background: '#fae8ff', color: '#86198f' };
    return { background: '#f1f5f9', color: '#334155' };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', borderLeft: '5px solid #dc2626' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                User Activity & Audit Reports
              </h2>
              <span style={{ 
                background: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', 
                fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '9999px',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}>
                <ShieldAlert size={14} /> Superadmin Only
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time tracking of staff logins, logouts, session durations, and operations across Support, Sales, and Admin accounts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => { fetchSummary(); if (viewMode === 'roles') fetchRoleLogs(); if (viewMode === 'sessions') fetchSessions(); if (viewMode === 'actions') fetchActions(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleExportCsv}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {loadingSummary ? (
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading staff activity metrics...
        </div>
      ) : summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#dcfce7', padding: '0.75rem', borderRadius: '10px', color: '#16a34a' }}>
              <LogIn size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Sessions Now</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {summary.stats.activeSessionsNow}
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }}></span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#e0e7ff', padding: '0.75rem', borderRadius: '10px', color: '#4338ca' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Monitored Staff Users</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {summary.stats.totalStaff}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '10px', color: '#b45309' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Actions Recorded Today</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {summary.stats.actionsToday}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '10px', color: '#475569' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Audit Trail</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {summary.stats.totalActionsAllTime}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setViewMode('roles')}
          style={{
            padding: '0.75rem 1.25rem',
            background: viewMode === 'roles' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'roles' ? 'white' : 'var(--text-main)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={18} /> Role-Wise Activity
        </button>

        <button
          onClick={() => setViewMode('user-account')}
          style={{
            padding: '0.75rem 1.25rem',
            background: viewMode === 'user-account' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'user-account' ? 'white' : 'var(--text-main)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldAlert size={18} /> User Account-Wise View
        </button>

        <button
          onClick={() => setViewMode('sessions')}
          style={{
            padding: '0.75rem 1.25rem',
            background: viewMode === 'sessions' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'sessions' ? 'white' : 'var(--text-main)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Clock size={18} /> Login / Logout Sessions
        </button>

        <button
          onClick={() => setViewMode('actions')}
          style={{
            padding: '0.75rem 1.25rem',
            background: viewMode === 'actions' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'actions' ? 'white' : 'var(--text-main)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Activity size={18} /> System Actions Trail
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ROLE-WISE ACTIVITY VIEW                                                */}
      {/* ========================================================================= */}
      {viewMode === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Role Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filter by Role:</span>
            {['all', 'support', 'sales', 'admin', 'superadmin'].map(r => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  border: selectedRole === r ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                  background: selectedRole === r ? 'var(--bg-secondary)' : 'white',
                  fontWeight: selectedRole === r ? 'bold' : 'normal',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontSize: '0.85rem'
                }}
              >
                {r === 'all' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          {/* Role Summary Grid */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {Object.entries(summary.rolesSummary)
                .filter(([roleKey]) => selectedRole === 'all' || selectedRole === roleKey)
                .map(([roleKey, roleData]) => (
                  <div key={roleKey} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid ${getRoleBadgeStyle(roleKey).border.split(' ')[2]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        ...getRoleBadgeStyle(roleKey), 
                        padding: '0.25rem 0.75rem', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' 
                      }}>
                        {roleKey}
                      </span>
                      {roleData.activeUsersNow > 0 ? (
                        <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> {roleData.activeUsersNow} Active Now
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Offline</span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Users</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{roleData.totalUsers}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Sessions</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: roleData.activeUsersNow > 0 ? '#16a34a' : 'inherit' }}>
                          {roleData.activeUsersNow}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Logins</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{roleData.totalSessions}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Actions</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{roleData.totalActions}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Last Active:</strong> {formatDate(roleData.lastActive)}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Recent Activity for Selected Role */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--primary)" /> Recent Activity for {selectedRole === 'all' ? 'All Roles' : `${selectedRole.toUpperCase()} Team`}
            </h3>

            {loadingRoleLogs ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
            ) : roleLogs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No activities recorded for this role.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem' }}>Staff User</th>
                      <th style={{ padding: '0.75rem' }}>Role</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                      <th style={{ padding: '0.75rem' }}>Resource Endpoint</th>
                      <th style={{ padding: '0.75rem' }}>IP Address</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {formatDate(log.createdAt)}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email : 'Unknown'}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                            {log.user?.email}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ ...getRoleBadgeStyle(log.user?.role), padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {log.user?.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ ...getActionBadgeStyle(log.action), padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.resource}
                        </td>
                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {log.ipAddress}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {log.details ? (
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => setModalDetails({ title: `${log.action} Details`, data: log.details })}
                            >
                              <Eye size={12} /> View
                            </button>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER ACCOUNT-WISE VIEW                                                 */}
      {/* ========================================================================= */}
      {viewMode === 'user-account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Account Selector */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--primary)" /> Select Staff Account:
            </label>
            <select
              className="form-input"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              style={{ maxWidth: '400px', fontWeight: 500 }}
            >
              {summary?.staffUsers.map(u => (
                <option key={u.id} value={u.id}>
                  [{u.role.toUpperCase()}] {u.firstName} {u.lastName} ({u.email}) {u.isActiveNow ? '• ACTIVE' : ''}
                </option>
              ))}
            </select>
          </div>

          {loadingDossier ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading account activity dossier...
            </div>
          ) : userDossier ? (
            <>
              {/* User Dossier Profile Card */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
                      {userDossier.user.firstName} {userDossier.user.lastName}
                    </h3>
                    <span style={{ ...getRoleBadgeStyle(userDossier.user.role), padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {userDossier.user.role}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    {userDossier.user.email}
                  </div>
                  <div>
                    {userDossier.isActiveNow ? (
                      <span style={{ 
                        background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', 
                        padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                      }}>
                        <CheckCircle size={14} /> Currently Logged In ({userDossier.activeSession?.durationFormatted || 'Active'})
                      </span>
                    ) : (
                      <span style={{ 
                        background: '#f1f5f9', color: '#64748b', 
                        padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                      }}>
                        <LogOut size={14} /> Currently Logged Out
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Logged In</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      {formatDate(userDossier.stats.lastLogin)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Logged Out</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      {formatDate(userDossier.stats.lastLogout)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Login Sessions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      {userDossier.stats.totalSessions}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Actions Logged</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      {userDossier.stats.totalActions}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs for selected account */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
                <button
                  onClick={() => setAccountSubTab('sessions')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: accountSubTab === 'sessions' ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    borderBottom: accountSubTab === 'sessions' ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Clock size={16} /> Login & Logout History ({userDossier.sessions?.length || 0})
                </button>
                <button
                  onClick={() => setAccountSubTab('actions')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: accountSubTab === 'actions' ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none',
                    borderBottom: accountSubTab === 'actions' ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Activity size={16} /> System Operations Trail ({userDossier.actions?.length || 0})
                </button>
              </div>

              {/* Account Sub-Tab 1: Sessions */}
              {accountSubTab === 'sessions' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Login & Logout Timeline</h4>
                  {userDossier.sessions?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No sessions recorded for this user.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.75rem' }}>Logged In Time</th>
                            <th style={{ padding: '0.75rem' }}>Logged Out Time</th>
                            <th style={{ padding: '0.75rem' }}>Session Duration</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>IP Address</th>
                            <th style={{ padding: '0.75rem' }}>Client Browser / Device</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDossier.sessions.map((sess: any) => (
                            <tr key={sess.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a' }}>
                                  <LogIn size={14} /> {formatDate(sess.loginTime)}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {sess.logoutTime ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}>
                                    <LogOut size={14} /> {formatDate(sess.logoutTime)}
                                  </span>
                                ) : (
                                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>• Active Now</span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                                {sess.durationFormatted}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {sess.status === 'ACTIVE' ? (
                                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    ACTIVE
                                  </span>
                                ) : (
                                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    LOGGED OUT
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {sess.ipAddress}
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sess.userAgent}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Account Sub-Tab 2: Actions */}
              {accountSubTab === 'actions' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Recorded Actions Inside The System</h4>
                  {userDossier.actions?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No system actions recorded for this user.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.75rem' }}>Timestamp</th>
                            <th style={{ padding: '0.75rem' }}>Action Type</th>
                            <th style={{ padding: '0.75rem' }}>Resource Endpoint</th>
                            <th style={{ padding: '0.75rem' }}>IP Address</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDossier.actions.map((act: any) => (
                            <tr key={act.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                {formatDate(act.createdAt)}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ ...getActionBadgeStyle(act.action), padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {act.action}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {act.resource}
                              </td>
                              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {act.ipAddress}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                {act.details ? (
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                    onClick={() => setModalDetails({ title: `${act.action} Parameters`, data: act.details })}
                                  >
                                    <Eye size={12} /> Inspect
                                  </button>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LOGIN / LOGOUT SESSIONS LOG                                            */}
      {/* ========================================================================= */}
      {viewMode === 'sessions' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary)" /> Staff Login & Logout Sessions
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                className="form-input"
                value={sessionRoleFilter}
                onChange={e => { setSessionRoleFilter(e.target.value); setSessionPage(1); }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <option value="all">All Staff Roles</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>

              <select
                className="form-input"
                value={sessionStatusFilter}
                onChange={e => { setSessionStatusFilter(e.target.value); setSessionPage(1); }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active Sessions</option>
                <option value="LOGGED_OUT">Logged Out</option>
              </select>
            </div>
          </div>

          {loadingSessions ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions found matching filters.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Staff Member</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Logged In Time</th>
                    <th style={{ padding: '0.75rem' }}>Logged Out Time</th>
                    <th style={{ padding: '0.75rem' }}>Duration</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : 'Unknown'}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          {s.user?.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ ...getRoleBadgeStyle(s.user?.role), padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {s.user?.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                        <LogIn size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {formatDate(s.loginTime)}
                      </td>
                      <td style={{ padding: '0.75rem', color: s.logoutTime ? '#64748b' : '#16a34a' }}>
                        {s.logoutTime ? (
                          <>
                            <LogOut size={13} style={{ display: 'inline', marginRight: '4px' }} />
                            {formatDate(s.logoutTime)}
                          </>
                        ) : (
                          <strong style={{ color: '#16a34a' }}>Active Session</strong>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {s.durationFormatted}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {s.status === 'ACTIVE' ? (
                          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            LOGGED OUT
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {s.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {sessionTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={sessionPage <= 1}
                    onClick={() => setSessionPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Page {sessionPage} of {sessionTotalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={sessionPage >= sessionTotalPages}
                    onClick={() => setSessionPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SYSTEM ACTIONS AUDIT TRAIL                                             */}
      {/* ========================================================================= */}
      {viewMode === 'actions' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="var(--primary)" /> All System Actions & Operations
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search user, action, endpoint..."
                  className="form-input"
                  value={actionSearch}
                  onChange={e => { setActionSearch(e.target.value); setActionPage(1); }}
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="form-input"
                value={actionRoleFilter}
                onChange={e => { setActionRoleFilter(e.target.value); setActionPage(1); }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <option value="all">All Roles</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          </div>

          {loadingActions ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading system actions...</div>
          ) : actions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No actions found matching search query.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem' }}>Staff User</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Action Type</th>
                    <th style={{ padding: '0.75rem' }}>Resource Endpoint</th>
                    <th style={{ padding: '0.75rem' }}>IP Address</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map(act => (
                    <tr key={act.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {formatDate(act.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {act.user ? `${act.user.firstName || ''} ${act.user.lastName || ''}`.trim() || act.user.email : 'Unknown'}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          {act.user?.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ ...getRoleBadgeStyle(act.user?.role), padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {act.user?.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ ...getActionBadgeStyle(act.action), padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {act.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act.resource}
                      </td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {act.ipAddress}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {act.details ? (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setModalDetails({ title: `${act.action} Event Details`, data: act.details })}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {actionTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={actionPage <= 1}
                    onClick={() => setActionPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Page {actionPage} of {actionTotalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={actionPage >= actionTotalPages}
                    onClick={() => setActionPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inspect Modal */}
      {modalDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            background: 'white',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{modalDetails.title}</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setModalDetails(null)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕ Close
              </button>
            </div>
            <pre style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '1rem',
              borderRadius: '8px',
              overflowY: 'auto',
              fontSize: '0.85rem',
              maxHeight: '400px'
            }}>
              {typeof modalDetails.data === 'string' ? modalDetails.data : JSON.stringify(modalDetails.data, null, 2)}
            </pre>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setModalDetails(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
