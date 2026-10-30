import { Router } from 'express';
import { addReview, getReviews, voteHelpful, reviewSchema, checkEligibility, checkGuestEligibility, addGuestReview, guestReviewSchema } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

// Get reviews for a product (public)
router.get('/products/:productId', getReviews);

// Check if a registered user is eligible to review
router.get('/products/:productId/eligibility', requireAuth, checkEligibility);

// Add a review (registered users only)
router.post('/products/:productId', requireAuth, validateRequest(reviewSchema), addReview);

// Vote on a review (registered users only)
router.post('/:reviewId/vote', requireAuth, voteHelpful);

// ── Guest Review Routes (no auth required, verified by orderId + email) ──────
router.get('/guest/products/:productId/eligibility', checkGuestEligibility);
router.post('/guest/products/:productId', validateRequest(guestReviewSchema), addGuestReview);

export default router;
