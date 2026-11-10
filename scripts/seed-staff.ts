import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const staffUsers = [
    {
      email: 'superadmin@example.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP' // Demo secret if needed
    },
    {
      email: 'admin@example.com',
      firstName: 'Alex',
      lastName: 'Admin',
      role: 'admin',
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP'
    },
    {
      email: 'support@example.com',
      firstName: 'Sarah',
      lastName: 'Support',
      role: 'support',
      twoFactorEnabled: false
    },
    {
      email: 'sales@example.com',
      firstName: 'Sam',
      lastName: 'Sales',
      role: 'sales',
      twoFactorEnabled: false
    }
  ];

  console.log('Seeding / updating staff users...');
  const userMap: Record<string, any> = {};

  for (const staff of staffUsers) {
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: {
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        twoFactorEnabled: staff.twoFactorEnabled,
        twoFactorSecret: staff.twoFactorSecret || null
      },
      create: {
        email: staff.email,
        passwordHash,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        twoFactorEnabled: staff.twoFactorEnabled,
        twoFactorSecret: staff.twoFactorSecret || null
      }
    });
    userMap[staff.role] = user;
    console.log(`Staff user ready: ${user.email} (${user.role}) [ID: ${user.id}]`);
  }

  // Create sample sessions and audit logs for realistic demonstration
  const now = new Date();

  // 1. Superadmin active session
  await prisma.userSession.create({
    data: {
      userId: userMap.superadmin.id,
      loginTime: new Date(now.getTime() - 25 * 60 * 1000), // 25 mins ago
      logoutTime: null,
      status: 'ACTIVE',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  // 2. Admin past sessions and current active session
  await prisma.userSession.create({
    data: {
      userId: userMap.admin.id,
      loginTime: new Date(now.getTime() - 3 * 3600 * 1000), // 3 hours ago
      logoutTime: new Date(now.getTime() - 2 * 3600 * 1000), // 2 hours ago
      status: 'LOGGED_OUT',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  await prisma.userSession.create({
    data: {
      userId: userMap.admin.id,
      loginTime: new Date(now.getTime() - 50 * 60 * 1000), // 50 mins ago
      logoutTime: null,
      status: 'ACTIVE',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  // 3. Support past session and active session
  await prisma.userSession.create({
    data: {
      userId: userMap.support.id,
      loginTime: new Date(now.getTime() - 5 * 3600 * 1000),
      logoutTime: new Date(now.getTime() - 3.5 * 3600 * 1000),
      status: 'LOGGED_OUT',
      ipAddress: '192.168.1.110',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0'
    }
  });
  await prisma.userSession.create({
    data: {
      userId: userMap.support.id,
      loginTime: new Date(now.getTime() - 40 * 60 * 1000),
      logoutTime: null,
      status: 'ACTIVE',
      ipAddress: '192.168.1.110',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0'
    }
  });

  // 4. Sales past sessions
  await prisma.userSession.create({
    data: {
      userId: userMap.sales.id,
      loginTime: new Date(now.getTime() - 24 * 3600 * 1000),
      logoutTime: new Date(now.getTime() - 20 * 3600 * 1000),
      status: 'LOGGED_OUT',
      ipAddress: '192.168.1.115',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    }
  });
  await prisma.userSession.create({
    data: {
      userId: userMap.sales.id,
      loginTime: new Date(now.getTime() - 2 * 3600 * 1000),
      logoutTime: new Date(now.getTime() - 30 * 60 * 1000),
      status: 'LOGGED_OUT',
      ipAddress: '192.168.1.115',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
    }
  });

  // Sample Audit Logs for each role
  const sampleActions = [
    {
      userId: userMap.support.id,
      action: 'ORDER_REFUND',
      resource: '/api/admin/orders/ord-101/refund',
      details: JSON.stringify({ reason: 'Damaged item reported by customer', amount: 49.99 }),
      ipAddress: '192.168.1.110',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000)
    },
    {
      userId: userMap.support.id,
      action: 'ORDER_STATUS_UPDATE',
      resource: '/api/admin/orders/ord-102/status',
      details: JSON.stringify({ status: 'PROCESSING', note: 'Customer confirmed shipping address' }),
      ipAddress: '192.168.1.110',
      createdAt: new Date(now.getTime() - 20 * 60 * 1000)
    },
    {
      userId: userMap.support.id,
      action: 'REVIEW_STATUS_UPDATE',
      resource: '/api/admin/reviews/rev-55/status',
      details: JSON.stringify({ isApproved: true }),
      ipAddress: '192.168.1.110',
      createdAt: new Date(now.getTime() - 15 * 60 * 1000)
    },
    {
      userId: userMap.sales.id,
      action: 'COUPON_CREATE',
      resource: '/api/admin/coupons',
      details: JSON.stringify({ code: 'HOLIDAY25', discountType: 'percentage', discountValue: 25 }),
      ipAddress: '192.168.1.115',
      createdAt: new Date(now.getTime() - 90 * 60 * 1000)
    },
    {
      userId: userMap.sales.id,
      action: 'REPORT_DOWNLOAD',
      resource: '/api/admin/reports/download?type=sales',
      details: JSON.stringify({ reportType: 'sales', format: 'PDF' }),
      ipAddress: '192.168.1.115',
      createdAt: new Date(now.getTime() - 45 * 60 * 1000)
    },
    {
      userId: userMap.admin.id,
      action: 'PRODUCT_CREATE',
      resource: '/api/admin/products',
      details: JSON.stringify({ name: 'Organic Puppy Kibble 5kg', price: 34.99, sku: 'DOG-KIB-001' }),
      ipAddress: '192.168.1.105',
      createdAt: new Date(now.getTime() - 40 * 60 * 1000)
    },
    {
      userId: userMap.admin.id,
      action: 'PRODUCT_UPDATE',
      resource: '/api/admin/products/prod-201',
      details: JSON.stringify({ stock: 150, price: 32.99 }),
      ipAddress: '192.168.1.105',
      createdAt: new Date(now.getTime() - 10 * 60 * 1000)
    },
    {
      userId: userMap.superadmin.id,
      action: 'USER_ROLE_UPDATE',
      resource: '/api/admin/users/' + userMap.support.id + '/role',
      details: JSON.stringify({ email: 'support@example.com', oldRole: 'customer', newRole: 'support' }),
      ipAddress: '192.168.1.100',
      createdAt: new Date(now.getTime() - 22 * 60 * 1000)
    }
  ];

  for (const act of sampleActions) {
    await prisma.auditLog.create({ data: act });
  }

  console.log('Sample sessions and audit logs successfully populated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
