import React, { useState } from 'react';
import { Package, Star, ShoppingCart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/image';

export interface ProductTileProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number | string;
    brand?: string;
    stockQuantity: number;
    rating?: number | string;
    reviewCount?: number;
    category?: { id?: string; name?: string };
    images?: { url: string; mediumUrl?: string; thumbnailUrl?: string; isPrimary: boolean }[];
  };
}

export const ProductTile: React.FC<ProductTileProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const primaryImageObj = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const primaryImage = primaryImageObj ? getImageUrl(primaryImageObj.mediumUrl || primaryImageObj.url) : null;
  const inStock = (product.stockQuantity || 0) > 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || isAdding) return;

    try {
      setIsAdding(true);
      await addToCart(product.id, 1);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 1600);
    } catch (err) {
      console.error('Failed to quick add to cart', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div 
      className="product-tile hover-lift"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* 1. Clean Product Image Canvas */}
      <Link 
        to={`/products/${product.id}`} 
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          height: '180px',
          background: 'var(--bg-muted)',
          overflow: 'hidden',
          textDecoration: 'none'
        }}
      >
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={product.name} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s ease'
            }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={44} color="var(--text-muted)" opacity={0.4} />
          </div>
        )}

        {/* Subtle Out of Stock badge ONLY if out of stock */}
        {!inStock && (
          <span 
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#ef4444',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              pointerEvents: 'none'
            }}
          >
            Sold Out
          </span>
        )}
      </Link>

      {/* 2. Structured Content Body */}
      <div 
        style={{
          padding: '0.85rem 1rem 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}
      >
        <div>
          {/* Brand & Category Label */}
          <div 
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '0.25rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {product.brand ? `${product.brand} • ` : ''}{product.category?.name || 'Pet Supplies'}
          </div>

          {/* Product Title */}
          <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 
              className="line-clamp-2"
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                lineHeight: 1.35,
                margin: '0',
                minHeight: '2.5rem',
                color: 'var(--text-main)'
              }}
            >
              {product.name}
            </h3>
          </Link>

          {/* Clean Inline Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.35rem' }}>
            {product.rating !== undefined && Number(product.rating) > 0 ? (
              <>
                <Star size={13} fill="#fbbf24" color="#fbbf24" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {Number(product.rating).toFixed(1)}
                </span>
                {product.reviewCount !== undefined && product.reviewCount > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({product.reviewCount})
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No reviews yet</span>
            )}
          </div>
        </div>

        {/* 3. Bottom Row: Price & Add to Cart Action */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'auto'
          }}
        >
          <div>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>
              Price
            </span>
            <span 
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--primary)',
                lineHeight: 1.2
              }}
            >
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          <button 
            type="button"
            disabled={!inStock || isAdding}
            onClick={handleQuickAdd}
            aria-label={inStock ? `Add ${product.name} to cart` : 'Sold Out'}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: inStock ? 'pointer' : 'not-allowed',
              background: !inStock 
                ? 'var(--bg-muted)' 
                : isAdded 
                ? '#10b981' 
                : 'var(--primary)',
              color: !inStock ? 'var(--text-muted)' : 'white',
              boxShadow: isAdded ? '0 2px 8px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(255, 127, 80, 0.25)',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isAdded ? (
              <>
                <Check size={13} />
                <span>Added</span>
              </>
            ) : isAdding ? (
              <span>...</span>
            ) : (
              <>
                <ShoppingCart size={13} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTile;
