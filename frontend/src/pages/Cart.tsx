import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Trash2, Plus, Minus } from 'lucide-react';

const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        let url = '/products?limit=4';
        if (cart && cart.items.length > 0) {
          const categoryId = cart.items[0].product.categoryId;
          if (categoryId) url += `&categoryId=${categoryId}`;
        }
        
        const res = await api.get(url);
        let recs = res.data.products || res.data;
        
        if (cart) {
          const cartProductIds = cart.items.map(i => i.productId);
          recs = recs.filter((p: any) => !cartProductIds.includes(p.id)).slice(0, 4);
        }
        
        setRecommended(recs);
      } catch (err) {
        console.error('Failed to fetch recommended products', err);
      }
    };
    fetchRecommended();
  }, [cart]);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'left', marginBottom: '2rem' }}>Shopping Cart</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: '3rem', alignItems: 'start' }}>
        <div>
          {!cart || cart.items.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h2 style={{ marginBottom: '1rem' }}>Your cart is empty</h2>
              <Link to="/products" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Continue Shopping &rarr;</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cart.items.map((item) => (
                <div key={item.id} className="glass-panel" style={{ display: 'flex', padding: '1.5rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)', gap: '1.5rem' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', background: 'var(--border)', flexShrink: 0 }}>
                    <img
                      src={item.product.images?.[0]?.url || 'https://via.placeholder.com/150'}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Link to={`/products/${item.productId}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-h)', textDecoration: 'none' }}>
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}
                        aria-label="Remove"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', margin: '0.5rem 0' }}>${Number(item.product.price).toFixed(2)}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-h)' }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-h)', minWidth: '40px', textAlign: 'center' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-h)' }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'left' }}>Order summary</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>${totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Shipping</span>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>Calculated at checkout</span>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-h)' }}>Order total</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!cart || cart.items.length === 0}
            className="btn"
            style={{ 
              width: '100%', 
              marginTop: '2rem', 
              padding: '1rem', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              opacity: (!cart || cart.items.length === 0) ? 0.5 : 1,
              cursor: (!cart || cart.items.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Recommended Products */}
      {recommended.length > 0 && (
        <div style={{ marginTop: '5rem', textAlign: 'left' }}>
          <h2 style={{ marginBottom: '2rem' }}>You may also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
            {recommended.map((product) => (
              <div key={product.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', background: 'var(--bg)', border: '1px solid var(--border)', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/products/${product.id}`)}>
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', background: 'var(--border)', marginBottom: '1rem' }}>
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/150'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text-h)' }}>
                  {product.name}
                </h3>
                <p style={{ fontWeight: 700, color: 'var(--accent)', margin: 0 }}>${product.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
