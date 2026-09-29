import { Router } from 'express';
import { 
  getUsers, updateUserRole, createUser,
  getAllOrders, updateOrderStatus, getPendingOrderCount,
  deleteReview, getReviews, updateReviewStatus,
  bulkUploadProducts, updateProduct, deleteProduct, quickUpdateProduct,
  updateCategory, deleteCategory,
  createRefund, getRefunds,
  getDeliveryOptions, createDeliveryOption, updateDeliveryOption, deleteDeliveryOption,
  getFaqs, createFaq, updateFaq, deleteFaq,
  getAdminProducts, promoteToAdmin, getAdminReports, downloadPdfReport,
  getCoupons, createCoupon, updateCoupon, deleteCoupon
} from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { auditLogger } from '../middlewares/auditLogger';
import { uploadCsv } from '../middlewares/upload';

const router = Router();

// Protect all admin routes and log actions
router.use(requireAuth, requireRole('admin'), auditLogger);

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:userId/role', updateUserRole);
router.post('/promote', promoteToAdmin);

// Orders & Refunds
router.get('/orders', getAllOrders);
router.get('/orders/pending-count', getPendingOrderCount);
router.put('/orders/:orderId/status', updateOrderStatus);
router.post('/orders/:orderId/refund', createRefund);
router.get('/refunds', getRefunds);

// Reviews Moderation
router.get('/reviews', getReviews);
router.put('/reviews/:reviewId/status', updateReviewStatus);
router.delete('/reviews/:reviewId', deleteReview);

// Products
router.get('/products', getAdminProducts);
router.post('/products/bulk', uploadCsv.single('file'), bulkUploadProducts);
router.patch('/products/:id/quick', quickUpdateProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Categories
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Delivery Options
router.get('/delivery-options', getDeliveryOptions);
router.post('/delivery-options', createDeliveryOption);
router.put('/delivery-options/:id', updateDeliveryOption);
router.delete('/delivery-options/:id', deleteDeliveryOption);

// FAQs
router.get('/faqs', getFaqs);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

// Reports
router.get('/reports/download', downloadPdfReport);
router.get('/reports', getAdminReports);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;
