import { getChannel } from '../utils/amqp';
import prisma from '../prisma';
import { sendEmail } from '../utils/mailer';
import { generateOrderEmailHtml, generatePaymentFailedEmailHtml } from '../utils/emailTemplates';
import { publishRefundStatus } from '../utils/amqp';

const QUEUE_NAME = 'payment_status_updates';

export const startOrderWorker = async () => {
  const channel = getChannel();
  
  console.log(`[ORDER WORKER] Waiting for messages in ${QUEUE_NAME}...`);
  
  channel.consume(QUEUE_NAME, async (msg: any) => {
    if (msg !== null) {
      const content = msg.content.toString();
      console.log(`[ORDER WORKER] Received message: ${content}`);
      
      try {
        const { orderId, event, transactionId } = JSON.parse(content);
        
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { 
            items: { include: { product: true } },
            user: true
          }
        });
        
        if (!order) {
          console.error(`[ORDER WORKER] Order ${orderId} not found`);
          channel.ack(msg);
          return;
        }

        // Get email either from registered user or shipping address
        const shippingAddress: any = order.shippingAddress || {};
        const customerEmail = order.user?.email || shippingAddress.email;
        
        if (event === 'PAYMENT_SUCCESS') {
          if (order.paymentStatus !== 'UNPAID' && order.paymentStatus !== 'FAILED') {
            console.log(`[ORDER WORKER] Order ${orderId} already processed (paymentStatus: ${order.paymentStatus}), skipping PAYMENT_SUCCESS`);
            channel.ack(msg);
            return;
          }

          // 1. Update Order Status
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'PAID' }
          });
          
          // 2. Decrement Stock with Concurrency Check
          let stockDeductionFailed = false;
          try {
            await prisma.$transaction(async (tx) => {
              for (const item of order.items) {
                const result = await tx.product.updateMany({
                  where: { 
                    id: item.productId,
                    stockQuantity: { gte: item.quantity }
                  },
                  data: {
                    stockQuantity: { decrement: item.quantity }
                  }
                });
                
                if (result.count === 0) {
                  throw new Error(`Insufficient stock for product ${item.productId}`);
                }
              }
            });
          } catch (error) {
            stockDeductionFailed = true;
          }

          if (stockDeductionFailed) {
            // Trigger Refund Processing due to out of stock
            await prisma.order.update({
              where: { id: orderId },
              data: { 
                status: 'CANCELLED',
                paymentStatus: 'REFUNDED',
                cancelReason: 'Insufficient stock for one or more items.'
              }
            });
            await publishRefundStatus(orderId, transactionId, false);
            
            // Acknowledge the message and exit early
            channel.ack(msg);
            return;
          }

          // 2.5 Clear the user's cart
          if (order.userId) {
            await prisma.cartItem.deleteMany({
              where: { cart: { userId: order.userId } }
            });
          } else if (order.guestId) {
            await prisma.cartItem.deleteMany({
              where: { cart: { guestId: order.guestId } }
            });
          }

          // 3. Send Confirmation Email
          if (customerEmail) {
            const htmlContent = generateOrderEmailHtml(order);
            await sendEmail(
              customerEmail,
              `Order Confirmation - ${orderId}`,
              `Your payment was successful and your order ${orderId} has been placed.`,
              htmlContent
            );
          }
          
        } else if (event === 'PAYMENT_FAILED') {
          // Update Order Status
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'FAILED' }
          });
          
          // Send Failure Email
          if (customerEmail) {
            const htmlContent = generatePaymentFailedEmailHtml(order);
            await sendEmail(
              customerEmail,
              `Payment Failed - Order ${orderId}`,
              `Your payment for order ${orderId} failed. Please try again.`,
              htmlContent
            );
          }
        }
        
        channel.ack(msg);
      } catch (err) {
        console.error(`[ORDER WORKER] Error processing message:`, err);
        // Nack without requeueing routes the message to the DLQ configured in the exchange
        channel.nack(msg, false, false);
      }
    }
  });
};
