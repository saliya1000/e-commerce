import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress, addressSchema } from '../controllers/address.controller';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

router.get('/', getAddresses);
router.post('/', validateRequest(addressSchema), createAddress);
router.put('/:id', validateRequest(addressSchema), updateAddress);
router.delete('/:id', deleteAddress);

export default router;
