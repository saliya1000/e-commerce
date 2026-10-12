import { Router } from 'express';
import { getStorefrontHome } from '../controllers/storefront.controller';

const router = Router();

router.get('/home', getStorefrontHome);

export default router;
