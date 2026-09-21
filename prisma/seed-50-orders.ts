import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching user and products...');
  const user = await prisma.user.findFirst({
    where: { role: 'customer' }
  });

  if (!user) {
    console.error('No customer found. Run regular seed first.');
    return;
  }

  const products = await prisma.product.findMany();
  
  if (products.length === 0) {
    console.error('No products found. Run regular seed first.');
    return;
  }

  const statuses = [
    'Pending Payment', 
    'Payment Successful', 
    'Processing', 
    'Shipped', 
    'Delivered', 
    'Cancelled',
    'Refund Processing'
  ];

  console.log('Creating 50 random orders...');

  for (let i = 0; i < 50; i++) {
    // Random date in the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);
    
    // Random status
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Pick 1 to 3 random products
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({
        productId: product.id,
        quantity: quantity,
        price: product.price
      });
      totalAmount += Number(product.price) * quantity;
    }
    
    totalAmount += 5.0; // flat shipping

    await prisma.order.create({
      data: {
        userId: user.id,
        status: status,
        totalAmount: totalAmount,
        shippingCost: 5.0,
        shippingMethod: 'standard',
        createdAt: orderDate,
        updatedAt: orderDate,
        shippingAddress: JSON.stringify({
          firstName: 'Random',
          lastName: 'Customer',
          addressLine1: `${Math.floor(Math.random() * 9999)} Random St`,
          city: 'Anytown',
          postalCode: '12345',
          phoneNumber: '555-0199',
          country: 'USA',
        }),
        items: {
          create: items
        }
      }
    });
  }

  console.log('Successfully created 50 orders!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
