import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('success');
      setMessage('If that email is in our system, you will receive a password reset link shortly.');
    } catch (err: any) {
      // It's a best practice to show the same success message even if the email doesn't exist
      // to prevent email enumeration, but for this demo, we'll just show the error if one comes back
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to process request.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>
        
        <div className="auth-header" style={{ marginBottom: '1rem' }}>
          <h1>Forgot Password</h1>
          <p className="text-muted">Enter your email and we'll send you a reset link</p>
        </div>

        {status === 'error' && <span className="error-text text-center" style={{display: 'block', textAlign: 'center'}}>{message}</span>}
        
        {status === 'success' ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
            <Mail size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Check your email</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : (
                <>
                  <Send size={18} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
