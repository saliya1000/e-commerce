import { Router } from 'express';
import { createCategory, getCategories, createProduct, getProducts, getProductById, suggestProducts, uploadImage } from '../controllers/product.controller';
import { upload } from '../middlewares/upload';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

// Categories
router.get('/categories', getCategories);
router.post('/categories', requireAuth, requireRole('admin'), createCategory);

// Products
router.get('/', getProducts);
router.get('/suggest', suggestProducts);
router.get('/:id', getProductById);
router.post('/', requireAuth, requireRole('admin'), createProduct);

// File Upload (Admin only for product images)
router.post('/upload', requireAuth, requireRole('admin'), upload.single('image'), uploadImage);

export default router;
