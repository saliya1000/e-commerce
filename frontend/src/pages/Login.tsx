import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Key, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    if (!requires2FA) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (!password) {
        setError('Please enter your password.');
        return false;
      }
    } else {
      if (!twoFactorToken || twoFactorToken.length !== 6) {
        setError('Please enter a valid 6-digit authentication code.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      // Send the request to the backend API
      const payload: any = { email, password };
      if (requires2FA) {
        payload.twoFactorToken = twoFactorToken;
      }
      
      const response = await api.post('/auth/login', payload);
      
      const { accessToken, user } = response.data;
      
      // Store token in memory and update auth state
      login(accessToken, user);
      
      // Redirect to specific page or home
      const urlParams = new URLSearchParams(location.search);
      const redirectPath = urlParams.get('redirect') || '/';
      navigate(redirectPath);
    } catch (err: any) {
      const errMessage = err.response?.data?.error;
      
      // Check if backend specifically asks for 2FA
      if (errMessage === '2FA token required') {
        setRequires2FA(true);
        setError(''); // Clear error so the user isn't immediately alarmed
      } else {
        setError(errMessage || 'Failed to login. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    // Redirect to the backend OAuth route
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect');
    const stateParam = redirectPath ? `?state=${encodeURIComponent(redirectPath)}` : '';
    window.location.href = `/api/auth/${provider}${stateParam}`;
  };

  return (
    <main className="auth-container">
      <div className="auth-box glass-panel">
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <div className="auth-header">
          <h1>{requires2FA ? 'Two-Factor Auth' : 'Welcome back to HappyPets'}</h1>
          <p className="text-muted">{requires2FA ? 'Enter the code from your authenticator app' : 'Delivering joy to your pets'}</p>
        </div>

        {error && <span className="error-text text-center" style={{display: 'block', textAlign: 'center'}}>{error}</span>}

        <form onSubmit={handleSubmit}>
          
          {!requires2FA ? (
            <>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>Forgot Password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="input-group">
              <label htmlFor="twoFactorToken">Authentication Code</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="twoFactorToken"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ paddingLeft: '2.5rem', letterSpacing: '0.5rem', fontFamily: 'monospace' }}
                  autoComplete="one-time-code"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : (
              <>
                <LogIn size={20} />
                {requires2FA ? 'Verify Code' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {!requires2FA && (
          <>
            <div className="divider">or continue with</div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => handleOAuth('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button type="button" className="btn btn-outline" onClick={() => handleOAuth('facebook')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            <div className="auth-links">
              Don't have an account? <Link to={`/register${location.search}`}>Sign up</Link>
            </div>
          </>
        )}
        
        {requires2FA && (
          <div className="auth-links">
             <button type="button" className="btn btn-outline" onClick={() => setRequires2FA(false)} style={{ marginTop: '1rem' }}>
               Back to Login
             </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Login;
