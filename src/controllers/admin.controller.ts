import { Request, Response, NextFunction } from 'express';
import { User, Product, Order, OrderItem } from '@prisma/client';
import puppeteer from 'puppeteer';
import prisma from '../prisma';
import { parse } from 'csv-parse/sync';

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
    const { page = 1, limit = 10, search = '' } = req.query;
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

export const getAdminReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Total Revenue & Order Count
    // Only count orders that are not Cancelled or Failed
    const revenueStats = await prisma.order.aggregate({
      where: {
        status: {
          notIn: ['Cancelled', 'Payment Failed']
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
          select: { id: true, name: true, price: true, stockQuantity: true }
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
      where: { status: { in: ['Cancelled', 'Payment Failed'] } }
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
        status: { notIn: ['Cancelled', 'Payment Failed'] }
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
    let products: any[] = [];
    if (req.file) {
      // It's a CSV file
      const csvString = req.file.buffer.toString('utf-8');
      const records = parse(csvString, { columns: true, skip_empty_lines: true });
      products = records.map((r: any) => ({
        name: r.name,
        sku: r.sku || null,
        description: r.description,
        price: parseFloat(r.price),
        cost: r.cost ? parseFloat(r.cost) : 0,
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
    const { name, description, price, cost, stockQuantity, categoryId, brand } = req.body;
    const updated = await prisma.product.update({
      where: { id },
      data: { name, description, price, cost, stockQuantity, categoryId, brand }
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
    const { sku, price, stockQuantity } = req.body;
    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: sku || null,
        price: price !== undefined ? Number(price) : undefined,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
      }
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
          status: { notIn: ['Cancelled', 'Payment Failed'] }
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
