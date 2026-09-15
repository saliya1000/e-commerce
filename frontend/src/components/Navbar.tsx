import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, LogOut } from 'lucide-react';
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

  /**
   * Display name priority — same as Account page and real-world apps:
   * Full name → First name → email prefix
   */
  const getDisplayName = () => {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    if (last) return last;
    return user?.email ? user.email.split('@')[0] : 'Account';
  };

  const getInitials = () => {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first.substring(0, 2).toUpperCase();
    const prefix = user?.email ? user.email.split('@')[0] : 'U';
    return prefix.substring(0, 2).toUpperCase();
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user?.role === 'admin' && (
              <Link to="/admin" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none', marginRight: '1rem' }}>
                Admin
              </Link>
            )}
            <Link to="/account" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Avatar circle with initials — updates immediately when name is saved */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem',
                flexShrink: 0, boxShadow: '0 2px 8px rgba(79,70,229,0.35)'
              }}>
                {getInitials()}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getDisplayName()}
              </span>
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
