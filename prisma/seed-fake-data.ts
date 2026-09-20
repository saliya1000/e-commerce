import prisma from '../src/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Generating fake data for testing...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create 6 Categories
  console.log('Creating 6 Categories...');
  const categoryNames = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Toys', 'Books'];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        name,
        description: `Description for ${name}`,
      },
    });
    categories.push(category);
  }

  // 2. Create 15 Users
  console.log('Creating 15 Users...');
  const users = [];
  for (let i = 1; i <= 15; i++) {
    const user = await prisma.user.create({
      data: {
        email: `fakeuser${i}@example.com`,
        passwordHash,
        firstName: `Fake${i}`,
        lastName: `User${i}`,
        role: 'customer',
      },
    });
    users.push(user);
  }

  // 3. Create a dummy product to attach to orders
  console.log('Creating a dummy product...');
  const product = await prisma.product.create({
    data: {
      name: 'Fake Product',
      description: 'A fake product for testing orders',
      price: 99.99,
      stockQuantity: 100,
      categoryId: categories[0].id,
    },
  });

  // 4. Create 10 Orders
  console.log('Creating 10 Orders...');
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const user = users[i % users.length];
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: 'Delivered',
        totalAmount: 104.99,
        shippingCost: 5.0,
        shippingMethod: 'standard',
        shippingAddress: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          addressLine1: `123 Fake St ${i}`,
          city: 'Fake City',
          postalCode: '10001',
          phoneNumber: '1234567890',
          country: 'USA',
        }),
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        price: 99.99,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: 104.99,
        status: 'Succeeded',
        provider: 'stripe',
        transactionId: `pi_fake_${Date.now()}_${i}`,
      },
    });

    orders.push(order);
  }

  // 5. Create 3 Refunds
  console.log('Creating 3 Refunds...');
  for (let i = 0; i < 3; i++) {
    await prisma.refund.create({
      data: {
        orderId: orders[i].id,
        amount: 104.99,
        reason: 'Customer requested',
        status: 'completed',
      },
    });
  }

  // 6. Create 5 FAQs
  console.log('Creating 5 FAQs...');
  for (let i = 1; i <= 5; i++) {
    await prisma.faq.create({
      data: {
        question: `Fake Question ${i}?`,
        answer: `This is a fake answer for question ${i}.`,
        order: i,
      },
    });
  }

  console.log('Fake data generation completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
