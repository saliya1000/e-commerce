import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';

interface Suggestion {
  id: string;
  name: string;
  brand?: string;
  price: number;
  images: any[];
}

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [showCartPreview, setShowCartPreview] = useState(false);

  const cartItemsCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const cartTotal = cart?.items.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0) || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setLoadingSuggestions(true);
        try {
          const res = await axios.get(`/api/products/suggest?q=${encodeURIComponent(searchQuery.trim())}`);
          setSuggestions(res.data);
          setShowSuggestions(true);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const redirectParam = (location.pathname !== '/login' && location.pathname !== '/register') 
    ? `?redirect=${encodeURIComponent(location.pathname + location.search)}` 
    : '';

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
    <nav className="navbar glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <Link to="/" className="nav-brand hover-lift" style={{ textDecoration: 'none' }}>HappyPets</Link>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
        <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" 
            aria-label="Search for products"
            placeholder="Search for toys, food..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem 0.75rem 2.5rem', 
              borderRadius: '9999px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-muted)',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'box-shadow 0.2s',
            }}
            onFocusCapture={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)'; }}
            onBlurCapture={(e) => { e.target.style.boxShadow = 'none'; }}
          />
          {loadingSuggestions ? (
            <Loader2 className="pulse" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
          ) : (
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          )}

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length > 1 && (
            <div className="glass fade-in" style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem',
              borderRadius: '12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'
            }}>
              {suggestions.length === 0 ? (
                <div style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', textAlign: 'center' }}>No products found</div>
              ) : (
                suggestions.map(s => (
                  <div key={s.id} 
                    onClick={() => {
                      setSearchQuery(s.name);
                      setShowSuggestions(false);
                      navigate(`/products/${s.id}`);
                    }}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--bg-muted)', overflow: 'hidden', flexShrink: 0 }}>
                      {s.images?.[0] ? (
                        <img src={s.images[0].url} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>No img</div>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                      {s.brand && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.brand}</span>}
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', flexShrink: 0 }}>
                      ${Number(s.price).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Cart Icon & Preview */}
        <div 
          style={{ position: 'relative' }} 
          onMouseEnter={() => setShowCartPreview(true)}
          onMouseLeave={() => setShowCartPreview(false)}
          onClick={() => setShowCartPreview(!showCartPreview)}
        >
          <button 
            aria-label="View Cart" 
            style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <ShoppingCart size={24} aria-hidden="true" className="hover-lift" />
            {cartItemsCount > 0 && (
              <span style={{ 
                position: 'absolute', top: '-8px', right: '-8px', 
                background: 'var(--primary)', color: 'white', 
                fontSize: '0.7rem', fontWeight: 'bold', 
                borderRadius: '50%', width: '18px', height: '18px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Cart Preview Dropdown */}
          {showCartPreview && (
            <div className="glass fade-in" style={{
              position: 'absolute', top: '100%', right: '-10px', width: '300px', marginTop: '1rem',
              borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              {cartItemsCount === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>Your cart is empty.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {cart?.items.slice(0, 3).map(item => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--bg-muted)', borderRadius: '8px', overflow: 'hidden' }}>
                          {item.product.images[0] ? (
                            <img src={item.product.images[0].url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>No img</div>
                          )}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.product.name}</p>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Qty: {item.quantity}</p>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                          ${(Number(item.product.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {(cart?.items.length || 0) > 3 && (
                      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        + {(cart?.items.length || 0) - 3} more item(s)
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Subtotal:</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <Link to="/cart" className="btn btn-outline" style={{ textAlign: 'center', padding: '0.5rem' }}>View Cart</Link>
                    <Link to="/checkout" className="btn btn-primary" style={{ textAlign: 'center', padding: '0.5rem' }}>Checkout</Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

            <Link to="/account" className="hover-lift" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem',
                flexShrink: 0, boxShadow: 'var(--shadow-sm)'
              }}>
                {getInitials()}
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getDisplayName()}
              </span>
            </Link>
            <button onClick={logout} aria-label="Logout" className="hover-lift" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <LogOut size={20} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/login${redirectParam}`} className="btn btn-outline hover-lift" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>Login</Link>
            <Link to={`/register${redirectParam}`} className="btn btn-primary hover-lift" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
