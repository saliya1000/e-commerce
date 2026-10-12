import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { tokenBucketLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/error';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import paymentRoutes from './routes/payment.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import addressRoutes from './routes/address.routes';
import paymentMethodRoutes from './routes/paymentMethod.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';
import faqRoutes from './routes/faq.routes';
import deliveryOptionRoutes from './routes/deliveryOption.routes';
import storefrontRoutes from './routes/storefront.routes';

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://localhost',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
}));

// Rate Limiting (Token Bucket)
app.use('/api', tokenBucketLimiter);

// Stripe webhook needs raw body, mount before json body parser
app.use('/api/payments', paymentRoutes);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/storefront', storefrontRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
