import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';

// IMPORTANT: In a real app, this should be in .env. We use a placeholder here assuming the user will replace it or it's provided in env.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy');

const CheckoutForm = ({ orderId }: { orderId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
      },
    });

    if (result.error) {
      setError(result.error.message || 'An unexpected error occurred.');
      setProcessing(false);
    }
    // If successful, Stripe will redirect to the return_url.
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
      <PaymentElement />
      {error && <div style={{ color: 'var(--error, #ef4444)', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}
      <button
        disabled={!stripe || processing}
        className="btn"
        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const Checkout: React.FC = () => {
  const { cart, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: user?.email || '',
    line1: '',
    city: '',
    postal_code: '',
    country: 'US',
  });

  const [shippingMethod, setShippingMethod] = useState('standard');
  const shippingCost = shippingMethod === 'express' ? 15.00 : (shippingMethod === 'overnight' ? 25.00 : 5.00);
  const finalTotal = totalAmount + shippingCost;

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const guestId = localStorage.getItem('guestId');
      const res = await api.post('/orders/checkout', {
        guestId,
        shippingAddress,
        shippingMethod
      });
      setClientSecret(res.data.clientSecret);
      setOrderId(res.data.orderId);
      setStep(3);
    } catch (err: any) {
      console.error('Checkout failed', err);
      alert('Failed to initiate checkout. ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.5rem' }}>Checkout</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <div style={{ fontWeight: step >= 1 ? 700 : 400, color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>1. Shipping Address</div>
        <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
        <div style={{ fontWeight: step >= 2 ? 700 : 400, color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>2. Shipping Method</div>
        <div style={{ color: 'var(--text-muted)' }}>&gt;</div>
        <div style={{ fontWeight: step >= 3 ? 700 : 400, color: step >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>3. Payment</div>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ padding: '0' }}>
          
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Shipping Information</h3>
              <form onSubmit={handleAddressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500 }}>Full Name</label>
                    <input required type="text" name="name" value={shippingAddress.name} onChange={handleInputChange} style={{ width: '100%' }} />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500 }}>Email Address</label>
                    <input required type="email" name="email" value={shippingAddress.email} onChange={handleInputChange} style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500 }}>Address Line 1</label>
                  <input required type="text" name="line1" value={shippingAddress.line1} onChange={handleInputChange} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500 }}>City</label>
                    <input required type="text" name="city" value={shippingAddress.city} onChange={handleInputChange} style={{ width: '100%' }} />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500 }}>Postal Code</label>
                    <input required type="text" name="postal_code" value={shippingAddress.postal_code} onChange={handleInputChange} style={{ width: '100%' }} />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 500 }}>Country</label>
                    <input required type="text" name="country" value={shippingAddress.country} onChange={handleInputChange} style={{ width: '100%' }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => navigate('/cart')} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px', width: 'auto' }}>
                    Back to Cart
                  </button>
                  <button type="submit" className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px', width: 'auto' }}>
                    Continue to Shipping
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Shipping Method</h3>
              <form onSubmit={handleShippingSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: shippingMethod === 'standard' ? 'var(--bg-muted)' : 'transparent' }}>
                    <input type="radio" name="shippingMethod" value="standard" checked={shippingMethod === 'standard'} onChange={(e) => setShippingMethod(e.target.value)} style={{ marginRight: '1rem' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>Standard Shipping</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>3-5 business days</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>$5.00</div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: shippingMethod === 'express' ? 'var(--bg-muted)' : 'transparent' }}>
                    <input type="radio" name="shippingMethod" value="express" checked={shippingMethod === 'express'} onChange={(e) => setShippingMethod(e.target.value)} style={{ marginRight: '1rem' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>Express Shipping</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>1-2 business days</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>$15.00</div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: shippingMethod === 'overnight' ? 'var(--bg-muted)' : 'transparent' }}>
                    <input type="radio" name="shippingMethod" value="overnight" checked={shippingMethod === 'overnight'} onChange={(e) => setShippingMethod(e.target.value)} style={{ marginRight: '1rem' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>Overnight Shipping</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Next business day</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>$25.00</div>
                  </label>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px', width: 'auto' }}>
                    Back
                  </button>
                  <button type="submit" className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px', width: 'auto' }}>
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && clientSecret && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Payment Details</h3>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                  <span style={{ textTransform: 'capitalize' }}>Shipping ({shippingMethod}):</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: 'var(--text-h)', fontWeight: 700, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <span>Total to pay:</span>
                  <span style={{ color: 'var(--accent)' }}>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-muted)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm orderId={orderId} />
                </Elements>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px', width: 'auto' }}>
                  Back
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Checkout;
