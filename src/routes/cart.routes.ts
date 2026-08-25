import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, mergeCart } from '../controllers/cart.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router = Router();

router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addToCart);
router.put('/items/:id', optionalAuth, updateCartItem);
router.delete('/items/:id', optionalAuth, removeFromCart);
router.post('/merge', requireAuth, mergeCart);

export default router;
