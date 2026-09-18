import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, mergeCart, addToCartSchema, updateCartItemSchema, mergeCartSchema } from '../controllers/cart.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, validateRequest(addToCartSchema), addToCart);
router.put('/items/:id', optionalAuth, validateRequest(updateCartItemSchema), updateCartItem);
router.delete('/items/:id', optionalAuth, removeFromCart);
router.post('/merge', requireAuth, validateRequest(mergeCartSchema), mergeCart);

export default router;
