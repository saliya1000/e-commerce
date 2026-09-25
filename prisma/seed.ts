import { PrismaClient, PaymentStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.reviewVote.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users (1 admin, 20 customers)
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    }
  });

  const users = [];
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        passwordHash,
        firstName: `User${i}`,
        lastName: `Customer`,
        role: 'customer',
        addresses: {
          create: {
            firstName: `User${i}`,
            lastName: `Customer`,
            addressLine1: `123 Main St ${i}`,
            city: `City ${i}`,
            postalCode: `1000${i}`,
            country: 'USA',
            isDefault: true,
          }
        }
      }
    });
    users.push(user);
  }

  // 2. Categories
  const categoryNames = ['Food', 'Toys', 'Accessories'];
  const categories: any = {};
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name, description: `Premium pet ${name.toLowerCase()}` }
    });
    categories[name] = category;
  }

  // 3. Products (9 real pet products)
  const productData = [
    {
      name: 'Premium Adult Dry Dog Food',
      sku: 'FOOD-DOG-01',
      description: 'High-quality, protein-rich dry dog food formulated for adult dogs. Promotes healthy coat and strong muscles.',
      price: '45.99', cost: '25.00', categoryId: categories['Food'].id, brand: 'Purina',
      images: [
        { url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80', isPrimary: false }
      ]
    },
    {
      name: 'Interactive Laser Cat Toy',
      sku: 'TOY-CAT-01',
      description: 'Keep your cat entertained for hours with this automatic laser pointer toy with multiple speed settings.',
      price: '24.50', cost: '10.00', categoryId: categories['Toys'].id, brand: 'Kong',
      images: [
        { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Orthopedic Memory Foam Dog Bed',
      sku: 'ACC-DOG-01',
      description: 'Provide ultimate comfort for your furry friend with this plush orthopedic memory foam bed. Ideal for older dogs.',
      price: '89.99', cost: '40.00', categoryId: categories['Accessories'].id, brand: 'Furhaven',
      images: [
        { url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Grain-Free Salmon Cat Food',
      sku: 'FOOD-CAT-01',
      description: 'Delicious grain-free cat food made with real salmon. Perfect for cats with sensitive stomachs.',
      price: '32.99', cost: '18.00', categoryId: categories['Food'].id, brand: 'Blue Buffalo',
      images: [
        { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Squeaky Rubber Dog Bone',
      sku: 'TOY-DOG-01',
      description: 'Durable rubber chew toy with a built-in squeaker. Great for aggressive chewers and interactive fetch games.',
      price: '12.99', cost: '4.50', categoryId: categories['Toys'].id, brand: 'Kong',
      images: [
        { url: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Reflective Adjustable Cat Collar',
      sku: 'ACC-CAT-01',
      description: 'Keep your cat safe with this highly visible reflective collar, featuring a breakaway safety buckle and a small bell.',
      price: '9.99', cost: '3.00', categoryId: categories['Accessories'].id, brand: 'PetSafe',
      images: [
        { url: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Large Iron Bird Cage with Stand',
      sku: 'ACC-BIRD-01',
      description: 'Spacious and sturdy iron bird cage featuring multiple wooden perches, feeding bowls, and a rolling stand.',
      price: '145.00', cost: '80.00', categoryId: categories['Accessories'].id, brand: 'Prevue',
      images: [
        { url: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Premium Wild Bird Seed Mix',
      sku: 'FOOD-BIRD-01',
      description: 'Nutritious blend of sunflower seeds, peanuts, and millet to attract a variety of beautiful wild birds.',
      price: '18.50', cost: '9.00', categoryId: categories['Food'].id, brand: 'Kaytee',
      images: [
        { url: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    },
    {
      name: 'Professional Pet Grooming Brush',
      sku: 'ACC-GROOM-01',
      description: 'Self-cleaning slicker brush that gently removes loose hair and eliminates tangles, knots, and trapped dirt.',
      price: '16.99', cost: '5.50', categoryId: categories['Accessories'].id, brand: 'Hertzko',
      images: [
        { url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80', isPrimary: true }
      ]
    }
  ];

  const products = [];
  for (const prodData of productData) {
    const product = await prisma.product.create({
      data: {
        name: prodData.name,
        sku: prodData.sku,
        description: prodData.description,
        price: prodData.price,
        cost: prodData.cost,
        stockQuantity: Math.floor(Math.random() * 100) + 10,
        categoryId: prodData.categoryId,
        brand: prodData.brand,
        rating: (Math.random() * 1 + 4).toFixed(2), // 4 to 5 rating
        reviewCount: 3, 
        images: {
          create: prodData.images
        }
      }
    });
    products.push(product);
  }

  // 4. Coupons
  for (let i = 1; i <= 3; i++) {
    await prisma.coupon.create({
      data: {
        code: `DISCOUNT${i}0`,
        discountType: i % 2 === 0 ? 'percentage' : 'fixed',
        discountValue: i * 10,
        isActive: true,
      }
    });
  }

  // 5. FAQ (10)
  for (let i = 1; i <= 10; i++) {
    await prisma.faq.create({
      data: {
        question: `Frequently Asked Question ${i}?`,
        answer: `This is the detailed answer to question ${i}. It provides all the necessary information.`,
        order: i
      }
    });
  }

  // 6. Reviews (for all products, 3 each)
  for (const product of products) {
    for (let i = 0; i < 3; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: user.id,
          rating: Math.floor(Math.random() * 3) + 3, // 3 to 5 rating
          comment: `Great product, really enjoyed using it. Would recommend! (${i+1})`,
          status: 'approved',
        }
      });
    }
  }

  // 7. Orders & Payments (50)
  const orderStatuses = Object.values(OrderStatus);
  const paymentStatuses = ['succeeded', 'pending', 'failed']; 
  const paymentStatusEnums = Object.values(PaymentStatus); 

  for (let i = 1; i <= 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const product1 = products[Math.floor(Math.random() * products.length)];
    const product2 = products[Math.floor(Math.random() * products.length)];
    
    const quantity1 = Math.floor(Math.random() * 3) + 1;
    const quantity2 = Math.floor(Math.random() * 2) + 1;

    const totalAmount = (Number(product1.price) * quantity1) + (Number(product2.price) * quantity2);

    const ordStatus = orderStatuses[i % orderStatuses.length];
    const payStatusEnum = paymentStatusEnums[i % paymentStatusEnums.length];
    const payProviderStatus = paymentStatuses[i % paymentStatuses.length];

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: ordStatus,
        paymentStatus: payStatusEnum,
        totalAmount: totalAmount.toFixed(2),
        shippingAddress: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          addressLine1: '123 Order St',
          city: 'Order City',
          postalCode: '10001',
          country: 'USA'
        }),
        shippingMethod: 'standard',
        shippingCost: 0,
        items: {
          create: [
            { productId: product1.id, quantity: quantity1, price: product1.price, cost: product1.cost },
            { productId: product2.id, quantity: quantity2, price: product2.price, cost: product2.cost }
          ]
        }
      }
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount.toFixed(2),
        status: payProviderStatus, 
        provider: 'stripe',
        transactionId: `txn_fake_${i}_${Date.now()}`
      }
    });
  }

  console.log('Seed data successfully generated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
