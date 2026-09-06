import { getChannel } from '../utils/amqp';
import prisma from '../prisma';
import { sendEmail } from '../utils/mailer';
import { generateOrderEmailHtml, generatePaymentFailedEmailHtml } from '../utils/emailTemplates';

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
          // 1. Update Order Status
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'Payment Successful' }
          });
          
          // 2. Decrement Stock within a transaction if possible, or sequentially
          for (const item of order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity
                }
              }
            });
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
            data: { status: 'Payment Failed' }
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
        // Nack to requeue or handle failure
        channel.nack(msg, false, false); // No requeue for now to prevent loops on bad JSON
      }
    }
  });
};
