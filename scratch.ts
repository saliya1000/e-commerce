import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://postgres:password@localhost:5433/e_commerce?schema=public" } } });
async function main() {
  const products = await prisma.product.findMany();
  console.log('Product count:', products.length);
  console.log('Products:', products.map(p => p.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
