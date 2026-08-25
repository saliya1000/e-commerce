import app from './app';
import dotenv from 'dotenv';
import prisma from './prisma';
import { initMailer } from './utils/mailer';
import { initAmqp } from './utils/amqp';
import { startOrderWorker } from './workers/orderWorker';
import { startRefundWorker } from './workers/refundWorker';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to database');
    await initMailer();
    await initAmqp();
    await startOrderWorker();
    await startRefundWorker();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
