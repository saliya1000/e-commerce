import { Router } from 'express';
import { validateAddress, checkout, getOrders, verifyPayment, getOrder, cancelOrder, trackOrder, trackCancelOrder, checkoutSchema, trackOrderSchema } from '../controllers/order.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.post('/validate-address', optionalAuth, validateRequest(checkoutSchema), validateAddress);
router.post('/checkout', optionalAuth, validateRequest(checkoutSchema), checkout);
router.get('/', requireAuth, getOrders);
router.get('/:id', optionalAuth, getOrder);
router.post('/track', validateRequest(trackOrderSchema), trackOrder);
router.post('/track/cancel', validateRequest(trackOrderSchema), trackCancelOrder);
router.post('/:id/cancel', optionalAuth, cancelOrder);
router.post('/:id/verify-payment', optionalAuth, verifyPayment);

export default router;
