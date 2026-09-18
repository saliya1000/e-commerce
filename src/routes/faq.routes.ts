import { Router } from 'express';
import { getFaqs } from '../controllers/admin.controller';

const router = Router();

// Public FAQ endpoint
router.get('/', getFaqs);

export default router;
