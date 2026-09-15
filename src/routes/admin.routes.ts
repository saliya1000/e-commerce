import { Router } from 'express';
import { getUsers, updateUserRole, updateOrderStatus, deleteReview, bulkUploadProducts } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireRole('admin'));

router.get('/users', getUsers);
router.put('/users/:userId/role', updateUserRole);

router.put('/orders/:orderId/status', updateOrderStatus);

router.delete('/reviews/:reviewId', deleteReview);

router.post('/products/bulk', bulkUploadProducts);

export default router;
