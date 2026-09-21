import React, { useState, useEffect } from 'react';
import { Package, Search, ArrowRight, Truck, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
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
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Hero Header */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>Track Your Order</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
          See exactly where your package is in real-time.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '-3rem auto 4rem', padding: '0 2rem' }}>
        
        {!order ? (
          <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', borderTop: '4px solid var(--primary)', backgroundColor: 'var(--bg-main)', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={40} />
              </div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Order ID</label>
                <input 
                  type="text" 
                  required 
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b..."
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              
              {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem', textAlign: 'center', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
              
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '1rem', marginTop: '0.5rem' }}>
                {loading ? 'Searching...' : 'Track Order'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        ) : (
          <div className="fade-in">
            <button onClick={() => setOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, padding: 0 }}>
              <ChevronLeft size={20} /> Track another order
            </button>
            
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Order #{order.id.slice(0, 8).toUpperCase()}</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(order.status === 'Pending Payment' || order.status === 'Payment Successful') && (
                  <button onClick={handleCancelOrder} disabled={cancelling} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)', padding: '0.5rem 1rem' }}>
                    {cancelling ? 'Processing...' : (order.status === 'Payment Successful' ? 'Cancel & Refund' : 'Cancel')}
                  </button>
                )}
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  backgroundColor: order.status === 'Payment Successful' || order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : order.status.includes('Cancel') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: order.status === 'Payment Successful' || order.status === 'Delivered' ? '#10b981' : order.status.includes('Cancel') ? 'var(--error)' : '#f59e0b'
                }}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '16px', marginBottom: '2rem' }}>
              
              {order.status.includes('Cancel') || order.status.includes('Refund') ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--error)', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
                  <XCircle size={48} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.25rem', marginBottom: '0.25rem' }}>Order Cancelled</strong>
                    <span style={{ opacity: 0.9 }}>This order has been cancelled or refunded.</span>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', margin: '0 2rem' }}>
                  <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '6px', background: 'var(--border-color)', borderRadius: '3px', zIndex: 0 }}></div>
                  <div style={{ position: 'absolute', top: '24px', left: '0', width: `${Math.max(0, getStatusStep(order.status) * 33.33)}%`, height: '6px', background: 'var(--primary)', borderRadius: '3px', zIndex: 1, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                    {[
                      { label: 'Order Placed', icon: Package, step: 0 },
                      { label: 'Payment Confirmed', icon: CheckCircle, step: 1 },
                      { label: 'Shipped', icon: Truck, step: 2 },
                      { label: 'Delivered', icon: CheckCircle, step: 3 }
                    ].map((item, index) => {
                      const active = getStatusStep(order.status) >= item.step;
                      const Icon = item.icon;
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
                          <div style={{ 
                            width: '54px', height: '54px', borderRadius: '50%', 
                            background: active ? 'var(--primary)' : 'var(--bg-main)', 
                            border: `4px solid ${active ? 'var(--primary)' : 'var(--border-color)'}`, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: active ? 'white' : 'var(--text-muted)', 
                            marginBottom: '1rem', 
                            transition: 'all 0.5s ease',
                            boxShadow: active ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none'
                          }}>
                            <Icon size={24} />
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: active ? 'bold' : 'normal', color: active ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'center' }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem', fontWeight: 'bold' }}>Items in your order</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                    <img src={item.product.images?.[0]?.url || 'https://via.placeholder.com/80'} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', background: 'white' }} />
                    <div style={{ flex: 1 }}>
                      <Link to={`/products/${item.productId}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', textDecoration: 'none' }} className="hover-text-primary">{item.product.name}</Link>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--text-main)' }}>
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--text-main)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
