import { Router } from 'express';
import { getActiveDeliveryOptions } from '../controllers/admin.controller';

const router = Router();

// Public endpoint for customers to fetch active/enabled delivery options for checkout
router.get('/', getActiveDeliveryOptions);

export default router;
