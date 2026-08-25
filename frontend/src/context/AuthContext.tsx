import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api, { setAccessToken } from '../services/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Check if the user has an active session via the HttpOnly refresh token
    const initializeAuth = async () => {
      console.log('[AuthContext] Starting initializeAuth...');
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken, user: userData } = response.data;
        
        console.log('[AuthContext] Refresh successful, user:', userData?.email);
        setAccessToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err: any) {
        console.log('[AuthContext] Refresh failed:', err.response?.status, err.response?.data);
        // If refresh fails, they are simply not logged in
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('[AuthContext] initializeAuth complete.');
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Listen for the custom logout event emitted by the axios interceptor on failed refresh
    const handleLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = React.useCallback((token: string, userData: User) => {
    console.log('[AuthContext] login called with user:', userData?.email);
    setAccessToken(token); // Update the in-memory token in Axios
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = React.useCallback(async () => {
    console.log('[AuthContext] logout called');
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore errors if already logged out on backend
    }
    setAccessToken(null); // Clear the in-memory token
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  if (isInitializing) {
    // Optional: Return a loading spinner or null while checking session
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
