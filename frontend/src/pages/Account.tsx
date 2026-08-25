import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Shield, ShieldCheck, AlertCircle, Key,
  LayoutDashboard, Package, UserCircle, CreditCard, MapPin, Award, Bell, LogOut, Users, Lightbulb, Box, Plus, Trash2
} from 'lucide-react';
import api from '../services/api';

const Account: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Existing state
  const [setupStep, setSetupStep] = useState<'idle' | 'generating' | 'verify' | 'success'>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderDaysFilter, setOrderDaysFilter] = useState('All');
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (orderStatusFilter !== 'All') queryParams.append('status', orderStatusFilter);
        if (orderDaysFilter !== 'All') queryParams.append('days', orderDaysFilter);
        
        const res = await api.get(`/orders?${queryParams.toString()}`);
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      }
    };
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        setAddresses(res.data);
      } catch (err) {
        console.error('Failed to fetch addresses', err);
      }
    };
    const fetchPaymentMethods = async () => {
      try {
        const res = await api.get('/payment-methods');
        setPaymentMethods(res.data);
      } catch (err) {
        console.error('Failed to fetch payment methods', err);
      }
    };
    if (activeTab === 'orders' || activeTab === 'dashboard') fetchOrders();
    if (activeTab === 'address') fetchAddresses();
    if (activeTab === 'payments') fetchPaymentMethods();
  }, [activeTab, orderStatusFilter, orderDaysFilter]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/cancel`);
      // Re-fetch orders to get updated statuses instead of manual array mapping
      const queryParams = new URLSearchParams();
      if (orderStatusFilter !== 'All') queryParams.append('status', orderStatusFilter);
      if (orderDaysFilter !== 'All') queryParams.append('days', orderDaysFilter);
      const res = await api.get(`/orders?${queryParams.toString()}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to cancel order', err);
      alert('Cannot cancel this order.');
    }
  };

  const start2FASetup = async () => {
    setSetupStep('generating');
    setError('');
    try {
      const res = await api.post('/auth/2fa/generate');
      setQrCodeUrl(res.data.qrCodeUrl);
      setSetupStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate 2FA setup. Please try again.');
      setSetupStep('idle');
    }
  };

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorToken || twoFactorToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/auth/2fa/verify', { token: twoFactorToken });
      setSetupStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const isDefault = formData.get('isDefault') === 'on';

    try {
      const res = await api.post('/addresses', { ...data, isDefault });
      if (isDefault) {
        setAddresses([res.data, ...addresses.map(a => ({...a, isDefault: false}))]);
      } else {
        setAddresses([res.data, ...addresses]);
      }
      setIsAddingAddress(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const isDefault = formData.get('isDefault') === 'on';
    
    // Convert cardNumber to last4
    const cardNumber = data.cardNumber as string;
    const last4 = cardNumber.slice(-4);
    
    // Infer cardBrand simply
    let cardBrand = 'Visa';
    if (cardNumber.startsWith('5')) cardBrand = 'MasterCard';
    if (cardNumber.startsWith('3')) cardBrand = 'Amex';

    try {
      const res = await api.post('/payment-methods', { 
        cardBrand,
        last4,
        expMonth: Number(data.expMonth), 
        expYear: Number(data.expYear),
        isDefault 
      });
      if (isDefault) {
        setPaymentMethods([res.data, ...paymentMethods.map(p => ({...p, isDefault: false}))]);
      } else {
        setPaymentMethods([res.data, ...paymentMethods]);
      }
      setIsAddingPayment(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save payment method');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await api.delete(`/payment-methods/${id}`);
      setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    window.dispatchEvent(new Event('auth:logout'));
    navigate('/login');
  };

  const userName = user?.email ? user.email.split('@')[0] : 'User';
  const initials = userName.substring(0, 2).toUpperCase();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'profile', label: 'Profile & Security', icon: UserCircle },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'address', label: 'Address Book', icon: MapPin },
    { id: 'rewards', label: 'Reward Points', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const renderDashboardCards = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Welcome back,</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-h)' }}>
            {userName} <span role="img" aria-label="wave">👋</span>
          </h1>
        </div>
        <button 
          onClick={() => navigate('/products')} 
          style={{ background: '#3b1c7a', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Continue Shopping &rsaquo;
        </button>
      </div>

      <div className="glass-panel" style={{ background: 'var(--bg)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          <div onClick={() => setActiveTab('orders')} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.2s' }} className="hover-card">
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={24} color="#6366f1" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem' }}>All orders</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Reorder / explore your past orders</p>
            </div>
          </div>

          <div onClick={() => setActiveTab('address')} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.2s' }} className="hover-card">
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem' }}>My Address Book</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>View / add / edit your address book</p>
            </div>
          </div>

          <div onClick={() => setActiveTab('rewards')} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.2s' }} className="hover-card">
            <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lightbulb size={24} color="#ec4899" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem' }}>How to use points</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Learn how reward points work</p>
            </div>
          </div>

          <div onClick={() => setActiveTab('payments')} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.2s' }} className="hover-card">
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={24} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem' }}>Add Payment Method</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Add a saved card</p>
            </div>
          </div>

          <div onClick={() => setActiveTab('notifications')} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.2s' }} className="hover-card">
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={24} color="#eab308" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem' }}>Notification Settings</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Edit notification settings</p>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        .hover-card:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );

  const renderProfile = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Settings size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Profile & Security</h1>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Profile Information</h2>
          <p className="text-muted" style={{ margin: 0 }}>Manage your personal details</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
          <strong style={{ color: 'var(--text-muted)' }}>Email:</strong>
          <span>{user?.email}</span>
          
          <strong style={{ color: 'var(--text-muted)' }}>Account ID:</strong>
          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{user?.id}</span>
          
          <strong style={{ color: 'var(--text-muted)' }}>Role:</strong>
          <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Shield size={24} color="var(--primary)" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Two-Factor Authentication (2FA)</h2>
        </div>
        <p className="text-muted" style={{ marginBottom: '2rem', lineHeight: '1.5' }}>
          Add an extra layer of security to your account. Once enabled, you will be required to enter a one-time code generated by your authenticator app (e.g. Google Authenticator, Authy) when signing in.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="var(--error)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--error)' }}>{error}</span>
          </div>
        )}

        {setupStep === 'idle' && (
          <button className="btn" onClick={start2FASetup} style={{ maxWidth: '200px' }}>
            Enable 2FA
          </button>
        )}

        {setupStep === 'generating' && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Generating QR Code...
          </div>
        )}

        {setupStep === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-muted)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>1. Scan this QR Code</h3>
                <p className="text-muted" style={{ margin: '0 0 1rem', maxWidth: '300px' }}>
                  Open your authenticator app and scan the QR code below.
                </p>
                {qrCodeUrl && (
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                    <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>2. Enter the Code</h3>
                <p className="text-muted" style={{ margin: '0 0 1rem' }}>
                  Enter the 6-digit code from your app to verify setup.
                </p>
                
                <form onSubmit={verify2FA}>
                  <div className="input-group">
                    <div style={{ position: 'relative' }}>
                      <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{ paddingLeft: '2.5rem', letterSpacing: '0.5rem', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setSetupStep('idle')} disabled={isSubmitting}>
                      Cancel
                    </button>
                    <button type="submit" className="btn" disabled={isSubmitting || twoFactorToken.length !== 6}>
                      {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {setupStep === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '8px' }}>
            <ShieldCheck size={32} color="var(--success)" />
            <div>
              <h3 style={{ color: 'var(--success)', margin: '0 0 0.25rem' }}>2FA Enabled Successfully!</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Your account is now protected with two-factor authentication.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={32} color="var(--primary)" />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>My Orders</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={orderStatusFilter} 
            onChange={e => setOrderStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending Payment">Pending Payment</option>
            <option value="Payment Successful">Payment Successful</option>
            <option value="Refund Processing">Refund Processing</option>
            <option value="Refunded">Refunded</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            value={orderDaysFilter} 
            onChange={e => setOrderDaysFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}
          >
            <option value="All">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="180">Last 6 Months</option>
          </select>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Package size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
            <p className="text-muted" style={{ margin: 0, fontSize: '1.1rem' }}>You have no past orders.</p>
            <button onClick={() => navigate('/products')} className="btn" style={{ marginTop: '1.5rem' }}>Start Shopping</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((order) => (
              <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    height: 'max-content',
                    backgroundColor: order.status === 'Payment Successful' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: order.status === 'Payment Successful' ? 'var(--success)' : (order.status === 'Cancelled' ? 'var(--error)' : 'var(--text-h)')
                  }}>
                    {order.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent)' }}>
                    ${Number(order.totalAmount).toFixed(2)}
                    {order.shippingMethod && (
                      <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                        (Includes ${Number(order.shippingCost).toFixed(2)} {order.shippingMethod})
                      </span>
                    )}
                  </div>
                  {order.status === 'Pending Payment' || order.status === 'Payment Successful' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="btn btn-outline"
                        style={{ borderColor: 'var(--error)', color: 'var(--error)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        Cancel Order
                      </button>
                      <button 
                        onClick={() => navigate(`/account/orders/${order.id}`)}
                        className="btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        View Details
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => navigate(`/account/orders/${order.id}`)}
                      className="btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAddressBook = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MapPin size={32} color="var(--primary)" />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Address Book</h1>
        </div>
        {!isAddingAddress && (
          <button onClick={() => setIsAddingAddress(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <Plus size={18} /> Add New Address
          </button>
        )}
      </div>

      {isAddingAddress && (
        <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Add a new address</h3>
          <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>First Name</label>
                <input type="text" name="firstName" required />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" name="lastName" required />
              </div>
            </div>
            <div className="input-group">
              <label>Address Line 1</label>
              <input type="text" name="addressLine1" required />
            </div>
            <div className="input-group">
              <label>Address Line 2 (Optional)</label>
              <input type="text" name="addressLine2" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>City</label>
                <input type="text" name="city" required />
              </div>
              <div className="input-group">
                <label>State / Province</label>
                <input type="text" name="state" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Postal Code</label>
                <input type="text" name="postalCode" required />
              </div>
              <div className="input-group">
                <label>Country</label>
                <input type="text" name="country" required />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="isDefault" name="isDefault" style={{ width: 'auto' }} />
              <label htmlFor="isDefault" style={{ margin: 0 }}>Set as default shipping address</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsAddingAddress(false)}>Cancel</button>
              <button type="submit" className="btn">Save Address</button>
            </div>
          </form>
        </div>
      )}

      {!isAddingAddress && addresses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <MapPin size={48} color="var(--border)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>No Addresses Saved</h2>
          <p className="text-muted" style={{ margin: 0 }}>Save your shipping addresses here for a faster checkout experience.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {addresses.map((address) => (
            <div key={address.id} style={{ position: 'relative', border: address.isDefault ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'var(--bg)' }}>
              {address.isDefault && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  DEFAULT
                </div>
              )}
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{address.firstName} {address.lastName}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {address.addressLine1} <br />
                {address.addressLine2 && <>{address.addressLine2}<br /></>}
                {address.city}, {address.state} {address.postalCode} <br />
                {address.country}
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleDeleteAddress(address.id)} style={{ background: 'transparent', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', padding: 0 }}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentMethods = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CreditCard size={32} color="var(--primary)" />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Payment Methods</h1>
        </div>
        {!isAddingPayment && (
          <button onClick={() => setIsAddingPayment(true)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <Plus size={18} /> Add New Card
          </button>
        )}
      </div>

      {isAddingPayment && (
        <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Add a new card</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>For demonstration purposes. This form will securely save card metadata.</p>
          <form onSubmit={handleSavePaymentMethod} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Card Number</label>
              <input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" maxLength={19} required />
            </div>
            <div className="input-group">
              <label>Name on Card</label>
              <input type="text" name="nameOnCard" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Exp Month</label>
                <input type="number" name="expMonth" placeholder="MM" min="1" max="12" required />
              </div>
              <div className="input-group">
                <label>Exp Year</label>
                <input type="number" name="expYear" placeholder="YYYY" min="2024" max="2040" required />
              </div>
              <div className="input-group">
                <label>CVC</label>
                <input type="text" name="cvc" placeholder="123" maxLength={4} required />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="isDefaultCard" name="isDefault" style={{ width: 'auto' }} />
              <label htmlFor="isDefaultCard" style={{ margin: 0 }}>Set as default payment method</label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsAddingPayment(false)}>Cancel</button>
              <button type="submit" className="btn">Save Card</button>
            </div>
          </form>
        </div>
      )}

      {!isAddingPayment && paymentMethods.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <CreditCard size={48} color="var(--border)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>No Payment Methods Saved</h2>
          <p className="text-muted" style={{ margin: 0 }}>Add a credit or debit card for faster checkout.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {paymentMethods.map((method) => (
            <div key={method.id} style={{ position: 'relative', border: method.isDefault ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'linear-gradient(135deg, #2a1b54 0%, #170d36 100%)', color: 'white', overflow: 'hidden' }}>
              {method.isDefault && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--accent)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  DEFAULT
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <CreditCard size={32} opacity={0.8} />
                <span style={{ fontSize: '1.1rem', fontWeight: 600, fontStyle: 'italic', opacity: 0.9 }}>{method.cardBrand}</span>
              </div>
              
              <div style={{ fontSize: '1.25rem', letterSpacing: '2px', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                •••• •••• •••• {method.last4}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>VALID THRU</div>
                  <div style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>{String(method.expMonth).padStart(2, '0')}/{String(method.expYear).slice(-2)}</div>
                </div>
                
                <button onClick={() => handleDeletePaymentMethod(method.id)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlaceholder = (title: string, desc: string, Icon: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Icon size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '2rem', margin: 0 }}>{title}</h1>
      </div>
      <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <Icon size={48} color="var(--border)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Coming Soon</h2>
        <p className="text-muted" style={{ margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
          {desc}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f9f9fa', minHeight: 'calc(100vh - 80px)', padding: '2rem 0', width: '100%', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', padding: '0 2rem' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
            
            {/* User Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '0.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b1c7a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-h)', wordBreak: 'break-all' }}>
                {userName}
              </div>
            </div>

            {/* Navigation Menu */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      width: '100%',
                      background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      color: isActive ? '#4f46e5' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 500,
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <item.icon size={20} color={isActive ? '#4f46e5' : 'var(--text-muted)'} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  width: '100%',
                  background: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={20} />
                Log Out
              </button>
            </div>

          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, paddingBottom: '4rem' }}>
          {activeTab === 'dashboard' && renderDashboardCards()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'payments' && renderPaymentMethods()}
          {activeTab === 'address' && renderAddressBook()}
          {activeTab === 'rewards' && renderPlaceholder('Reward Points', 'Track and redeem your loyalty points for discounts.', Award)}
          {activeTab === 'notifications' && renderPlaceholder('Notifications', 'Customize how and when you receive updates.', Bell)}
        </main>
      </div>
    </div>
  );
};

export default Account;
