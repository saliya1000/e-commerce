import { Router } from 'express';
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, createSetupIntent } from '../controllers/paymentMethod.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getPaymentMethods);
router.post('/setup-intent', createSetupIntent);
router.post('/', createPaymentMethod);
router.put('/:id', updatePaymentMethod);
router.delete('/:id', deletePaymentMethod);

export default router;
