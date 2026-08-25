import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse the hash parameters
    // The URL looks like: http://localhost:5173/oauth/callback#token=ey...&user=ey...
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const token = hashParams.get('token');
    const userBase64 = hashParams.get('user');

    if (token && userBase64) {
      try {
        const user = JSON.parse(atob(userBase64));
        login(token, user);
        const redirectPath = hashParams.get('redirect') || '/';
        
        // Successfully logged in via OAuth, force a full page reload to the target path
        // to ensure all React state and Axios interceptors are completely initialized.
        window.location.href = redirectPath;
      } catch (error) {
        console.error('Failed to parse OAuth user data:', error);
        navigate('/login?error=oauth_parsing_failed', { replace: true });
      }
    } else {
      // Missing token or user info
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [location, login, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <h2 className="text-xl font-semibold">Authenticating...</h2>
      <p className="text-muted">Please wait while we log you in.</p>
    </div>
  );
};

export default OAuthCallback;
