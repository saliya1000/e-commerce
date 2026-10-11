import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Package, CheckCircle, Truck, XCircle, Star, X, Loader } from 'lucide-react';
import { getImageUrl } from '../utils/image';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedItems, setReviewedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const guestId = localStorage.getItem('guestId');
        const res = await api.get(`/orders/${id}`, { params: { guestId } });
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    const fetchEligibilities = async () => {
      if (order?.status === 'Delivered' && order?.items) {
        const checks: Record<string, boolean> = { ...reviewedItems };
        let updated = false;
        for (const item of order.items) {
          if (checks[item.productId] !== undefined) continue;
          try {
            const res = await api.get(`/reviews/products/${item.productId}/eligibility`);
            if (res.data.reason === 'You have already reviewed this product') {
              checks[item.productId] = true;
              updated = true;
            } else {
              checks[item.productId] = false;
              updated = true;
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (updated) {
          setReviewedItems(checks);
        }
      }
    };
    fetchEligibilities();
  }, [order]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingProduct) return;
    setReviewError('');
    setReviewSubmitting(true);
    try {
      await api.post(`/reviews/products/${reviewingProduct.productId}`, {
        rating: reviewRating,
        comment: reviewText
      });
      setReviewedItems(prev => ({ ...prev, [reviewingProduct.productId]: true }));
      setReviewingProduct(null);
      setReviewRating(5);
      setReviewText('');
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const guestId = localStorage.getItem('guestId');
      await api.post(`/orders/${id}/cancel`, { guestId });
      // Refetch
      const res = await api.get(`/orders/${id}`, { params: { guestId } });
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to cancel order', err);
      alert('Cannot cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading order details...</div>;
  if (!order) return <div style={{ padding: '4rem', textAlign: 'center' }}>Order not found.</div>;

  const getStatusStep = (status: string) => {
    if (status === 'Pending Payment') return 0;
    if (status === 'Payment Successful') return 1;
    if (status === 'Processing') return 2;
    if (status === 'Shipped') return 3;
    if (status === 'Delivered') return 4;
    return -1; // Cancelled/Refunded
  };

  const currentStep = getStatusStep(order.status);
  const isCancelled = order.status === 'Cancelled' || order.status === 'Refund Processing' || order.status === 'Refunded';
  
  return (
    <div style={{ backgroundColor: '#f9f9fa', minHeight: 'calc(100vh - 80px)', padding: '2rem 0', width: '100%', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        
        <button onClick={() => navigate('/account')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          <ArrowLeft size={16} /> Back to My Orders
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem', color: 'var(--text-h)' }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            { (order.status === 'Pending Payment' || order.status === 'Payment Successful') && (
              <button onClick={handleCancelOrder} disabled={cancelling} className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                {cancelling ? 'Processing...' : (order.status === 'Payment Successful' ? 'Cancel & Refund Order' : 'Cancel Order')}
              </button>
            )}
            <span style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.95rem',
              fontWeight: 600,
              height: 'max-content',
              backgroundColor: order.status === 'Payment Successful' || order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: order.status === 'Payment Successful' || order.status === 'Delivered' ? 'var(--success)' : (isCancelled ? 'var(--error)' : 'var(--text-h)')
            }}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 2rem' }}>Order Tracking</h2>
          
          {isCancelled ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
              <XCircle size={32} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>Order Cancelled</strong>
                <span>{order.status === 'Refund Processing' ? 'A refund is currently being processed to your original payment method.' : (order.status === 'Refunded' ? 'Refund has been successfully issued.' : 'Order was cancelled before payment.')}</span>
                {order.cancelReason && (
                  <p style={{ marginTop: '0.5rem', marginBottom: 0, fontWeight: 500 }}>
                    Reason: {order.cancelReason}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 2rem' }}>
              <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '4px', background: 'var(--border)', zIndex: 0 }}></div>
              <div style={{ position: 'absolute', top: '24px', left: '0', width: `${Math.max(0, currentStep * 25)}%`, height: '4px', background: 'var(--success)', zIndex: 1, transition: 'width 0.5s' }}></div>
              
              {[
                { label: 'Order Placed', icon: Package, step: 0 },
                { label: 'Payment Confirmed', icon: CheckCircle, step: 1 },
                { label: 'Processing', icon: Loader, step: 2 },
                { label: 'Shipped', icon: Truck, step: 3 },
                { label: 'Delivered', icon: CheckCircle, step: 4 }
              ].map((item, index) => {
                const active = currentStep >= item.step;
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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Order Items */}
          <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem' }}>Items in your order</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <img src={getImageUrl(item.product.images?.[0]?.url) || 'https://via.placeholder.com/80'} alt={item.product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: 1 }}>
                    <Link to={`/products/${item.productId}`} style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-h)', textDecoration: 'none' }}>{item.product.name}</Link>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </div>
                    {currentStep === 4 && reviewedItems[item.productId] === false && (
                      <button 
                        onClick={() => setReviewingProduct(item)}
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        Write Review
                      </button>
                    )}
                    {currentStep === 4 && reviewedItems[item.productId] === true && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={14} /> Reviewed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary & Shipping */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem' }}>Order Summary</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>${(Number(order.totalAmount) - Number(order.shippingCost || 0)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                <span style={{ textTransform: 'capitalize' }}>Shipping ({order.shippingMethod || 'Standard'})</span>
                <span>${Number(order.shippingCost || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-h)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem' }}>Shipping Details</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                <strong style={{ color: 'var(--text-h)', display: 'block', marginBottom: '0.25rem' }}>{order.shippingAddress?.name || 'Customer'}</strong>
                {order.shippingAddress?.line1}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.postal_code}<br />
                {order.shippingAddress?.country}
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {reviewingProduct && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }}>
            <form onSubmit={submitReview} className="glass-panel fade-in" style={{
              width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', position: 'relative',
              backgroundColor: 'var(--bg-main)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.25rem', margin: 0 }}>Review {reviewingProduct.product.name}</h4>
                <button type="button" onClick={() => setReviewingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={24} />
                </button>
              </div>
              
              {reviewError && <p className="error-text" style={{ marginBottom: '1rem' }}>{reviewError}</p>}
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setReviewRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star size={32} fill={star <= reviewRating ? '#F59E0B' : 'transparent'} color={star <= reviewRating ? '#F59E0B' : 'var(--border-color)'} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Comment</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  value={reviewText} 
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="What did you like or dislike?"
                  style={{ width: '100%' }}
                ></textarea>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderDetail;
