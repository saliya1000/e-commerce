import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, ShieldCheck, AlertCircle, Key,
  LayoutDashboard, Package, UserCircle, CreditCard, MapPin, Award, Bell, LogOut, Users, Lightbulb, Box, Plus, Trash2
} from 'lucide-react';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy');

const AddCardForm = ({ onCancel, onSaveSuccess }: { onCancel: () => void, onSaveSuccess: (data: any) => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    const { error: submitError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred.');
      setIsProcessing(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      try {
        const res = await api.post('/payment-methods', {
          paymentMethodId: setupIntent.payment_method,
          isDefault
        });
        onSaveSuccess(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to sync payment method.');
        setIsProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PaymentElement />
      {error && <div style={{ color: 'var(--error, #ef4444)' }}>{error}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input type="checkbox" id="isDefaultCard" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: 'auto' }} />
        <label htmlFor="isDefaultCard" style={{ margin: 0 }}>Set as default payment method</label>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isProcessing}>Cancel</button>
        <button type="submit" className="btn" disabled={isProcessing || !stripe}>{isProcessing ? 'Saving...' : 'Save Card'}</button>
      </div>
    </form>
  );
};

const Account: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Profile update state
  const { updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  // Account Deletion state
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState(''); // for OAuth users
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountMessage, setDeleteAccountMessage] = useState({ type: '', text: '' });
  
  // Existing state
  const [setupStep, setSetupStep] = useState<'idle' | 'generating' | 'verify' | 'success'>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Order filters and sorting
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderDaysFilter, setOrderDaysFilter] = useState('All');
  const [orderSortBy, setOrderSortBy] = useState('date');
  const [orderSortOrder, setOrderSortOrder] = useState('desc');
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [setupIntentSecret, setSetupIntentSecret] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (orderStatusFilter !== 'All') queryParams.append('status', orderStatusFilter);
        if (orderDaysFilter !== 'All') queryParams.append('days', orderDaysFilter);
        queryParams.append('sortBy', orderSortBy);
        queryParams.append('sortOrder', orderSortOrder);
        
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
  }, [activeTab, orderStatusFilter, orderDaysFilter, orderSortBy, orderSortOrder]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/cancel`);
      // Re-fetch orders to get updated statuses instead of manual array mapping
      const queryParams = new URLSearchParams();
      if (orderStatusFilter !== 'All') queryParams.append('status', orderStatusFilter);
      if (orderDaysFilter !== 'All') queryParams.append('days', orderDaysFilter);
      queryParams.append('sortBy', orderSortBy);
      queryParams.append('sortOrder', orderSortOrder);
      const res = await api.get(`/orders?${queryParams.toString()}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to cancel order', err);
      alert('Cannot cancel this order.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const res = await api.put('/auth/profile', { firstName, lastName });
      updateUser(res.data.user);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
    }
    setIsUpdatingPassword(true);
    setPasswordMessage({ type: '', text: '' });
    try {
      // For OAuth users (hasPassword === false), don't send currentPassword
      const payload = user?.hasPassword
        ? { currentPassword, newPassword }
        : { newPassword };
      const res = await api.put('/auth/password', payload);
      setPasswordMessage({ type: 'success', text: res.data.message || 'Password updated successfully!' });
      // After setting a password, update local user state so the form switches to 'change' mode
      updateUser({ ...user!, hasPassword: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you absolutely sure you want to permanently delete your account? This action cannot be undone.")) return;
    
    setIsDeletingAccount(true);
    setDeleteAccountMessage({ type: '', text: '' });
    try {
      // OAuth users send confirmationText; local users send password
      const payload = user?.hasPassword === false
        ? { email: deleteEmail, confirmationText: deleteConfirmText }
        : { email: deleteEmail, password: deletePassword };

      await api.delete('/auth/account', { data: payload });
      handleLogout();
    } catch (err: any) {
      setDeleteAccountMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete account' });
    } finally {
      setIsDeletingAccount(false);
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
    const data = Object.fromEntries((formData as any).entries());
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



  const handleAddNewCardClick = async () => {
    setIsAddingPayment(true);
    try {
      const res = await api.post('/payment-methods/setup-intent');
      setSetupIntentSecret(res.data.clientSecret);
    } catch (err) {
      console.error(err);
      alert('Failed to initialize Stripe');
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

  /**
   * Display name priority (same pattern used by Amazon, Google, etc.):
   * 1. Full name (firstName + lastName) — shown once the user sets both
   * 2. First name only — if only firstName is set
   * 3. Email prefix — fallback for users who haven't set a name yet
   */
  const getDisplayName = () => {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    if (last) return last;
    return user?.email ? user.email.split('@')[0] : 'User';
  };
  const userName = getDisplayName();

  /** Initials derived from real name, not just the email prefix */
  const getInitials = () => {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first.substring(0, 2).toUpperCase();
    const emailPrefix = user?.email ? user.email.split('@')[0] : 'U';
    return emailPrefix.substring(0, 2).toUpperCase();
  };
  const initials = getInitials();

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
          
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <div onClick={() => window.open('/admin', '_blank')} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary)', cursor: 'pointer', transition: 'box-shadow 0.2s', background: 'var(--bg-muted)' }} className="hover-card">
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="#6366f1" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem', color: 'var(--primary)' }}>Manage Store</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Go to Admin Dashboard</p>
              </div>
            </div>
          )}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-h)' }}>Profile &amp; Security</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Manage your personal details and account security</p>
      </div>

      {/* Two-column grid for profile + password */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

        {/* Personal Details */}
        <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <UserCircle size={18} color="#6366f1" />
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-h)' }}>Personal Details</h2>
          </div>

          {profileMessage.text && (
            <div style={{
              padding: '0.65rem 0.875rem', borderRadius: '8px', marginBottom: '1rem',
              background: profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              color: profileMessage.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${profileMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500
            }}>
              {profileMessage.type === 'success' ? <ShieldCheck size={15} /> : <AlertCircle size={15} />}
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>First Name</label>
                <input type="text" className="premium-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" style={{
                  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Last Name</label>
                <input type="text" className="premium-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" style={{
                  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Email Address</label>
              <input type="email" value={user?.email} disabled style={{
                width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'not-allowed', boxSizing: 'border-box'
              }} />
            </div>
            <button type="submit" className="premium-btn" disabled={isUpdatingProfile} style={{
              padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
              boxShadow: '0 4px 12px -4px rgba(99, 102, 241, 0.5)'
            }}>
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.12)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <Key size={18} color="#ec4899" />
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-h)' }}>
              {user?.hasPassword === false ? 'Set Password' : 'Change Password'}
            </h2>
            {user?.hasPassword === false && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 500 }}>OAuth account</span>
            )}
          </div>

          {passwordMessage.text && (
            <div style={{
              padding: '0.65rem 0.875rem', borderRadius: '8px', marginBottom: '1rem',
              background: passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              color: passwordMessage.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${passwordMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500
            }}>
              {passwordMessage.type === 'success' ? <ShieldCheck size={15} /> : <AlertCircle size={15} />}
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Only local-auth users need to confirm their current password */}
            {user?.hasPassword !== false && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="••••••••" className="premium-input" style={{
                  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required placeholder="••••••••" className="premium-input" style={{
                  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required placeholder="••••••••" className="premium-input" style={{
                  width: '100%', padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }} />
              </div>
            </div>
            <button type="submit" className="premium-btn" disabled={isUpdatingPassword} style={{
              padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #ec4899, #be185d)', color: 'white',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
              boxShadow: '0 4px 12px -4px rgba(236, 72, 153, 0.5)'
            }}>
              {isUpdatingPassword
                ? (user?.hasPassword === false ? 'Setting...' : 'Updating...')
                : (user?.hasPassword === false ? 'Set Password' : 'Update Password')}
            </button>
          </form>
        </div>
      </div>

      {/* 2FA Section */}
      <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
            <Shield size={18} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-h)' }}>Two-Factor Authentication (2FA)</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5', margin: '0 0 1rem' }}>
          Add an extra layer of security. When enabled, you'll need a code from your authenticator app (e.g. Google Authenticator) on every login.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.65rem 0.875rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={15} color="#ef4444" />
            <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>{error}</span>
          </div>
        )}

        {setupStep === 'idle' && (
          <button className="premium-btn" onClick={start2FASetup} style={{
            padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
          }}>
            Enable 2FA
          </button>
        )}

        {setupStep === 'generating' && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', fontSize: '0.875rem' }}>
            Generating QR Code...
          </div>
        )}

        {setupStep === 'verify' && (
          <div style={{ border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '10px', background: 'rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.75rem', color: 'var(--text-h)' }}>1. Scan this QR Code</p>
                {qrCodeUrl && (
                  <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', display: 'inline-block' }}>
                    <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.75rem', color: 'var(--text-h)' }}>2. Enter the 6-digit code</p>
                <form onSubmit={verify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      padding: '0.65rem 1rem', letterSpacing: '0.5rem', fontFamily: 'monospace',
                      fontSize: '1.25rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(0,0,0,0.15)', color: '#10b981', outline: 'none', width: '180px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setSetupStep('idle')} disabled={isSubmitting} style={{
                      padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--text-h)', fontSize: '0.875rem', cursor: 'pointer'
                    }}>Cancel</button>
                    <button type="submit" disabled={isSubmitting || twoFactorToken.length !== 6} style={{
                      padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                      fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                      opacity: (isSubmitting || twoFactorToken.length !== 6) ? 0.6 : 1
                    }}>
                      {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {setupStep === 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
            <ShieldCheck size={20} color="#10b981" />
            <div>
              <p style={{ color: '#10b981', margin: '0 0 0.1rem', fontSize: '0.9rem', fontWeight: 600 }}>2FA Enabled!</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>Your account is now protected with two-factor authentication.</p>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
            <Trash2 size={18} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#ef4444' }}>Delete Account</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', lineHeight: '1.5' }}>
          Permanently delete your HappyPets account. This is irreversible — all your data, addresses, and history will be removed.
        </p>

        {deleteAccountMessage.text && (
          <div style={{
            padding: '0.65rem 0.875rem', borderRadius: '8px', marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500
          }}>
            <AlertCircle size={15} />
            {deleteAccountMessage.text}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Verify Email</label>
            <input type="email" value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)} required placeholder="your@email.com" className="premium-input-danger" style={{
              padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', minWidth: '220px'
            }} />
          </div>
          {user?.hasPassword === false ? (
            // OAuth user: no password to verify, require typing DELETE instead
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                required
                placeholder="DELETE"
                className="premium-input-danger"
                style={{
                  padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: '#ef4444', fontSize: '0.9rem',
                  outline: 'none', minWidth: '160px', fontWeight: 600, letterSpacing: '0.05em'
                }}
              />
            </div>
          ) : (
            // Local auth user: must verify with password
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Verify Password</label>
              <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required placeholder="••••••••" className="premium-input-danger" style={{
                padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'var(--bg-alt, rgba(0,0,0,0.1))', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', minWidth: '200px'
              }} />
            </div>
          )}
          <button type="submit" className="premium-btn" disabled={isDeletingAccount} style={{
            padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px -4px rgba(239, 68, 68, 0.4)'
          }}>
            {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
          </button>
        </form>
      </div>

      <style>{`
        .premium-input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
        }
        .premium-input-danger:focus {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
        }
        .premium-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .premium-btn:active:not(:disabled) { transform: translateY(0); }
        .premium-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>
    </div>
  );

  const renderOrders = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={32} color="var(--primary)" />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>My Orders</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filter:</span>
            <select 
              value={orderStatusFilter} 
              onChange={e => setOrderStatusFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending Payment">Pending</option>
              <option value="Payment Successful">Successful</option>
              <option value="Refund Processing">Refund Proc.</option>
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
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sort:</span>
            <select 
              value={orderSortBy} 
              onChange={e => setOrderSortBy(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}
            >
              <option value="date">Date</option>
              <option value="status">Status</option>
            </select>
            <select 
              value={orderSortOrder} 
              onChange={e => setOrderSortOrder(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)' }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
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
          <button onClick={handleAddNewCardClick} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <Plus size={18} /> Add New Card
          </button>
        )}
      </div>

      {isAddingPayment && setupIntentSecret && (
        <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Add a new card</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Enter your card details securely below.</p>
          <Elements stripe={stripePromise} options={{ clientSecret: setupIntentSecret }}>
            <AddCardForm 
              onCancel={() => { setIsAddingPayment(false); setSetupIntentSecret(''); }}
              onSaveSuccess={(newMethod) => {
                if (newMethod.isDefault) {
                  setPaymentMethods([newMethod, ...paymentMethods.map(m => ({ ...m, isDefault: false }))]);
                } else {
                  setPaymentMethods([newMethod, ...paymentMethods]);
                }
                setIsAddingPayment(false);
                setSetupIntentSecret('');
              }}
            />
          </Elements>
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
