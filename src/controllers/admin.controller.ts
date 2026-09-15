import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string };
    const { role } = req.body;
    
    if (!['customer', 'admin', 'support', 'sales'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params as { reviewId: string };
    
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await prisma.review.delete({
      where: { id: reviewId }
    });

    // Update product rating
    const aggr = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { id: true }
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: aggr._avg.rating || 0,
        reviewCount: aggr._count.id
      }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = req.body.products;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Expected an array of products' });
    }

    // A simplified bulk creation using Prisma
    // Assuming each product object matches schema properties for simple creation
    const created = await prisma.product.createMany({
      data: products,
      skipDuplicates: true
    });

    res.status(201).json({ message: `${created.count} products created successfully` });
  } catch (error) {
    next(error);
  }
};
