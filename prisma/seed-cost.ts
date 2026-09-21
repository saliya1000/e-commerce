import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling cost for existing products...');
  
  const products = await prisma.product.findMany();
  let productUpdatedCount = 0;

  for (const product of products) {
    if (Number(product.cost) === 0 && Number(product.price) > 0) {
      // Simulate cost as 60% of retail price
      const estimatedCost = Number(product.price) * 0.6;
      await prisma.product.update({
        where: { id: product.id },
        data: { cost: estimatedCost }
      });
      productUpdatedCount++;
    }
  }

  console.log(`Updated ${productUpdatedCount} products with estimated cost.`);

  console.log('Backfilling cost for existing order items...');
  const orderItems = await prisma.orderItem.findMany({
    include: { product: true }
  });
  
  let orderItemUpdatedCount = 0;

  for (const item of orderItems) {
    if (Number(item.cost) === 0 && Number(item.price) > 0) {
      // Use the product's new cost if available, else 60% of purchase price
      let estimatedCost = Number(item.price) * 0.6;
      if (item.product && Number(item.product.cost) > 0) {
        estimatedCost = Number(item.product.cost);
      }
      
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { cost: estimatedCost }
      });
      orderItemUpdatedCount++;
    }
  }

  console.log(`Updated ${orderItemUpdatedCount} order items with estimated cost.`);
  console.log('Cost backfill complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
