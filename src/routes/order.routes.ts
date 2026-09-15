import { Router } from 'express';
import { checkout, getOrders, getOrder, cancelOrder, verifyPayment, trackOrder, trackCancelOrder, validateAddress } from '../controllers/order.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router = Router();

router.post('/validate-address', optionalAuth, validateAddress);
router.post('/checkout', optionalAuth, checkout);
router.get('/', requireAuth, getOrders);
router.get('/:id', optionalAuth, getOrder);
router.post('/track', trackOrder);
router.post('/track/cancel', trackCancelOrder);
router.post('/:id/cancel', optionalAuth, cancelOrder);
router.post('/:id/verify-payment', optionalAuth, verifyPayment);

export default router;
