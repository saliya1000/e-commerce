import { Router } from 'express';
import { addReview, getReviews, voteHelpful, reviewSchema } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

// Get reviews for a product
router.get('/products/:productId', getReviews);

// Add a review
router.post('/products/:productId', requireAuth, validateRequest(reviewSchema), addReview);

// Vote on a review
router.post('/:reviewId/vote', requireAuth, voteHelpful);

export default router;
