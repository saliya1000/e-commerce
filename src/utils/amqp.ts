import amqp, { Connection, Channel } from 'amqplib';

let connection: any = null;
let channel: any = null;

const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'payment_status_updates';
const REFUND_QUEUE = 'refund_processing';

const DLX_NAME = 'dlx_exchange';
const DLQ_NAME = 'dead_letter_queue';

export const initAmqp = async () => {
  try {
    connection = await amqp.connect(AMQP_URL);
    channel = await connection.createChannel();
    
    // Assert Dead-Letter Exchange and Queue
    await channel.assertExchange(DLX_NAME, 'direct', { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });
    await channel.bindQueue(DLQ_NAME, DLX_NAME, 'dlq_routing_key');

    // Assert main queues with DLX config
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_NAME,
        'x-dead-letter-routing-key': 'dlq_routing_key'
      }
    });
    
    await channel.assertQueue(REFUND_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_NAME,
        'x-dead-letter-routing-key': 'dlq_routing_key'
      }
    });
    
    console.log(`[AMQP] Connected and queues asserted with DLQ configured`);
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
