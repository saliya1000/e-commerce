import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { parse } from 'csv-parse/sync';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, twoFactorEnabled: true, createdAt: true
      }
    });
    res.json(users);
  } catch (error) { next(error); }
};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only superadmin can change roles (Principle of Least Privilege)
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmins can change user roles.' });
    }

    const { userId } = req.params as { userId: string };
    const { role } = req.body;
    if (!['customer', 'admin', 'superadmin', 'support', 'sales'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        },
        items: {
          include: { product: true }
        },
        payments: true,
        refunds: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const { status, shippingMethod } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (shippingMethod) data.shippingMethod = shippingMethod;

    const order = await prisma.order.update({
      where: { id: orderId },
      data
    });
    res.json(order);
  } catch (error) { next(error); }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params as { reviewId: string };
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await prisma.review.delete({ where: { id: reviewId } });

    const aggr = await prisma.review.aggregate({
      where: { productId: review.productId, status: 'approved' },
      _avg: { rating: true },
      _count: { id: true }
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: aggr._avg.rating || 0, reviewCount: aggr._count.id }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) { next(error); }
};

export const getAdminProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query: any = { where: {} };

    if (search) {
      const searchStr = String(search).trim();
      query.where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { category: { name: { contains: searchStr, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    query.skip = skip;
    query.take = Number(limit);
    query.include = { category: true, images: true };
    query.orderBy = { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany(query),
      prisma.product.count({ where: query.where })
    ]);

    res.json({
      data: products,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let products: any[] = [];
    if (req.file) {
      // It's a CSV file
      const csvString = req.file.buffer.toString('utf-8');
      const records = parse(csvString, { columns: true, skip_empty_lines: true });
      products = records.map((r: any) => ({
        name: r.name,
        description: r.description,
        price: parseFloat(r.price),
        stockQuantity: parseInt(r.stockQuantity, 10),
        categoryId: r.categoryId,
        brand: r.brand
      }));
    } else {
      products = req.body.products;
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Expected an array of products or a valid CSV file' });
    }

    const created = await prisma.product.createMany({
      data: products,
      skipDuplicates: true
    });

    res.status(201).json({ message: `${created.count} products created successfully` });
  } catch (error) { next(error); }
};

// --- New Admin Features ---

// Products
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, price, stockQuantity, categoryId, brand } = req.body;
    const updated = await prisma.product.update({
      where: { id },
      data: { name, description, price, stockQuantity, categoryId, brand }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) { next(error); }
};

// Categories
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, parentId } = req.body;
    const updated = await prisma.category.update({
      where: { id },
      data: { name, description, parentId }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) { next(error); }
};

// Refunds
export const createRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, reason } = req.body;
    const refund = await prisma.refund.create({
      data: { orderId, amount, reason, status: 'completed' }
    });
    res.status(201).json(refund);
  } catch (error) { next(error); }
};

export const getRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refunds = await prisma.refund.findMany({ include: { order: true } });
    res.json(refunds);
  } catch (error) { next(error); }
};

// Delivery Options
export const getDeliveryOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const options = await prisma.deliveryOption.findMany();
    res.json(options);
  } catch (error) { next(error); }
};

export const createDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, cost, estimatedDays, active } = req.body;
    const option = await prisma.deliveryOption.create({
      data: { name, description, cost, estimatedDays, active }
    });
    res.status(201).json(option);
  } catch (error) { next(error); }
};

export const updateDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, cost, estimatedDays, active } = req.body;
    const updated = await prisma.deliveryOption.update({
      where: { id },
      data: { name, description, cost, estimatedDays, active }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

export const deleteDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.deliveryOption.delete({ where: { id } });
    res.json({ message: 'Delivery option deleted successfully' });
  } catch (error) { next(error); }
};

// Review Moderation
export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected'
    const where = status ? { status: String(status) } : {};
    const reviews = await prisma.review.findMany({ where, include: { product: true, user: true } });
    res.json(reviews);
  } catch (error) { next(error); }
};

export const updateReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params as { reviewId: string };
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status }
    });

    if (status === 'approved') {
      const aggr = await prisma.review.aggregate({
        where: { productId: updated.productId, status: 'approved' },
        _avg: { rating: true },
        _count: { id: true }
      });
      await prisma.product.update({
        where: { id: updated.productId },
        data: { rating: aggr._avg.rating || 0, reviewCount: aggr._count.id }
      });
    }

    res.json(updated);
  } catch (error) { next(error); }
};

// FAQs
export const getFaqs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { order: 'asc' } });
    res.json(faqs);
  } catch (error) { next(error); }
};

export const createFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, answer, order } = req.body;
    const faq = await prisma.faq.create({
      data: { question, answer, order: order || 0 }
    });
    res.status(201).json(faq);
  } catch (error) { next(error); }
};

export const updateFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { question, answer, order } = req.body;
    const updated = await prisma.faq.update({
      where: { id },
      data: { question, answer, order }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

export const deleteFaq = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.faq.delete({ where: { id } });
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) { next(error); }
};
