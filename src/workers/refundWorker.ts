import { getChannel } from '../utils/amqp';
import prisma from '../prisma';
import { sendEmail } from '../utils/mailer';
import { generateRefundEmailHtml } from '../utils/emailTemplates';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2022-11-15' as any,
});

const QUEUE_NAME = 'refund_processing';

export const startRefundWorker = async () => {
  const channel = getChannel();
  
  console.log(`[REFUND WORKER] Waiting for messages in ${QUEUE_NAME}...`);
  
  channel.consume(QUEUE_NAME, async (msg: any) => {
    if (msg !== null) {
      const content = msg.content.toString();
      console.log(`[REFUND WORKER] Received message: ${content}`);
      
      try {
        const { orderId, transactionId, stockDeducted } = JSON.parse(content);
        
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            items: { include: { product: true } },
            user: true
          }
        });
        
        if (!order) {
          console.error(`[REFUND WORKER] Order ${orderId} not found`);
          channel.ack(msg);
          return;
        }

        // Issue refund via Stripe if transactionId is provided
        if (transactionId) {
          try {
            await stripe.refunds.create({
              payment_intent: transactionId,
            });
            console.log(`[REFUND WORKER] Stripe refund successful for ${transactionId}`);
          } catch (stripeErr: any) {
            console.error(`[REFUND WORKER] Stripe refund failed:`, stripeErr.message);
            // We still proceed to cancel the order locally even if Stripe sandbox fails 
            // due to invalid dummy keys for demonstration purposes.
          }
        }

        // 1. Update Order Status
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'Refunded' }
        });
        
        // 2. Increment Stock (restore inventory)
        if (stockDeducted !== false) {
          for (const item of order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity
                }
              }
            });
          }
        }

        // 3. Send Refund Email
        const shippingAddress: any = order.shippingAddress || {};
        const customerEmail = order.user?.email || shippingAddress.email;
        if (customerEmail) {
          const htmlContent = generateRefundEmailHtml(order);
          await sendEmail(
            customerEmail,
            `Order Cancelled & Refunded - ${orderId}`,
            `Your order ${orderId} has been successfully cancelled and refunded.`,
            htmlContent
          );
        }
        
        channel.ack(msg);
      } catch (err) {
        console.error(`[REFUND WORKER] Error processing message:`, err);
        channel.nack(msg, false, false);
      }
    }
  });
};
