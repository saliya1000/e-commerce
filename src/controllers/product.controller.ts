import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, parentId } = req.body;
    const category = await prisma.category.create({
      data: { name, description, parentId }
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      include: { children: true }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      name, description, price, stockQuantity, categoryId, brand, 
      weightMetric, weightImperial, lengthMetric, widthMetric, heightMetric,
      lengthImperial, widthImperial, heightImperial,
      attributes, images 
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name, description, price, stockQuantity, categoryId, brand,
        weightMetric, weightImperial, lengthMetric, widthMetric, heightMetric,
        lengthImperial, widthImperial, heightImperial,
        attributes: {
          create: attributes || []
        },
        images: {
          create: images || []
        }
      },
      include: { attributes: true, images: true }
    });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// Faceted search and filtering
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      q, categoryId, brand, minPrice, maxPrice, 
      sortBy, sortOrder, 
      page = 1, limit = 10 
    } = req.query;

    const query: any = { where: {} };

    // Search by name or description
    if (q) {
      query.where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } }
      ];
    }

    if (categoryId) query.where.categoryId = String(categoryId);
    if (brand) query.where.brand = String(brand);
    
    if (minPrice || maxPrice) {
      query.where.price = {};
      if (minPrice) query.where.price.gte = Number(minPrice);
      if (maxPrice) query.where.price.lte = Number(maxPrice);
    }

    // Sorting
    if (sortBy && sortBy !== 'relevance') {
      const order = String(sortOrder).toLowerCase() === 'desc' ? 'desc' : 'asc';
      query.orderBy = { [String(sortBy)]: order };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    query.skip = skip;
    query.take = Number(limit);
    query.include = { images: true, category: true };

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

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      include: { images: true, attributes: true, category: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Dynamic search suggestions
export const suggestProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const suggestions = await prisma.product.findMany({
      where: {
        name: { contains: String(q), mode: 'insensitive' }
      },
      select: { id: true, name: true, brand: true },
      take: 5
    });
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
};

// Upload Product Image
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    // Construct public URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.status(201).json({ url: imageUrl });
  } catch (error) {
    next(error);
  }
};

