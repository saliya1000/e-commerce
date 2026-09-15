import React, { useState, useEffect } from 'react';
import { Package, Search, ArrowRight, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';
  const initialEmail = searchParams.get('email') || '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.post('/orders/track', { orderId: orderId.trim(), email: email.trim() });
      setOrder(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to find order. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId && initialEmail && !order && !loading && !error) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId, initialEmail]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await api.post('/orders/track/cancel', { orderId: order.id, email: email.trim() });
      const res = await api.post('/orders/track', { orderId: order.id, email: email.trim() });
      setOrder(res.data);
      alert('Order successfully cancelled.');
    } catch (err: any) {
      console.error('Failed to cancel order', err);
      alert(err.response?.data?.message || 'Cannot cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusStep = (status: string) => {
    if (status === 'Pending Payment') return 0;
    if (status === 'Payment Successful') return 1;
    if (status === 'Shipped') return 2;
    if (status === 'Delivered') return 3;
    return -1; // Cancelled/Refunded
  };

  return (
    <div style={{ backgroundColor: '#f9f9fa', minHeight: 'calc(100vh - 80px)', padding: '4rem 0', width: '100%', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        
        {!order ? (
          <div className="glass-panel" style={{ padding: '3rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={32} />
              </div>
            </div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 1rem', color: 'var(--text-h)' }}>Track Your Order</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>Enter your order ID and the email address used during checkout to track your order status.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Order ID</label>
                <input 
                  type="text" 
                  required 
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                />
              </div>
              
              {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error}</div>}
              
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                {loading ? 'Searching...' : 'Track Order'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <button onClick={() => setOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              &larr; Track another order
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--text-h)' }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(order.status === 'Pending Payment' || order.status === 'Payment Successful') && (
                  <button onClick={handleCancelOrder} disabled={cancelling} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                    {cancelling ? 'Processing...' : (order.status === 'Payment Successful' ? 'Cancel & Refund Order' : 'Cancel Order')}
                  </button>
                )}
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  backgroundColor: order.status === 'Payment Successful' || order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: order.status === 'Payment Successful' || order.status === 'Delivered' ? 'var(--success)' : 'var(--error)'
                }}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 2rem' }}>Order Tracking</h2>
              
              {order.status.includes('Cancel') || order.status.includes('Refund') ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                  <XCircle size={32} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Order Cancelled</strong>
                    <span>This order has been cancelled or refunded.</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 2rem' }}>
                  <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '4px', background: 'var(--border)', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', top: '24px', left: '0', width: `${Math.max(0, getStatusStep(order.status) * 33.33)}%`, height: '4px', background: 'var(--success)', zIndex: 1, transition: 'width 0.5s' }}></div>
                  
                  {[
                    { label: 'Order Placed', icon: Package, step: 0 },
                    { label: 'Payment Confirmed', icon: CheckCircle, step: 1 },
                    { label: 'Shipped', icon: Truck, step: 2 },
                    { label: 'Delivered', icon: CheckCircle, step: 3 }
                  ].map((item, index) => {
                    const active = getStatusStep(order.status) >= item.step;
                    const Icon = item.icon;
                    return (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '100px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: active ? 'var(--success)' : 'var(--bg)', border: `4px solid ${active ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? 'white' : 'var(--text-muted)', marginBottom: '0.5rem', transition: 'all 0.3s' }}>
                          <Icon size={20} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: active ? 'var(--text-h)' : 'var(--text-muted)', textAlign: 'center' }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem' }}>Items in your order</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <img src={item.product.images?.[0]?.url || 'https://via.placeholder.com/80'} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <Link to={`/products/${item.productId}`} style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-h)', textDecoration: 'none' }}>{item.product.name}</Link>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-h)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
