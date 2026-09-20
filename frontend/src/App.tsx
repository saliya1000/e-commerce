import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Home from './pages/Home';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Account from './pages/Account';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import OAuthCallback from './pages/OAuthCallback';
import CartPage from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderDetail from './pages/OrderDetail';
import TrackOrder from './pages/TrackOrder';

import './styles/index.css';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (adminOnly && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      
      <Route path="/products" element={<Layout><ProductList /></Layout>} />
      <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/cart" element={<Layout><CartPage /></Layout>} />
      <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
      <Route path="/order-confirmation" element={<Layout><OrderConfirmation /></Layout>} />
      <Route path="/track-order" element={<Layout><TrackOrder /></Layout>} />
      <Route 
        path="/account" 
        element={
          <ProtectedRoute>
            <Layout><Account /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/account/orders/:id" 
        element={
          <ProtectedRoute>
            <Layout><OrderDetail /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/faq" element={<Layout><FAQ /></Layout>} />
      <Route path="/terms" element={<Layout><Terms /></Layout>} />
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
