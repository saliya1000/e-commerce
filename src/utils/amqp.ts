import amqp, { Connection, Channel } from 'amqplib';

let connection: any = null;
let channel: any = null;

const AMQP_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'payment_status_updates';

export const initAmqp = async () => {
  try {
    connection = await amqp.connect(AMQP_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });
    
    console.log(`[AMQP] Connected and queue '${QUEUE_NAME}' asserted`);
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

export const publishPaymentStatus = async (orderId: string, status: string, transactionId?: string) => {
  if (!channel) return;
  const message = JSON.stringify({ orderId, status, transactionId });
  channel.sendToQueue(QUEUE_NAME, Buffer.from(message), { persistent: true });
  console.log(`[AMQP] Published payment status for order ${orderId}: ${status}`);
};
