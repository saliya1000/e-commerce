import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(null, '').optional(),
  parentId: Joi.string().uuid().allow(null, '').optional()
});

export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  stockQuantity: Joi.number().integer().min(0).required(),
  categoryId: Joi.string().uuid().required(),
  brand: Joi.string().allow(null, '').optional(),
  weightMetric: Joi.number().positive().allow(null, '').optional(),
  weightImperial: Joi.number().positive().allow(null, '').optional(),
  lengthMetric: Joi.number().positive().allow(null, '').optional(),
  widthMetric: Joi.number().positive().allow(null, '').optional(),
  heightMetric: Joi.number().positive().allow(null, '').optional(),
  lengthImperial: Joi.number().positive().allow(null, '').optional(),
  widthImperial: Joi.number().positive().allow(null, '').optional(),
  heightImperial: Joi.number().positive().allow(null, '').optional(),
  attributes: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required()
  })).optional(),
  images: Joi.array().items(Joi.object({
    url: Joi.string().uri().required(),
    isPrimary: Joi.boolean().optional()
  })).optional()
});

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

    // Search by name or description using PostgreSQL fullTextSearch
    if (q) {
      const searchQuery = String(q).trim().split(/\s+/).join(' | ');
      query.where.OR = [
        { name: { search: searchQuery } },
        { description: { search: searchQuery } }
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
    const queryStr = req.query.query || req.query.q;
    if (!queryStr) return res.json([]);

    const searchStr = String(queryStr).trim();
    const suggestions = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchStr, mode: 'insensitive' } },
          { description: { contains: searchStr, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, brand: true, price: true, images: true },
      take: 6
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

