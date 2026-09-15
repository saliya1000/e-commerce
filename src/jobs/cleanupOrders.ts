import cron from 'node-cron';
import prisma from '../prisma';

export function startCronJobs() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running cleanup job for abandoned orders...');
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await prisma.order.updateMany({
        where: {
          status: 'Pending Payment',
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
        data: {
          status: 'Cancelled',
          cancelReason: 'Abandoned checkout',
        },
      });

      if (result.count > 0) {
        console.log(`[Cron] Cancelled ${result.count} abandoned orders.`);
      } else {
        console.log('[Cron] No abandoned orders to clean up.');
      }
    } catch (error) {
      console.error('[Cron] Error cleaning up abandoned orders:', error);
    }
  });

  console.log('Cron jobs initialized.');
}
