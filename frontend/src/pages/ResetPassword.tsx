import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract token from query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  // Password strength check
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, text: '', color: 'transparent' };
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score < 2) return { score, text: 'Weak', color: 'var(--error)' };
    if (score < 4) return { score, text: 'Medium', color: 'orange' };
    return { score, text: 'Strong', color: 'var(--success)' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setStatus('success');
      setMessage('Your password has been successfully reset.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to reset password. The token may be expired.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <h1>Reset Password</h1>
          <p className="text-muted">Enter your new password below</p>
        </div>

        {status === 'error' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={24} color="var(--error)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--error)' }}>{message}</span>
          </div>
        )}
        
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Password Reset Complete</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{message}</p>
            </div>
            <button className="btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={!token}
                />
              </div>
              {newPassword && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px', color: strength.color }}>
                  <span>Strength: {strength.text}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4].map(level => (
                      <div key={level} style={{ 
                        width: '15px', 
                        height: '4px', 
                        borderRadius: '2px', 
                        background: level <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' 
                      }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={!token}
                />
              </div>
            </div>

            <button type="submit" className="btn" disabled={status === 'loading' || !token}>
              {status === 'loading' ? 'Saving...' : (
                <>
                  <Save size={18} />
                  Save New Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
