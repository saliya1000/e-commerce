import { Request, Response, NextFunction } from 'express';
import { User, Product, Order, OrderItem } from '@prisma/client';
import prisma from '../prisma';
import { parse } from 'csv-parse/sync';
import { publishRefundStatus } from '../utils/amqp';
import crypto from 'crypto';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const searchStr = String(search).trim();
    
    const query: any = {
      select: { id: true, email: true, firstName: true, lastName: true, role: true, twoFactorEnabled: true, createdAt: true },
      where: {},
      orderBy: { createdAt: 'desc' }
    };

    if (searchStr) {
      query.where.OR = [
        { email: { contains: searchStr, mode: 'insensitive' } },
        { firstName: { contains: searchStr, mode: 'insensitive' } },
        { lastName: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    query.skip = skip;
    query.take = Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany(query),
      prisma.user.count({ where: query.where })
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) { next(error); }
};

import bcrypt from 'bcrypt';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to create users.' });
    }

    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['customer', 'admin', 'superadmin', 'support', 'sales'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role
      }
    });
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
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

export const promoteToAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
      select: { id: true, email: true, role: true }
    });
    res.json({ message: 'User promoted to admin', user: updated });
  } catch (error) { next(error); }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '', paymentStatus, status } = req.query;
    const searchStr = String(search).trim();

    const query: any = {
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: { include: { product: true } },
        payments: true,
        refunds: true
      },
      where: {},
      orderBy: { createdAt: 'desc' }
    };

    if (paymentStatus) {
      query.where.paymentStatus = paymentStatus;
    }

    if (status) {
      query.where.status = status;
    }

    if (searchStr) {
      query.where.OR = [
        { id: { contains: searchStr, mode: 'insensitive' } },
        { user: { email: { contains: searchStr, mode: 'insensitive' } } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    query.skip = skip;
    query.take = Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany(query),
      prisma.order.count({ where: query.where })
    ]);

    res.json({
      data: orders,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const { status, shippingMethod, paymentStatus } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (shippingMethod) data.shippingMethod = shippingMethod;
    if (paymentStatus) data.paymentStatus = paymentStatus;

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
    const { page = 1, limit = 10, search = '', isFeatured, isEnabled } = req.query;
    
    const query: any = { where: {} };

    if (search) {
      const searchStr = String(search).trim();
      query.where.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { category: { name: { contains: searchStr, mode: 'insensitive' } } }
      ];
    }

    if (isFeatured !== undefined && isFeatured !== '') {
      query.where.isFeatured = String(isFeatured) === 'true';
    }

    if (isEnabled !== undefined && isEnabled !== '') {
      query.where.isEnabled = String(isEnabled) === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    query.skip = skip;
    query.take = Number(limit);
    query.include = { 
      category: {
        include: { parent: true }
      }, 
      images: true 
    };
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

export const getAdminReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Total Revenue & Order Count
    // Only count orders that are not Cancelled or Failed
    const revenueStats = await prisma.order.aggregate({
      where: {
        status: {
          notIn: ['CANCELLED']
        }
      },
      _sum: { totalAmount: true },
      _count: true
    });

    // 2. Best-Selling Products (Top 5)
    // Group OrderItem by productId and sum the quantity
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    // Fetch product details for these top items
    const topProducts = await Promise.all(
      topItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, price: true, stockQuantity: true, images: { select: { url: true, thumbnailUrl: true } } }
        });
        return {
          ...product,
          totalSold: item._sum.quantity
        };
      })
    );

    // 3. Low Stock Alerts
    const lowStockProducts = await prisma.product.findMany({
      where: { stockQuantity: { lt: 5 } },
      select: { id: true, name: true, stockQuantity: true },
      orderBy: { stockQuantity: 'asc' }
    });

    // 4. Order Status Breakdown
    const statusBreakdownRaw = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    const statusBreakdown = statusBreakdownRaw.map(item => ({
      status: item.status,
      count: item._count
    }));

    // 5. Total Users Count & New Metrics (AOV, Refund Rate, Sales by Category)
    const totalUsers = await prisma.user.count();

    const avgOrderValue = revenueStats._count > 0 ? Number(revenueStats._sum.totalAmount) / revenueStats._count : 0;

    const totalOrdersCount = await prisma.order.count();
    const cancelledOrdersCount = await prisma.order.count({
      where: { status: 'CANCELLED' }
    });
    const refundRate = totalOrdersCount > 0 ? (cancelledOrdersCount / totalOrdersCount) * 100 : 0;

    const categorySalesRaw = await prisma.orderItem.findMany({
      include: { product: { include: { category: true } } }
    });
    const categorySalesMap: Record<string, number> = {};
    categorySalesRaw.forEach(item => {
      const catName = item.product.category.name;
      if (!categorySalesMap[catName]) categorySalesMap[catName] = 0;
      categorySalesMap[catName] += Number(item.price) * item.quantity;
    });
    const salesByCategory = Object.entries(categorySalesMap).map(([category, revenue]) => ({ category, revenue })).sort((a, b) => b.revenue - a.revenue);

    // 6. Daily Sales for Area Chart (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED'] }
      },
      select: { createdAt: true, totalAmount: true, items: { select: { price: true, cost: true, quantity: true } } }
    });

    const salesByDate: Record<string, any> = {};
    recentOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { date: dateStr, revenue: 0, orders: 0, profit: 0 };
      }
      salesByDate[dateStr].revenue += Number(order.totalAmount);
      salesByDate[dateStr].orders += 1;
      
      const orderRevenue = order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
      const orderCost = order.items.reduce((sum, item) => sum + (Number(item.cost) * item.quantity), 0);
      
      salesByDate[dateStr].profit += (orderRevenue - orderCost); 
    });

    const dailySales = Object.values(salesByDate).sort((a: any, b: any) => a.date.localeCompare(b.date));

    res.json({
      revenue: revenueStats._sum.totalAmount || 0,
      totalOrders: revenueStats._count || 0,
      avgOrderValue,
      refundRate,
      salesByCategory,
      totalUsers,
      topProducts,
      lowStockProducts,
      statusBreakdown,
      dailySales
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let rawRecords: any[] = [];

    if (req.file) {
      // It's a CSV file buffer
      const csvString = req.file.buffer.toString('utf-8');
      try {
        rawRecords = parse(csvString, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
          relax_column_count: true
        });
      } catch (parseErr: any) {
        return res.status(400).json({
          error: `Failed to parse CSV file: ${parseErr.message || 'Invalid CSV format'}`
        });
      }
    } else if (Array.isArray(req.body.products)) {
      rawRecords = req.body.products;
    } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      rawRecords = Array.isArray(req.body) ? req.body : [req.body];
    }

    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      return res.status(400).json({ error: 'No product records found. Please upload a valid CSV file with data.' });
    }

    // Fetch existing categories to resolve Category IDs from names, slugs, or IDs
    const categories = await prisma.category.findMany({
      include: { parent: true }
    });

    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.id.toLowerCase(), cat.id);
      categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      if (cat.parent) {
        categoryMap.set(`${cat.parent.name} > ${cat.name}`.toLowerCase().trim(), cat.id);
        categoryMap.set(`${cat.parent.name}/${cat.name}`.toLowerCase().trim(), cat.id);
      }
    }

    const defaultCategory = categories[0] || null;

    // Helper to find case-insensitive values by synonym keys
    const getField = (row: any, aliases: string[]): any => {
      const rowKeys = Object.keys(row);
      for (const alias of aliases) {
        const foundKey = rowKeys.find(
          k => k.trim().toLowerCase().replace(/[\s_-]/g, '') === alias.toLowerCase().replace(/[\s_-]/g, '')
        );
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
          const val = String(row[foundKey]).trim();
          if (val.length > 0) return val;
        }
      }
      return undefined;
    };

    const productRecords: any[] = [];
    const imageRecords: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rawRecords.length; i++) {
      const r = rawRecords[i];
      const rowNum = i + 1;

      const name = getField(r, ['name', 'product_name', 'productname', 'title']);
      if (!name) {
        // Skip entirely blank rows or flag error if row had other fields
        const hasAnyContent = Object.values(r).some(v => Boolean(v && String(v).trim()));
        if (!hasAnyContent) continue;
        errors.push(`Row ${rowNum}: Product name is missing.`);
        continue;
      }

      // Category resolution
      const rawCat = getField(r, ['categoryId', 'category_id', 'category', 'categoryName', 'category_name']);
      let resolvedCategoryId: string | null = null;

      if (rawCat) {
        const cleanedCat = rawCat.toLowerCase().trim();
        if (categoryMap.has(cleanedCat)) {
          resolvedCategoryId = categoryMap.get(cleanedCat)!;
        } else if (
          cleanedCat === 'replace-with-category-id' ||
          cleanedCat === 'sample-category-id' ||
          cleanedCat === 'replace-with-actual-category-id'
        ) {
          if (defaultCategory) {
            resolvedCategoryId = defaultCategory.id;
          }
        }
      }

      // If category not resolved but we have categories available
      if (!resolvedCategoryId) {
        if (rawCat) {
          errors.push(
            `Row ${rowNum} ("${name}"): Category "${rawCat}" was not found. Available categories: ${categories.map(c => c.name).join(', ')}`
          );
          continue;
        } else if (defaultCategory) {
          resolvedCategoryId = defaultCategory.id;
        } else {
          errors.push(`Row ${rowNum} ("${name}"): No category found. Please create a category first.`);
          continue;
        }
      }

      // Price parsing
      const rawPrice = getField(r, ['price', 'unit_price', 'amount', 'selling_price']);
      let price = 0;
      if (rawPrice !== undefined) {
        const sanitizedPrice = String(rawPrice).replace(/[$,\s]/g, '');
        price = parseFloat(sanitizedPrice);
        if (isNaN(price) || price < 0) price = 0;
      }

      // Cost parsing
      const rawCost = getField(r, ['cost', 'unit_cost', 'cost_price']);
      let cost = 0;
      if (rawCost !== undefined) {
        const sanitizedCost = String(rawCost).replace(/[$,\s]/g, '');
        cost = parseFloat(sanitizedCost);
        if (isNaN(cost) || cost < 0) cost = 0;
      }

      // Stock quantity
      const rawStock = getField(r, ['stockQuantity', 'stock_quantity', 'stock', 'quantity', 'qty']);
      let stockQuantity = 0;
      if (rawStock !== undefined) {
        const sanitizedStock = String(rawStock).replace(/[,\s]/g, '');
        stockQuantity = parseInt(sanitizedStock, 10);
        if (isNaN(stockQuantity) || stockQuantity < 0) stockQuantity = 0;
      }

      // SKU
      const rawSku = getField(r, ['sku', 'product_sku', 'code']);
      const sku = rawSku ? String(rawSku).trim() : null;

      // Description
      const rawDesc = getField(r, ['description', 'desc', 'details', 'body']);
      const description = rawDesc || name;

      // Brand
      const rawBrand = getField(r, ['brand', 'brand_name', 'manufacturer']);
      const brand = rawBrand || null;

      // Generate UUID
      const productId = crypto.randomUUID();

      productRecords.push({
        id: productId,
        name,
        sku,
        description,
        price,
        cost,
        stockQuantity,
        isEnabled: true,
        categoryId: resolvedCategoryId,
        brand
      });

      // Optional image
      const rawImage = getField(r, ['imageUrl', 'image_url', 'image', 'images', 'img', 'photo']);
      if (rawImage) {
        imageRecords.push({
          productId,
          url: rawImage,
          isPrimary: true
        });
      }
    }

    if (errors.length > 0 && productRecords.length === 0) {
      return res.status(400).json({
        error: errors.join('\n'),
        details: errors
      });
    }

    if (productRecords.length === 0) {
      return res.status(400).json({ error: 'No valid products found in the uploaded file.' });
    }

    // Insert products and their images in transaction
    const [createdProducts, createdImages] = await prisma.$transaction(async (tx) => {
      const pResult = await tx.product.createMany({
        data: productRecords,
        skipDuplicates: true
      });

      let iCount = 0;
      if (imageRecords.length > 0) {
        const iResult = await tx.productImage.createMany({
          data: imageRecords
        });
        iCount = iResult.count;
      }

      return [pResult.count, iCount];
    });

    let message = `Successfully imported ${createdProducts} products`;
    if (createdImages > 0) {
      message += ` (with ${createdImages} images)`;
    }
    if (errors.length > 0) {
      message += `. Note: ${errors.length} rows had warnings: ${errors.slice(0, 3).join('; ')}`;
    }

    res.status(201).json({
      message,
      count: createdProducts,
      imagesCount: createdImages,
      warnings: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('bulkUploadProducts error:', error);
    next(error);
  }
};

// --- New Admin Features ---

// Products
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, price, cost, stockQuantity, categoryId, brand, images, isEnabled, isFeatured } = req.body;
    
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any) => ({
            productId: id,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl || null,
            mediumUrl: img.mediumUrl || null,
            isPrimary: Boolean(img.isPrimary)
          }))
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { 
        name, description, price, cost, stockQuantity, categoryId, brand,
        ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) })
      },
      include: { images: true, category: { include: { parent: true } } }
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

export const quickUpdateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { sku, price, stockQuantity, isEnabled, isFeatured } = req.body;
    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: sku !== undefined ? (sku || null) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined
      },
      include: { images: true, category: { include: { parent: true } } }
    });
    res.json(updated);
  } catch (error) { next(error); }
};

// Categories
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, parentId } = req.body;
    const updated = await prisma.category.update({
      where: { id },
      data: { name, description, parentId: parentId || null },
      include: { parent: true, children: true }
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
    const { orderId } = req.params as { orderId: string };
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    const payment = order.payments.find((p: any) => p.status === 'Succeeded');
    const transactionId = payment?.transactionId || undefined;
    
    await publishRefundStatus(orderId, transactionId);

    res.status(200).json({ success: true, message: 'Refund initiated' });
  } catch (error) { next(error); }
};

export const getRefunds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const searchStr = String(search).trim();
    
    const query: any = {
      include: { order: true },
      where: {},
      orderBy: { createdAt: 'desc' }
    };

    if (searchStr) {
      query.where.OR = [
        { orderId: { contains: searchStr, mode: 'insensitive' } },
        { reason: { contains: searchStr, mode: 'insensitive' } },
        { status: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    query.skip = skip;
    query.take = Number(limit);

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany(query),
      prisma.refund.count({ where: query.where })
    ]);

    res.json({
      data: refunds,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) { next(error); }
};

// Delivery Options
export const getDeliveryOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let options = await prisma.deliveryOption.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Auto-seed standard options if table is empty
    if (options.length === 0) {
      await prisma.deliveryOption.createMany({
        data: [
          { name: 'Standard Shipping', description: '3-5 business days', cost: 5.00, estimatedDays: 5, active: true },
          { name: 'Express Shipping', description: '1-2 business days', cost: 15.00, estimatedDays: 2, active: true },
          { name: 'Overnight Shipping', description: 'Next business day', cost: 25.00, estimatedDays: 1, active: true },
        ]
      });
      options = await prisma.deliveryOption.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(options);
  } catch (error) { next(error); }
};

export const getActiveDeliveryOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let options = await prisma.deliveryOption.findMany({
      where: { active: true },
      orderBy: { cost: 'asc' }
    });

    if (options.length === 0) {
      const count = await prisma.deliveryOption.count();
      if (count === 0) {
        await prisma.deliveryOption.createMany({
          data: [
            { name: 'Standard Shipping', description: '3-5 business days', cost: 5.00, estimatedDays: 5, active: true },
            { name: 'Express Shipping', description: '1-2 business days', cost: 15.00, estimatedDays: 2, active: true },
            { name: 'Overnight Shipping', description: 'Next business day', cost: 25.00, estimatedDays: 1, active: true },
          ]
        });
        options = await prisma.deliveryOption.findMany({
          where: { active: true },
          orderBy: { cost: 'asc' }
        });
      }
    }

    res.json(options);
  } catch (error) { next(error); }
};

export const createDeliveryOption = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, cost, estimatedDays, active } = req.body;
    if (!name || cost === undefined) {
      res.status(400).json({ error: 'Name and price are required' });
      return;
    }
    const option = await prisma.deliveryOption.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        cost: Number(cost),
        estimatedDays: Number(estimatedDays) || 1,
        active: active !== undefined ? Boolean(active) : true
      }
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
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(cost !== undefined && { cost: Number(cost) }),
        ...(estimatedDays !== undefined && { estimatedDays: Number(estimatedDays) }),
        ...(active !== undefined && { active: Boolean(active) })
      }
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
import { decrypt } from '../utils/encryption';

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'rejected'
    const where = status ? { status: String(status) } : {};
    const reviews = await prisma.review.findMany({ where, include: { product: true, user: true } });
    
    // Decrypt user data
    const decryptedReviews = reviews.map(r => {
      if (r.user) {
        if (r.user.firstName) r.user.firstName = decrypt(r.user.firstName);
        if (r.user.lastName) r.user.lastName = decrypt(r.user.lastName);
        if (r.user.email) r.user.email = decrypt(r.user.email);
      }
      return r;
    });

    res.json(decryptedReviews);
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



export const getPendingOrderCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.order.count({
      where: { status: 'PENDING' }
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
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

export const downloadPdfReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, reportType } = req.query;

    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({ error: 'Missing startDate, endDate, or reportType parameters' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    // Include end of the day for the end date
    end.setHours(23, 59, 59, 999);

    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #e5e7eb; text-align: left; }
            th { background-color: #f3f4f6; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
    `;

    if (reportType === 'sales' || reportType === 'cost') {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] }
        },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      });

      let totalRevenue = 0;
      let totalCost = 0; // Simulated cost

      let rows = '';
      orders.forEach(order => {
        totalRevenue += Number(order.totalAmount);
        
        order.items.forEach(item => {
          const itemRevenue = Number(item.price) * item.quantity;
          const itemCost = Number(item.cost) * item.quantity; // Exact cost
          totalCost += itemCost;

          if (reportType === 'sales') {
            rows += `
              <tr>
                <td>${order.id.slice(0,8)}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${item.product?.name || 'Unknown'}</td>
                <td>${item.quantity}</td>
                <td>$${itemRevenue.toFixed(2)}</td>
              </tr>
            `;
          } else if (reportType === 'cost') {
            rows += `
              <tr>
                <td>${item.product?.name || 'Unknown'}</td>
                <td>$${itemRevenue.toFixed(2)}</td>
                <td>$${itemCost.toFixed(2)}</td>
                <td>$${(itemRevenue - itemCost).toFixed(2)}</td>
              </tr>
            `;
          }
        });
      });

      if (reportType === 'sales') {
        htmlContent += `
          <h1>Sales Report</h1>
          <p><strong>Date Range:</strong> ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
          <table>
            <thead><tr><th>Order ID</th><th>Date</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">No sales found in this period.</td></tr>'}</tbody>
          </table>
          <div class="total">Total Revenue: $${totalRevenue.toFixed(2)}</div>
        `;
      } else {
        htmlContent += `
          <h1>Cost & Profit Report</h1>
          <p><strong>Date Range:</strong> ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
          <table>
            <thead><tr><th>Product</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">No data found in this period.</td></tr>'}</tbody>
          </table>
          <div class="total">Total Profit: $${(totalRevenue - totalCost).toFixed(2)}</div>
        `;
      }
    } else if (reportType === 'inventory') {
      const products = await prisma.product.findMany({
        where: {
          updatedAt: { gte: start, lte: end } // Show products updated in range
        },
        orderBy: { stockQuantity: 'asc' }
      });

      let rows = '';
      products.forEach(p => {
        rows += `
          <tr>
            <td>${p.id.slice(0,8)}</td>
            <td>${p.name}</td>
            <td>$${Number(p.price).toFixed(2)}</td>
            <td style="color: ${p.stockQuantity < 5 ? 'red' : 'black'}"><strong>${p.stockQuantity}</strong></td>
          </tr>
        `;
      });

      htmlContent += `
        <h1>Inventory Report (Updated within range)</h1>
        <p><strong>Date Range:</strong> ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock Quantity</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">No inventory updates found in this period.</td></tr>'}</tbody>
        </table>
      `;
    }

    htmlContent += `
        </body>
      </html>
    `;

    // Generate PDF using Puppeteer
    const puppeteerModule = await Function('return import("puppeteer")')();
    const puppeteer = puppeteerModule.default || puppeteerModule;
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
    await browser.close();

    // Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report_${startDate}_to_${endDate}.pdf"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('PDF Generation Error:', error);
    next(error);
  }
};

// --- COUPON MANAGEMENT ---

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(coupons);
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, isActive } = req.body;
    
    // Validate uniqueness
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        usageLimit,
        isActive
      }
    });

    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, isActive } = req.body;

    // Check code uniqueness if changed
    if (code) {
      const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id: id as string },
      data: {
        code: code ? code.toUpperCase() : undefined,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        usageLimit,
        isActive
      }
    });

    res.json(coupon);
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id: id as string } });
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};
