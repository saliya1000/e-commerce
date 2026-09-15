import React from 'react';
import { Package, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number | string;
    brand: string;
    stockQuantity: number;
    rating?: number | string;
    reviewCount?: number;
    images?: { url: string; isPrimary: boolean }[];
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const primaryImage = product.images?.find(img => img.isPrimary)?.url || null;

  return (
    <div className="product-card glass-panel" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: 'transform 0.2s' }}>
      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: '200px', background: 'var(--bg-muted)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {primaryImage ? (
            <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Package size={64} color="var(--text-muted)" opacity={0.5} />
          )}
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--bg-main)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {product.brand}
          </div>
        </div>
      </Link>
      
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: 600 }}>{product.name}</h3>
        </Link>
        
        {product.rating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
            <Star size={14} fill="var(--primary)" color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{Number(product.rating).toFixed(1)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({product.reviewCount || 0})</span>
          </div>
        )}
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.description}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
            ${Number(product.price).toFixed(2)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: product.stockQuantity > 0 ? 'var(--success)' : 'var(--error)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        
        <button 
          className="btn" 
          style={{ marginTop: '1rem', padding: '0.5rem', fontSize: '0.9rem', borderRadius: '12px' }} 
          disabled={product.stockQuantity === 0}
          onClick={() => addToCart(product.id, 1)}
        >
          {product.stockQuantity > 0 ? 'Add to Cart' : 'Sold Out'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
