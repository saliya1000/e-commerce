import React, { useState, useEffect } from 'react';
import { Menu, Tag, Flame, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const SubNavbar: React.FC = () => {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products/categories');
        setCategories(res.data);
      } catch (err) {
        // Ignore error
      }
    };
    fetchCategories();
  }, []);

  return (
    <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 2rem' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '0' }}>
        
        {/* Burger Menu for All Categories */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'transparent', boxShadow: 'none', color: 'var(--text-main)', fontSize: '0.95rem' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={18} />
            <span style={{ fontWeight: 800 }}>All Categories</span>
          </button>
          
          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 101, minWidth: '200px', padding: '0.5rem 0', marginTop: '0.5rem' }}>
              {categories.map(cat => (
                <Link 
                  key={cat.id} 
                  to={`/products?categoryId=${cat.id}`} 
                  style={{ display: 'block', padding: '0.6rem 1.2rem', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                  onClick={() => setMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              {categories.length === 0 && <div style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading...</div>}
            </div>
          )}
        </div>

        {/* Small quick links */}
        <div style={{ display: 'flex', gap: '3rem', flex: 1, marginLeft: '2rem' }}>
          <Link to="/products?q=sale" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            <Tag size={16} color="var(--primary)" /> Sales
          </Link>
          <Link to="/products?q=promotion" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            <Sparkles size={16} color="var(--secondary)" /> Promotions
          </Link>
          <Link to="/products?sortBy=rating&sortOrder=desc" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            <Flame size={16} color="#E53E3E" /> Trending
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubNavbar;
