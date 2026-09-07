import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.revokedAccessToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating Admin & Customer Users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@happypets.com',
      passwordHash,
      role: 'admin',
    },
  });

  await prisma.user.create({
    data: {
      email: 'customer@happypets.com',
      passwordHash,
      role: 'customer',
    },
  });

  console.log('Creating Categories...');
  const foodCategory = await prisma.category.create({
    data: {
      name: 'Premium Pet Food',
      description: 'High quality nutrition for your furry friends.',
    },
  });

  const toyCategory = await prisma.category.create({
    data: {
      name: 'Interactive Toys',
      description: 'Keep your pets engaged and happy!',
    },
  });

  const accessoryCategory = await prisma.category.create({
    data: {
      name: 'Accessories',
      description: 'Collars, leashes, and beds.',
    },
  });

  console.log('Creating Products...');
  
  const products = [
    {
      name: 'HappyPaws Organic Dog Kibble',
      description: 'Grain-free, organic chicken recipe for adult dogs.',
      price: 45.99,
      stockQuantity: 100,
      categoryId: foodCategory.id,
      brand: 'HappyPaws',
      weightMetric: 15.0,
      rating: 4.8,
      reviewCount: 124,
      images: {
        create: [
          { url: '/images/dog_kibble_1787664582569.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'Purrfect Catch Tuna Feast',
      description: 'Wet cat food made with real tuna and salmon.',
      price: 24.50,
      stockQuantity: 200,
      categoryId: foodCategory.id,
      brand: 'Purrfect',
      weightMetric: 5.0,
      rating: 4.5,
      reviewCount: 89,
      images: {
        create: [
          { url: '/images/cat_tuna_feast_1787664594060.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'ToughChew Bone Toy',
      description: 'Indestructible rubber bone for aggressive chewers.',
      price: 12.99,
      stockQuantity: 50,
      categoryId: toyCategory.id,
      brand: 'ToughChew',
      weightMetric: 0.5,
      rating: 4.9,
      reviewCount: 342,
      images: {
        create: [
          { url: '/images/bone_toy_1787664606581.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'FeatherWand Cat Teaser',
      description: 'Interactive wand toy with real feathers and a bell.',
      price: 8.99,
      stockQuantity: 120,
      categoryId: toyCategory.id,
      brand: 'FeatherWand',
      weightMetric: 0.1,
      rating: 4.2,
      reviewCount: 56,
      images: {
        create: [
          { url: '/images/cat_teaser_1787664618833.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'Plush Calming Pet Bed',
      description: 'Donut-shaped faux fur bed for ultimate comfort and anxiety relief.',
      price: 35.00,
      stockQuantity: 30,
      categoryId: accessoryCategory.id,
      brand: 'CozyPet',
      weightMetric: 2.0,
      rating: 4.7,
      reviewCount: 210,
      images: {
        create: [
          { url: '/images/pet_bed_1787664629185.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'Reflective Nylon Leash',
      description: '6-foot heavy duty leash with reflective stitching for night walks.',
      price: 15.99,
      stockQuantity: 80,
      categoryId: accessoryCategory.id,
      brand: 'SafeWalk',
      weightMetric: 0.3,
      rating: 4.6,
      reviewCount: 112,
      images: {
        create: [
          { url: '/images/nylon_leash_1787664641203.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'Luxury Pet Travel Carrier',
      description: 'Airline approved, stylish and breathable carrier for small dogs and cats.',
      price: 89.99,
      stockQuantity: 40,
      categoryId: accessoryCategory.id,
      brand: 'Aurelia',
      weightMetric: 3.5,
      rating: 4.9,
      reviewCount: 310,
      images: {
        create: [
          { url: 'http://localhost:3000/uploads/image-1788787629632-123456781.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'Felix & Co. Laser Pointer Toy',
      description: 'Interactive sleek laser pointer toy to keep your pets entertained for hours.',
      price: 19.50,
      stockQuantity: 150,
      categoryId: toyCategory.id,
      brand: 'Felix & Co.',
      weightMetric: 0.2,
      rating: 4.8,
      reviewCount: 425,
      images: {
        create: [
          { url: 'http://localhost:3000/uploads/image-1788787650779-123456782.png', isPrimary: true }
        ]
      }
    },
    {
      name: 'Feline Finery Salmon Treats',
      description: 'Premium salmon flavor cat treats made with real Atlantic salmon.',
      price: 14.99,
      stockQuantity: 300,
      categoryId: foodCategory.id,
      brand: 'Feline Finery',
      weightMetric: 0.3,
      rating: 4.7,
      reviewCount: 289,
      images: {
        create: [
          { url: 'http://localhost:3000/uploads/image-1788787670706-123456783.png', isPrimary: true }
        ]
      }
    }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
