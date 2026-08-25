import { Router } from 'express';
import { checkout, getOrders, getOrder, cancelOrder } from '../controllers/order.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router = Router();

router.post('/checkout', optionalAuth, checkout);
router.get('/', requireAuth, getOrders);
router.get('/:id', optionalAuth, getOrder);
router.post('/:id/cancel', optionalAuth, cancelOrder);

export default router;
