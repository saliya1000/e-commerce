import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import Joi from 'joi';

export const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null).optional()
});

export const addReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params as { productId: string };
    const { rating, comment } = req.body;

    const existingReview = await prisma.review.findFirst({
      where: { userId, productId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Verify the user actually purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED'
        }
      }
    });

    if (!hasPurchased) {
      return res.status(403).json({ error: 'You can only review products that you have successfully purchased.' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment
      },
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    // Update product average rating
    await updateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

import { decrypt } from '../utils/encryption';

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params as { productId: string };
    const reviews = await prisma.review.findMany({
      where: { productId, status: 'approved' },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: [
        { helpfulVotes: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    const decryptedReviews = reviews.map(r => {
      if (r.user) {
        if (r.user.firstName) r.user.firstName = decrypt(r.user.firstName);
        if (r.user.lastName) r.user.lastName = decrypt(r.user.lastName);
      }
      // Attach a unified displayName for the frontend
      return {
        ...r,
        displayName: r.user
          ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim()
          : (r.guestName || 'Guest')
      };
    });

    res.json(decryptedReviews);
  } catch (error) {
    next(error);
  }
};

export const voteHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { reviewId } = req.params as { reviewId: string };

    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: { reviewId, userId }
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You already voted on this review' });
    }

    await prisma.$transaction([
      prisma.reviewVote.create({
        data: { reviewId, userId }
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulVotes: { increment: 1 } }
      })
    ]);

    res.json({ message: 'Vote recorded' });
  } catch (error) {
    next(error);
  }
};

async function updateProductRating(productId: string) {
  const aggr = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true }
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggr._avg.rating || 0,
      reviewCount: aggr._count.id
    }
  });
}

export const checkEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params as { productId: string };

    const existingReview = await prisma.review.findFirst({
      where: { userId, productId }
    });

    if (existingReview) {
      return res.json({ eligible: false, reason: 'You have already reviewed this product' });
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED'
        }
      }
    });

    if (!hasPurchased) {
      return res.json({ eligible: false, reason: 'Only users who have purchased and received this product can leave a review.' });
    }

    res.json({ eligible: true });
  } catch (error) {
    next(error);
  }
};

// ─── Guest Review Endpoints ───────────────────────────────────────────────────

export const guestReviewSchema = Joi.object({
  orderId:  Joi.string().uuid().required(),
  email:    Joi.string().email().required(),
  rating:   Joi.number().integer().min(1).max(5).required(),
  comment:  Joi.string().allow('', null).optional(),
  guestName: Joi.string().allow('', null).optional()
});

/** Check if a guest is eligible to review a product (orderId + email verification) */
export const checkGuestEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params as { productId: string };
    const { orderId, email } = req.query as { orderId: string; email: string };

    if (!orderId || !email) {
      return res.status(400).json({ eligible: false, reason: 'orderId and email are required.' });
    }

    // Verify the order belongs to this email and is delivered
    const order = await prisma.order.findFirst({
      where: { id: orderId, status: 'DELIVERED' },
      include: { items: { where: { productId } } }
    });

    const shippingAddr: any = order?.shippingAddress
      ? (typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress)
      : null;

    if (!order || shippingAddr?.email?.toLowerCase() !== email.toLowerCase()) {
      return res.json({ eligible: false, reason: 'No delivered order found with these details.' });
    }

    if (!order.items || order.items.length === 0) {
      return res.json({ eligible: false, reason: 'This product was not part of that order.' });
    }

    // Check if already reviewed from this order
    const existingReview = await prisma.review.findUnique({
      where: { guestOrderId_productId: { guestOrderId: orderId, productId } }
    });

    if (existingReview) {
      return res.json({ eligible: false, reason: 'You have already submitted a review for this product.' });
    }

    res.json({ eligible: true });
  } catch (error) {
    next(error);
  }
};

/** Submit a guest review after verifying orderId + email */
export const addGuestReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params as { productId: string };
    const { orderId, email, rating, comment, guestName } = req.body;

    // Verify order exists, is delivered, and email matches
    const order = await prisma.order.findFirst({
      where: { id: orderId, status: 'DELIVERED' },
      include: { items: { where: { productId } } }
    });

    const shippingAddr: any = order?.shippingAddress
      ? (typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress)
      : null;

    if (!order || shippingAddr?.email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Order verification failed. Please check your order ID and email.' });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(403).json({ error: 'This product was not part of that order.' });
    }

    // Create the review (unique constraint on guestOrderId+productId prevents duplicates)
    const review = await prisma.review.create({
      data: {
        productId,
        guestOrderId: orderId,
        guestEmail: email,
        guestName: guestName || shippingAddr?.name || 'Guest',
        rating,
        comment
      }
    });

    await updateProductRating(productId);

    res.status(201).json(review);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You have already submitted a review for this product.' });
    }
    next(error);
  }
};

