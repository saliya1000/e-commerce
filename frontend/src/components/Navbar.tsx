import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const cartItemsCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const redirectParam = (location.pathname !== '/login' && location.pathname !== '/register') 
    ? `?redirect=${encodeURIComponent(location.pathname + location.search)}` 
    : '';

  return (
    <nav className="navbar glass">
      <Link to="/" className="nav-brand">HappyPets</Link>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Search for toys, food..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.6rem 1rem 0.6rem 2.5rem', 
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-muted)'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/cart" style={{ position: 'relative', color: 'var(--text-main)' }}>
          <ShoppingCart size={24} />
          <span style={{ 
            position: 'absolute', top: '-8px', right: '-8px', 
            background: 'var(--primary)', color: 'white', 
            fontSize: '0.7rem', fontWeight: 'bold', 
            borderRadius: '50%', width: '18px', height: '18px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {cartItemsCount}
          </span>
        </Link>
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/account" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} />
              <span style={{ fontWeight: 600 }}>{user?.email?.split('@')[0]}</span>
            </Link>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/login${redirectParam}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>Login</Link>
            <Link to={`/register${redirectParam}`} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
