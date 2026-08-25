import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../services/api';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const strength = getPasswordStrength(password);

  const validate = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/register', { 
        email, 
        password,
        captchaToken
      });
      
      // On success, redirect to login
      const urlParams = new URLSearchParams(location.search);
      const redirectPath = urlParams.get('redirect');
      const redirectQuery = redirectPath ? `&redirect=${encodeURIComponent(redirectPath)}` : '';
      navigate(`/login?registered=true${redirectQuery}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Store
        </Link>
        <div className="auth-header">
          <h1>Welcome to HappyPets</h1>
          <p className="text-muted">Delivering joy to your pets</p>
        </div>

        {error && <span className="error-text text-center" style={{display: 'block', textAlign: 'center'}}>{error}</span>}

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

          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            {password && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px', color: strength.color }}>
                <span>Strength: {strength.text}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} style={{ 
                      width: '15px', 
                      height: '4px', 
                      borderRadius: '2px', 
                      background: level <= strength.score ? strength.color : 'var(--border-color)' 
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          {/* Google reCAPTCHA */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
              onChange={(token) => {
                setCaptchaToken(token);
                if (token) setError('');
              }}
              onExpired={() => setCaptchaToken(null)}
              theme="dark"
            />
          </div>

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-links">
          Already have an account? <Link to={`/login${location.search}`}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
