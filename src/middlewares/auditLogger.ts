import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

function getActionName(method: string, url: string): string {
  const path = url.split('?')[0];

  if (path.includes('/orders') && path.includes('/refund') && method === 'POST') return 'ORDER_REFUND';
  if (path.includes('/orders') && path.includes('/status') && method === 'PUT') return 'ORDER_STATUS_UPDATE';
  if (path === '/api/admin/orders' && method === 'GET') return 'ORDER_LIST_VIEW';
  if (path.includes('/refunds') && method === 'GET') return 'REFUND_LIST_VIEW';
  
  if (path.includes('/products/bulk') && method === 'POST') return 'PRODUCT_BULK_UPLOAD';
  if (path.includes('/products') && path.includes('/quick') && method === 'PATCH') return 'PRODUCT_QUICK_UPDATE';
  if (path === '/api/admin/products' && method === 'POST') return 'PRODUCT_CREATE';
  if (path.startsWith('/api/admin/products/') && method === 'PUT') return 'PRODUCT_UPDATE';
  if (path.startsWith('/api/admin/products/') && method === 'DELETE') return 'PRODUCT_DELETE';

  if (path.includes('/categories') && method === 'POST') return 'CATEGORY_CREATE';
  if (path.startsWith('/api/admin/categories/') && method === 'PUT') return 'CATEGORY_UPDATE';
  if (path.startsWith('/api/admin/categories/') && method === 'DELETE') return 'CATEGORY_DELETE';

  if (path.includes('/users') && path.includes('/role') && method === 'PUT') return 'USER_ROLE_UPDATE';
  if (path === '/api/admin/users' && method === 'POST') return 'USER_CREATE';
  if (path.includes('/promote') && method === 'POST') return 'USER_PROMOTE';

  if (path.includes('/reviews') && path.includes('/status') && method === 'PUT') return 'REVIEW_STATUS_UPDATE';
  if (path.startsWith('/api/admin/reviews/') && method === 'DELETE') return 'REVIEW_DELETE';

  if (path.includes('/coupons') && method === 'POST') return 'COUPON_CREATE';
  if (path.startsWith('/api/admin/coupons/') && method === 'PUT') return 'COUPON_UPDATE';
  if (path.startsWith('/api/admin/coupons/') && method === 'DELETE') return 'COUPON_DELETE';

  if (path.includes('/faqs') && method === 'POST') return 'FAQ_CREATE';
  if (path.startsWith('/api/admin/faqs/') && method === 'PUT') return 'FAQ_UPDATE';
  if (path.startsWith('/api/admin/faqs/') && method === 'DELETE') return 'FAQ_DELETE';

  if (path.includes('/delivery-options') && method === 'POST') return 'DELIVERY_OPTION_CREATE';
  if (path.startsWith('/api/admin/delivery-options/') && method === 'PUT') return 'DELIVERY_OPTION_UPDATE';
  if (path.startsWith('/api/admin/delivery-options/') && method === 'DELETE') return 'DELIVERY_OPTION_DELETE';

  if (path.includes('/reports/download')) return 'REPORT_DOWNLOAD';
  if (path === '/api/admin/reports' && method === 'GET') return 'REPORT_VIEW';

  return method;
}

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', async () => {
    try {
      // Don't log background polling or high-frequency automated count requests
      if (req.originalUrl.includes('/orders/pending-count')) {
        return;
      }

      if (req.user && req.user.userId) {
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '[REDACTED]';
        if (safeBody.twoFactorSecret) safeBody.twoFactorSecret = '[REDACTED]';
        if (safeBody.token) safeBody.token = '[REDACTED]';

        const action = getActionName(req.method, req.originalUrl);
        
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action,
            resource: req.originalUrl,
            details: JSON.stringify({
              statusCode: res.statusCode,
              body: safeBody,
              params: req.params,
              query: req.query
            }),
            ipAddress: req.ip || req.connection?.remoteAddress || null
          }
        });
      }
    } catch (error) {
      console.error('Audit Logger Error:', error);
    }
  });

  next();
};
