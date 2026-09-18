import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }} className="py-12">
      <div className="container grid grid-cols-4 gap-8">
        <div>
          <h3 className="font-extrabold text-primary mb-4" style={{ fontSize: '1.5rem' }}>HappyPets</h3>
          <p className="text-muted mb-4">Delivering joy to your pets with premium food, interactive toys, and cozy accessories.</p>
          <div className="flex gap-4">
            <span style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-muted)' }}>FB</span>
            <span style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-muted)' }}>TW</span>
            <span style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-muted)' }}>IG</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold mb-4">Shop</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link to="/products?categoryId=food" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Premium Food</Link></li>
            <li><Link to="/products?categoryId=toys" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Interactive Toys</Link></li>
            <li><Link to="/products?categoryId=accessories" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Accessories</Link></li>
            <li><Link to="/products" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>All Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Company</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>About Us</Link></li>
            <li><Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact Us</Link></li>
            <li><Link to="/faq" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>FAQ</Link></li>
            <li><Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms & Privacy</Link></li>
            <li><Link to="/track-order" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Track Order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Stay in the loop</h4>
          <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Subscribe to get special offers and updates.</p>
          <div className="flex">
            <input type="email" placeholder="Email address" style={{ padding: '0.5rem', borderRadius: '8px 0 0 8px', border: '1px solid var(--border-color)', borderRight: 'none', outline: 'none', width: '100%' }} />
            <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}><Mail size={16} /></button>
          </div>
        </div>
      </div>
      <div className="container mt-8 text-center text-muted" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} HappyPets. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
