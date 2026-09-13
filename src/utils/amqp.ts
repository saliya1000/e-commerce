import amqp, { Connection, Channel } from 'amqplib';

let connection: any = null;
let channel: any = null;

const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'payment_status_updates';
const REFUND_QUEUE = 'refund_processing';

export const initAmqp = async () => {
  try {
    connection = await amqp.connect(AMQP_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });
    await channel.assertQueue(REFUND_QUEUE, {
      durable: true
    });
    
    console.log(`[AMQP] Connected and queues asserted`);
  } catch (error) {
    console.error('[AMQP] Failed to connect to RabbitMQ', error);
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error('AMQP channel not initialized');
  }
  return channel;
};

export const publishPaymentStatus = async (orderId: string, event: string, transactionId?: string) => {
  if (!channel) return;
  const message = JSON.stringify({ orderId, event, transactionId });
  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
  console.log(`[AMQP] Published payment status for order ${orderId}: ${event}`);
};

export const publishRefundStatus = async (orderId: string, paymentTransactionId?: string, stockDeducted: boolean = true) => {
  if (!channel) return;
  const message = JSON.stringify({ orderId, transactionId: paymentTransactionId, stockDeducted });
  channel.sendToQueue(REFUND_QUEUE, Buffer.from(message), { persistent: true });
  console.log(`[AMQP] Published refund request for order ${orderId}`);
};
