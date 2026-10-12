import React, { useState, useEffect, useRef } from 'react';
import { Menu, Tag, Flame, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SubNavbar: React.FC = () => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products/categories');
        setCategories(res.data || []);
      } catch (err) {
        // Ignore error
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', width: '100%', overflowX: 'clip' }}>
      <div 
        className="container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1.5rem', 
          padding: '0.5rem 1.5rem',
          maxWidth: '1240px'
        }}
      >
        {/* Burger Menu for All Categories */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button 
            type="button"
            className="btn btn-outline" 
            style={{ 
              padding: '0.4rem 0.85rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              border: '1px solid var(--border-color)', 
              background: 'var(--bg-card)', 
              boxShadow: 'none', 
              color: 'var(--text-main)', 
              fontSize: '0.9rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={16} />
            <span style={{ fontWeight: 800 }}>All Categories</span>
          </button>
          
          {menuOpen && (
            <div 
              style={{ 
                position: 'absolute', 
                top: 'calc(100% + 6px)', 
                left: 0, 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
                zIndex: 101, 
                minWidth: '220px', 
                padding: '0.5rem 0'
              }}
            >
              {categories.map(cat => (
                <Link 
                  key={cat.id} 
                  to={`/products?categoryId=${cat.id}`} 
                  style={{ 
                    display: 'block', 
                    padding: '0.6rem 1.25rem', 
                    color: 'var(--text-main)', 
                    textDecoration: 'none', 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              {categories.length === 0 && (
                <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Loading categories...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Links with smooth scrollable behavior if narrow */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '1.75rem', 
            alignItems: 'center', 
            overflowX: 'auto', 
            scrollbarWidth: 'none', 
            whiteSpace: 'nowrap',
            padding: '0.2rem 0'
          }}
        >
          <Link to="/products?q=sale" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>
            <Tag size={15} color="var(--primary)" /> Sales
          </Link>
          <Link to="/products?q=promotion" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>
            <Sparkles size={15} color="var(--secondary)" /> Promotions
          </Link>
          <Link to="/products?sortBy=rating&sortOrder=desc" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700 }}>
            <Flame size={15} color="#E53E3E" /> Trending
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubNavbar;
