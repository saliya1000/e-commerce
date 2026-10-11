import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/image';

const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const redirectStatus = searchParams.get('redirect_status'); // Stripe appends this
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cartContext = useCart();
  const fetchCart = cartContext?.fetchCart;

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const guestId = localStorage.getItem('guestId');
          if (redirectStatus === 'succeeded') {
            await api.post(`/orders/${orderId}/verify-payment`, { guestId });
            // Give the backend worker a moment to clear the cart via RabbitMQ, then refresh frontend cart
            setTimeout(() => {
              if (fetchCart) fetchCart();
            }, 500);
          }
          const res = await api.get(`/orders/${orderId}`, { params: { guestId } });
          setOrder(res.data);
        } catch (err) {
          console.error('Failed to fetch order', err);
        }
      }
      setLoading(false);
    };
    
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-20">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-500">Return to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div className="glass-panel" style={{ background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted, rgba(0,0,0,0.02))' }}>
          {redirectStatus === 'failed' || order?.status === 'Payment Failed' ? (
            <>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--error, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem', fontSize: '2rem', fontWeight: 'bold' }}>!</div>
              <h3 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--error, #ef4444)', margin: '0 0 0.5rem 0' }}>Payment Failed</h3>
              <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                Unfortunately, your payment could not be processed. Please try again.
              </p>
              <Link to="/cart" className="btn" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>Return to Cart</Link>
            </>
          ) : (
            <>
              <CheckCircle size={64} style={{ color: 'var(--success, #10b981)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-h)', margin: '0 0 0.5rem 0' }}>Thank you for your order!</h3>
              <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0 }}>
                Order #{order.id} has been placed. We've sent a confirmation email.
              </p>
              <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--success-muted, rgba(16, 185, 129, 0.1))', color: 'var(--success, #10b981)', borderRadius: '8px', fontWeight: 600 }}>
                Status: {order.status}
              </div>
            </>
          )}
        </div>
        
        <div style={{ padding: '2rem' }}>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '1.5rem' }}>Order Summary</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', borderTop: '1px solid var(--border)' }}>
            {order.items.map((item: any) => (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={getImageUrl(item.product.images?.[0]?.url) || 'https://via.placeholder.com/50'} alt={item.product.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ marginLeft: '1rem' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-h)', margin: '0 0 0.25rem 0' }}>{item.product.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>Qty: {item.quantity}</p>
                  </div>
                </div>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)', margin: 0 }}>${(item.price * item.quantity).toFixed(2)}</p>
              </li>
            ))}
          </ul>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <p style={{ margin: 0 }}>Subtotal</p>
            <p style={{ margin: 0 }}>${(Number(order.totalAmount) - Number(order.shippingCost || 0)).toFixed(2)}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <p style={{ margin: 0, textTransform: 'capitalize' }}>Shipping ({order.shippingMethod || 'standard'})</p>
            <p style={{ margin: 0 }}>${Number(order.shippingCost || 0).toFixed(2)}</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)' }}>
            <p style={{ margin: 0 }}>Total</p>
            <p style={{ margin: 0, color: 'var(--accent)' }}>${Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem', background: 'var(--bg-muted, rgba(0,0,0,0.02))', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
          <Link to="/" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
            Continue Shopping &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
