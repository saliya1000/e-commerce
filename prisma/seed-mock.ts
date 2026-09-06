import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating additional mock data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create a test user with a lot of data
  const testUser = await prisma.user.create({
    data: {
      email: 'testuser@example.com',
      passwordHash,
      role: 'customer',
      stripeCustomerId: 'cus_mock123456789',
    },
  });
  console.log(`Created test user: ${testUser.email}`);

  // 2. Create Addresses for test user
  await prisma.address.createMany({
    data: [
      {
        userId: testUser.id,
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        isDefault: true,
      },
      {
        userId: testUser.id,
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '456 Office Blvd',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        isDefault: false,
      },
    ],
  });

  // 3. Create Payment Methods
  await prisma.paymentMethod.createMany({
    data: [
      {
        userId: testUser.id,
        provider: 'stripe',
        cardBrand: 'Visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2028,
        isDefault: true,
      },
      {
        userId: testUser.id,
        provider: 'stripe',
        cardBrand: 'MasterCard',
        last4: '5555',
        expMonth: 8,
        expYear: 2026,
        isDefault: false,
      },
    ],
  });

  // 4. Fetch some products to create orders
  const products = await prisma.product.findMany({ take: 3 });
  if (products.length > 0) {
    // 5. Create some Orders
    const orderStatuses = ['Pending Payment', 'Processing', 'Shipped', 'Delivered'];
    
    for (let i = 0; i < orderStatuses.length; i++) {
      const status = orderStatuses[i];
      const product = products[i % products.length];
      
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          status,
          totalAmount: Number(product.price) + 5.0, // price + shipping
          shippingCost: 5.0,
          shippingMethod: 'standard',
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
        },
      });

      // Add order items
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: product.price,
        },
      });

      // Add payment if not pending
      if (status !== 'Pending Payment') {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: Number(product.price) + 5.0,
            status: 'Succeeded',
            provider: 'stripe',
            transactionId: `pi_mock_${Date.now()}_${i}`,
          },
        });
      }
    }
    console.log(`Created ${orderStatuses.length} mock orders for test user.`);
  }

  console.log('Mock data generation completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
