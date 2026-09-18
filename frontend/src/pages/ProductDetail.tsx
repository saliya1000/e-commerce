import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Package, ThumbsUp } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/products/${id}`)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
      } catch (err) {
        console.error('Failed to fetch product details', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductAndReviews();
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    try {
      const res = await api.post(`/reviews/products/${id}`, { rating, comment });
      setReviews([res.data, ...reviews]);
      setComment('');
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const handleVote = async (reviewId: string) => {
    try {
      await api.post(`/reviews/${reviewId}/vote`);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 } : r));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to vote');
    }
  };

  if (loading) return <div className="container py-16 text-center">Loading...</div>;
  if (!product) return <div className="container py-16 text-center">Product not found.</div>;

  const primaryImage = product.images?.find((img: any) => img.isPrimary)?.url || null;

  return (
    <main className="container py-12">
      <SEO 
        title={`${product.name} - Premium Pet Supplies | i-love-shopping`} 
        description={`${product.description.substring(0, 130)}... Buy ${product.name} and other premium pet supplies at i-love-shopping.`} 
      />
      
      <div className="grid grid-cols-2 gap-12 mb-16">
        {/* Product Image */}
        <div style={{ background: 'var(--bg-muted)', borderRadius: '1rem', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {primaryImage ? (
            <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Package size={120} color="var(--text-muted)" opacity={0.3} />
          )}
        </div>

        {/* Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{product.brand}</span>
            <h1 className="font-extrabold mt-4" style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>{product.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={18} fill={star <= Number(product.rating) ? 'var(--primary)' : 'transparent'} color="var(--primary)" />
                ))}
              </div>
              <span className="text-muted">({product.reviewCount} reviews)</span>
            </div>
          </div>
          
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>${Number(product.price).toFixed(2)}</div>
          
          <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            {product.description}
          </p>
          
          <div style={{ marginTop: 'auto' }}>
            <button 
              className="btn" 
              style={{ padding: '1rem 2rem', fontSize: '1.1rem', width: '100%' }}
              disabled={product.stockQuantity === 0}
              onClick={() => addToCart(product.id, 1)}
            >
              {product.stockQuantity > 0 ? 'Add to Cart' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '3rem' }}>
        <h2 className="font-bold mb-8" style={{ fontSize: '1.75rem' }}>Customer Reviews for {product.name}</h2>
        
        {/* Review Form */}
        {isAuthenticated ? (
          <form onSubmit={submitReview} className="glass-panel mb-8" style={{ padding: '2rem' }}>
            <h4 className="font-bold mb-4">Write a Review</h4>
            {reviewError && <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{reviewError}</p>}
            
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="rating" style={{ display: 'block', marginBottom: '0.5rem' }}>Rating</label>
              <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="form-input">
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Terrible</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="comment" style={{ display: 'block', marginBottom: '0.5rem' }}>Comment</label>
              <textarea 
                id="comment"
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                className="form-input" 
                rows={4}
                placeholder="Share your thoughts..."
              ></textarea>
            </div>
            
            <button type="submit" className="btn">Submit Review</button>
          </form>
        ) : (
          <div className="glass-panel mb-8" style={{ padding: '1.5rem', textAlign: 'center' }}>
            Please <a href={`/login?redirect=/products/${id}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>log in</a> to write a review.
          </div>
        )}

        {/* Review List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="font-bold">{review.user?.firstName} {review.user?.lastName}</span>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', marginBottom: '1rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={14} fill={star <= review.rating ? 'var(--primary)' : 'transparent'} color="var(--primary)" />
                  ))}
                </div>
                {review.comment && <p style={{ marginBottom: '1rem' }}>{review.comment}</p>}
                
                <button 
                  onClick={() => handleVote(review.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <ThumbsUp size={14} /> Helpful ({review.helpfulVotes || 0})
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductDetail;
