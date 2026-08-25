-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "shippingMethod" TEXT NOT NULL DEFAULT 'standard';
