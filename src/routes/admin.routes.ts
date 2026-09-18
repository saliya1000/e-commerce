import { Router } from 'express';
import { 
  getUsers, updateUserRole, 
  getAllOrders, updateOrderStatus, 
  deleteReview, getReviews, updateReviewStatus,
  bulkUploadProducts, updateProduct, deleteProduct,
  updateCategory, deleteCategory,
  createRefund, getRefunds,
  getDeliveryOptions, createDeliveryOption, updateDeliveryOption, deleteDeliveryOption,
  getFaqs, createFaq, updateFaq, deleteFaq
} from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { auditLogger } from '../middlewares/auditLogger';
import { uploadCsv } from '../middlewares/upload';

const router = Router();

// Protect all admin routes and log actions
router.use(requireAuth, requireRole('admin'), auditLogger);

// Users
router.get('/users', getUsers);
router.put('/users/:userId/role', updateUserRole);

// Orders & Refunds
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', updateOrderStatus);
router.post('/orders/:orderId/refund', createRefund);
router.get('/refunds', getRefunds);

// Reviews Moderation
router.get('/reviews', getReviews);
router.put('/reviews/:reviewId/status', updateReviewStatus);
router.delete('/reviews/:reviewId', deleteReview);

// Products
router.post('/products/bulk', uploadCsv.single('file'), bulkUploadProducts);
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

export default router;
