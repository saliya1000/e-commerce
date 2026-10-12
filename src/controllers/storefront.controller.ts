import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

const defaultCategoryImages: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&q=80',
  toys: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&q=80',
  accessories: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600&q=80',
  dogs: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80',
  cats: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
  birds: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600&q=80'
};

const getCategoryFallbackImage = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, img] of Object.entries(defaultCategoryImages)) {
    if (lower.includes(key)) return img;
  }
  return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80';
};

export const getStorefrontHome = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Fetch top-level categories / collections
    const rawCategories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { products: true, children: true } },
        products: {
          where: { isEnabled: true },
          take: 1,
          include: { images: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const collections = rawCategories.map((cat) => {
      const primaryProductImg = cat.products[0]?.images.find((img) => img.isPrimary) || cat.products[0]?.images[0];
      const thumbnail = cat.imageUrl || getCategoryFallbackImage(cat.name) || primaryProductImg?.mediumUrl || primaryProductImg?.url;

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description || `Explore our ${cat.name.toLowerCase()} collection`,
        imageUrl: thumbnail,
        thumbnailUrl: thumbnail,
        productCount: cat._count.products,
        subcategoriesCount: cat._count.children
      };
    });

    // 2. Fetch featured products (default 10 for clean 5-column rows)
    const limit = Number(req.query.limit) || 10;
    let featuredProducts = await prisma.product.findMany({
      where: { isEnabled: true, isFeatured: true },
      take: limit,
      include: { images: true, category: true },
      orderBy: { rating: 'desc' }
    });

    // If fewer than limit marked as isFeatured, backfill with top-rated/bestselling enabled products
    if (featuredProducts.length < limit) {
      const existingIds = featuredProducts.map((p) => p.id);
      const additional = await prisma.product.findMany({
        where: {
          isEnabled: true,
          id: { notIn: existingIds }
        },
        take: limit - featuredProducts.length,
        include: { images: true, category: true },
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      featuredProducts = [...featuredProducts, ...additional];
    }

    res.json({
      collections,
      featuredProducts
    });
  } catch (error) {
    next(error);
  }
};
