import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, CheckCircle, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy');

const CheckoutForm = ({ orderId, onCancel }: { orderId: string, onCancel: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
      });

      if (result.error) {
        let customMessage = result.error.message || 'An unexpected error occurred.';

        if (result.error.type === 'api_connection_error') {
          customMessage = 'Payment gateway timeout. Please try again.';
        } else if (result.error.code === 'invalid_number') {
          customMessage = 'Invalid card number error. Please verify your card details.';
        } else if (result.error.code === 'expired_card') {
          customMessage = 'Expired card error. Please use a valid card.';
        } else if (result.error.decline_code === 'insufficient_funds' || result.error.code === 'insufficient_funds') {
          customMessage = 'Insufficient funds error. Please try a different payment method.';
        }

        setError(customMessage);
        setProcessing(false);
      } else {
        // Fallback in case stripe doesn't automatically redirect
        setProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setError(err.message || 'An unexpected error occurred during payment confirmation.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
      <PaymentElement />
      {error && <div style={{ color: 'var(--error, #ef4444)', marginTop: '1rem', fontSize: '0.875rem', padding: '0.75rem', background: '#FEF2F2', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={16} />{error}</div>}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button type="button" onClick={onCancel} disabled={processing} className="btn btn-outline" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
          Back
        </button>
        <button disabled={!stripe || processing} className="btn" style={{ flex: 2, padding: '1rem', fontSize: '1.1rem' }}>
          {processing ? 'Processing Securely...' : 'Place Order & Pay'}
        </button>
      </div>
    </form>
  );
};

const Checkout: React.FC = () => {
  const { cart, totalAmount, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const isSubmitting = React.useRef(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    line1: '',
    city: '',
    postal_code: '',
    country: 'Finland',
  });

  const [saveAddress, setSaveAddress] = useState(true);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const shippingAddressSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\+358[\s-]?\d{1,4}([\s-]?\d{2,4}){1,2}$/, 'Phone number must be a valid Finnish number starting with +358'),
    line1: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().regex(/^\d{5}$/, 'Finnish postal codes must be exactly 5 digits'),
    country: z.string().min(1, 'Country is required').regex(/^(finland|fi)$/i, 'We currently only ship to Finland')
  });

  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/addresses').then(res => {
        setAddresses(res.data);
        const defaultAddr = res.data.find((a: any) => a.isDefault) || res.data[0];
        if (defaultAddr) {
           setShippingAddress({
             name: `${defaultAddr.firstName} ${defaultAddr.lastName}`,
             email: user.email || '',
             phone: defaultAddr.phoneNumber || '',
             line1: defaultAddr.addressLine1,
             city: defaultAddr.city,
             postal_code: defaultAddr.postalCode,
             country: defaultAddr.country
           });
        } else {
           setSaveAddress(true);
        }
      }).catch(err => console.error(err));
    }
  }, [user]);

  const [shippingMethod, setShippingMethod] = useState('standard');
  const shippingCost = shippingMethod === 'express' ? 15.00 : (shippingMethod === 'overnight' ? 25.00 : 5.00);
  const finalTotal = totalAmount + shippingCost;

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    
    // Zod Validation
    const validationResult = shippingAddressSchema.safeParse(shippingAddress);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    isSubmitting.current = true;
    setIsInitializingPayment(true);
    try {
      const guestId = localStorage.getItem('guestId');
      const res = await api.post('/orders/checkout', {
        guestId,
        shippingAddress,
        shippingMethod,
        saveAddress
      });
      setClientSecret(res.data.clientSecret);
      setOrderId(res.data.orderId);
    } catch (err: any) {
      console.error('Checkout failed', err);
      alert('Failed to initiate checkout. ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    } finally {
      setIsInitializingPayment(false);
      isSubmitting.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addr = addresses.find(a => a.id === e.target.value);
    if (addr) {
      setShippingAddress({
        name: `${addr.firstName} ${addr.lastName}`,
        email: user?.email || '',
        phone: addr.phoneNumber || '',
        line1: addr.addressLine1,
        city: addr.city,
        postal_code: addr.postalCode,
        country: addr.country
      });
    }
  };

  if (!cart) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '3rem', alignItems: 'start' }} className="checkout-grid">
        
        {/* Left Column: Form & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Checkout</h1>
          
          {/* Main Card */}
          <div className="glass-panel" style={{ padding: '2.5rem', background: '#FDFBF7', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' }}>
            
            {/* When clientSecret is absent, show Form */}
            {!clientSecret ? (
              <form onSubmit={handleContinueToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', textAlign: 'left' }}>
                
                {/* 1. Contact & Shipping Info */}
                <section>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#20B2AA', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#20B2AA', color: 'white', borderRadius: '50%', fontSize: '1rem' }}>1</span>
                    Contact & Shipping
                  </h3>
                  
                  {addresses.length > 0 && (
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Saved Addresses</label>
                      <select onChange={handleAddressSelect} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <option value="">-- Choose a saved address --</option>
                        {addresses.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.firstName} {a.lastName} - {a.addressLine1}, {a.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div className="input-group">
                      <label>Full Name</label>
                      <input required type="text" name="name" value={shippingAddress.name} onChange={handleInputChange} placeholder="John Doe" />
                      {formErrors.name && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.name}</span>}
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input required type="email" name="email" value={shippingAddress.email} onChange={handleInputChange} placeholder="john@example.com" readOnly={!!user} style={user ? { backgroundColor: 'var(--color-bg-alt, #f9fafb)', cursor: 'not-allowed', color: 'var(--color-text-light, #6b7280)' } : {}} />
                      {formErrors.email && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.email}</span>}
                    </div>
                  </div>
                  <div className="input-group" style={{ marginTop: '1.25rem' }}>
                    <label>Phone Number</label>
                    <input required type="tel" name="phone" value={shippingAddress.phone} onChange={handleInputChange} placeholder="+358 40 123 4567" />
                    {formErrors.phone && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.phone}</span>}
                  </div>
                  <div className="input-group" style={{ marginTop: '1.25rem' }}>
                    <label>Address</label>
                    <input required type="text" name="line1" value={shippingAddress.line1} onChange={handleInputChange} placeholder="123 Happy St" />
                    {formErrors.line1 && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.line1}</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
                    <div className="input-group">
                      <label>City</label>
                      <input required type="text" name="city" value={shippingAddress.city} onChange={handleInputChange} />
                      {formErrors.city && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.city}</span>}
                    </div>
                    <div className="input-group">
                      <label>Postal Code</label>
                      <input required type="text" name="postal_code" value={shippingAddress.postal_code} onChange={handleInputChange} />
                      {formErrors.postal_code && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.postal_code}</span>}
                    </div>
                  </div>
                  <div className="input-group" style={{ marginTop: '1.25rem' }}>
                    <label>Country</label>
                    <input required type="text" name="country" value={shippingAddress.country} onChange={handleInputChange} />
                    {formErrors.country && <span style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.country}</span>}
                  </div>
                  
                  {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                      <input 
                        type="checkbox" 
                        id="saveAddress" 
                        checked={saveAddress} 
                        onChange={(e) => setSaveAddress(e.target.checked)} 
                        style={{ width: 'auto', accentColor: '#20B2AA' }} 
                      />
                      <label htmlFor="saveAddress" style={{ margin: 0, color: 'var(--text-main)', cursor: 'pointer' }}>
                        Save this as my default shipping address
                      </label>
                    </div>
                  )}
                </section>

                <hr style={{ borderTop: '1px solid var(--border-color)' }} />

                {/* 2. Shipping Method */}
                <section>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#20B2AA', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#20B2AA', color: 'white', borderRadius: '50%', fontSize: '1rem' }}>2</span>
                    Shipping Method
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid', borderColor: shippingMethod === 'standard' ? '#FF7F50' : 'var(--border-color)', borderRadius: '12px', cursor: 'pointer', background: shippingMethod === 'standard' ? '#FFF5F2' : '#FFF', transition: 'all 0.2s' }}>
                      <input type="radio" name="shippingMethod" value="standard" checked={shippingMethod === 'standard'} onChange={(e) => setShippingMethod(e.target.value)} style={{ marginRight: '1rem', accentColor: '#FF7F50', width: '18px', height: '18px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Standard Shipping</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>3-5 business days</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>$5.00</div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid', borderColor: shippingMethod === 'express' ? '#FF7F50' : 'var(--border-color)', borderRadius: '12px', cursor: 'pointer', background: shippingMethod === 'express' ? '#FFF5F2' : '#FFF', transition: 'all 0.2s' }}>
                      <input type="radio" name="shippingMethod" value="express" checked={shippingMethod === 'express'} onChange={(e) => setShippingMethod(e.target.value)} style={{ marginRight: '1rem', accentColor: '#FF7F50', width: '18px', height: '18px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Express Shipping</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>1-2 business days</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>$15.00</div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '2px solid', borderColor: shippingMethod === 'overnight' ? '#FF7F50' : 'var(--border-color)', borderRadius: '12px', cursor: 'pointer', background: shippingMethod === 'overnight' ? '#FFF5F2' : '#FFF', transition: 'all 0.2s' }}>
                      <input type="radio" name="shippingMethod" value="overnight" checked={shippingMethod === 'overnight'} onChange={(e) => setShippingMethod(e.target.value)} style={{ marginRight: '1rem', accentColor: '#FF7F50', width: '18px', height: '18px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Overnight Shipping</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Next business day</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>$25.00</div>
                    </label>
                  </div>
                </section>

                <button type="submit" className="btn" disabled={isInitializingPayment} style={{ padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                  {isInitializingPayment ? 'Preparing Secure Payment...' : 'Continue to Payment'}
                </button>
              </form>
            ) : (
              /* When clientSecret is present, show Payment Element */
              <div style={{ animation: 'fadeUp 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <CheckCircle size={32} color="#38A169" />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Information Confirmed</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Your shipping details are saved.</p>
                  </div>
                </div>
                
                <hr style={{ borderTop: '1px solid var(--border-color)', marginBottom: '2.5rem' }} />

                <section>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#20B2AA', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#20B2AA', color: 'white', borderRadius: '50%', fontSize: '1rem' }}>3</span>
                    Secure Payment
                  </h3>
                  
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#FF7F50', borderRadius: '8px' } } }}>
                      <CheckoutForm orderId={orderId} onCancel={() => setClientSecret('')} />
                    </Elements>
                  </div>
                </section>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="glass-panel" style={{ padding: '2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Order Summary
              <span style={{ background: '#FFF5F2', color: '#FF7F50', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem' }}>
                {cart.items.reduce((a, c) => a + c.quantity, 0)} Items
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px dashed #E2E8F0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', background: '#F3F0E9', flexShrink: 0 }}>
                    <img
                      src={item.product.images?.[0]?.url || 'https://via.placeholder.com/64'}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link to={`/products/${item.productId}`} style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>
                      {item.product.name}
                    </Link>
                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#FF7F50', margin: '0 0 0.5rem 0' }}>${Number(item.product.price).toFixed(2)}</p>
                    
                    {/* Editable Cart Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: '#FDFBF7' }}>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={clientSecret !== ''} style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: clientSecret ? 'not-allowed' : 'pointer', color: 'var(--text-muted)' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '4px 8px', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={clientSecret !== '' || item.quantity >= item.product.stockQuantity} style={{ padding: '6px 10px', background: 'transparent', border: 'none', cursor: (clientSecret !== '' || item.quantity >= item.product.stockQuantity) ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', opacity: item.quantity >= item.product.stockQuantity ? 0.3 : 1 }} title={item.quantity >= item.product.stockQuantity ? "Max stock reached" : ""}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} disabled={clientSecret !== ''} style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: clientSecret ? 'not-allowed' : 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FDFBF7', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Shipping ({shippingMethod})</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${shippingCost.toFixed(2)}</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF7F50' }}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
