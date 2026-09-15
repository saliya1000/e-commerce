import app from './app';
import dotenv from 'dotenv';
import prisma from './prisma';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { initMailer } from './utils/mailer';
import { initAmqp } from './utils/amqp';
import { startOrderWorker } from './workers/orderWorker';
import { startRefundWorker } from './workers/refundWorker';
import { startCronJobs } from './jobs/cleanupOrders';

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
    startCronJobs();
    
    try {
      const privateKey = fs.readFileSync(path.join(__dirname, '../server.key'), 'utf8');
      const certificate = fs.readFileSync(path.join(__dirname, '../server.cert'), 'utf8');
      const credentials = { key: privateKey, cert: certificate };
      
      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(PORT, () => {
        console.log(`HTTPS Server is running on port ${PORT}`);
      });
    } catch (err) {
      console.warn('TLS certificates not found, falling back to HTTP');
      app.listen(PORT, () => {
        console.log(`HTTP Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
