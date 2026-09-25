import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Package, ThumbsUp } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewEligibility, setReviewEligibility] = useState<{ eligible: boolean; reason?: string } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setLoading(true);
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/products/${id}`)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
        const primaryImg = prodRes.data.images?.find((img: any) => img.isPrimary)?.url || prodRes.data.images?.[0]?.url || null;
        setActiveImage(primaryImg);
        
        // Fetch related products
        if (prodRes.data.categoryId) {
          const relatedRes = await api.get('/products', { 
            params: { categoryId: prodRes.data.categoryId, limit: 5 } 
          });
          // Filter out current product and keep up to 4
          setRelatedProducts(relatedRes.data.data.filter((p: any) => p.id !== id).slice(0, 4));
        }

        // Fetch review eligibility
        if (isAuthenticated) {
          try {
            const eligRes = await api.get(`/reviews/products/${id}/eligibility`);
            setReviewEligibility(eligRes.data);
          } catch (e) {
            console.error('Failed to fetch eligibility', e);
            setReviewEligibility({ eligible: false, reason: 'Could not verify purchase status.' });
          }
        }
      } catch (err) {
        console.error('Failed to fetch product details', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      window.scrollTo(0, 0); // Scroll to top when id changes
      fetchProductAndReviews();
    }
  }, [id, isAuthenticated]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    try {
      const res = await api.post(`/reviews/products/${id}`, { rating, comment });
      setReviews([res.data, ...reviews]);
      setComment('');
      setShowReviewForm(false);
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

  if (!product) return <div className="container py-16 text-center">Product not found.</div>;

  return (
    <main className="container py-12">
      <SEO 
        title={`${product.name} - Premium Pet Supplies | i-love-shopping`} 
        description={`${product.description.substring(0, 130)}... Buy ${product.name} and other premium pet supplies at i-love-shopping.`} 
      />
      
      {/* Product Hero Section */}
      <div className="grid grid-cols-2 md:grid-cols-1 mb-16" style={{ gap: '4rem' }}>
        {/* Product Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel rounded-2xl" style={{ padding: '0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px', background: 'var(--bg-card)' }}>
            {activeImage ? (
              <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }} className="transition-transform hover:scale-105" />
            ) : (
              <Package size={120} color="var(--text-muted)" opacity={0.3} />
            )}
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 mt-2" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImage(img.url)}
                  className={`rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 transition-transform ${activeImage === img.url ? 'shadow-md' : ''}`}
                  style={{ 
                    width: '90px', height: '90px',
                    border: activeImage === img.url ? '3px solid var(--primary)' : '3px solid transparent',
                    opacity: activeImage === img.url ? 1 : 0.7,
                  }}
                >
                  <img src={img.thumbnailUrl || img.url} alt={`${product.name} thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6" style={{ justifyContent: 'center' }}>
          <div>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.brand}
            </span>
            <h1 className="font-extrabold mt-4" style={{ fontSize: '3rem', lineHeight: 1.1, color: 'var(--text-main)' }}>{product.name}</h1>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={20} fill={star <= Number(product.rating) ? '#F59E0B' : 'transparent'} color={star <= Number(product.rating) ? '#F59E0B' : 'var(--border-color)'} />
                ))}
              </div>
              <span className="text-muted font-bold ml-2">({product.reviewCount} reviews)</span>
            </div>
          </div>
          
          <div className="font-extrabold text-primary" style={{ fontSize: '2.5rem' }}>${Number(product.price).toFixed(2)}</div>
          
          <p className="text-muted" style={{ fontSize: '1.15rem', lineHeight: 1.7 }}>
            {product.description}
          </p>
          
          <div className="mt-8">
            <button 
              className="btn btn-primary shadow-lg" 
              style={{ padding: '1.25rem 2.5rem', fontSize: '1.25rem', width: '100%' }}
              disabled={product.stockQuantity === 0}
              onClick={() => addToCart(product.id, 1)}
            >
              {product.stockQuantity > 0 ? (
                <>
                  <Package size={24} /> Add to Cart
                </>
              ) : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="py-12" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-extrabold" style={{ fontSize: '2rem' }}>You May Also Like</h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-2 gap-6 category-grid">
            {relatedProducts.map(prod => (
              <Link to={`/products/${prod.id}`} key={prod.id} className="glass-panel transition-transform hover:scale-105 hover:shadow-xl" style={{ display: 'block', padding: '1.5rem', textDecoration: 'none', color: 'inherit' }}>
                <div className="rounded-2xl" style={{ height: '220px', background: 'var(--bg-muted)', marginBottom: '1.25rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {prod.images?.[0] ? (
                    <img src={prod.images[0].mediumUrl || prod.images[0].url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Package size={48} color="var(--text-muted)" opacity={0.3} />
                  )}
                </div>
                <h3 className="font-bold mb-2" style={{ fontSize: '1.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</h3>
                <div className="text-primary font-bold" style={{ fontSize: '1.25rem' }}>${Number(prod.price).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="py-12" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-extrabold" style={{ fontSize: '2rem' }}>Customer Reviews</h2>
          {isAuthenticated && reviewEligibility?.eligible && !showReviewForm && (
            <button className="btn btn-outline" onClick={() => setShowReviewForm(true)}>Write a Review</button>
          )}
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-1 gap-12 flex-col-mobile">
          {/* Left Column: Rating Breakdown & Form */}
          <div className="col-span-1" style={{ flex: '1' }}>
            <div className="glass-panel mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="font-extrabold text-primary" style={{ fontSize: '3rem', lineHeight: 1 }}>
                  {product.rating ? Number(product.rating).toFixed(1) : '0.0'}
                </div>
                <div>
                  <div className="flex mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={20} fill={star <= Number(product.rating) ? '#F59E0B' : 'transparent'} color={star <= Number(product.rating) ? '#F59E0B' : 'var(--border-color)'} />
                    ))}
                  </div>
                  <div className="text-muted font-bold text-sm">{product.reviewCount} total reviews</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="text-muted font-bold" style={{ width: '45px' }}>{star} star</div>
                      <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }}></div>
                      </div>
                      <div className="text-muted text-sm text-right" style={{ width: '35px' }}>{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {showReviewForm && isAuthenticated && reviewEligibility?.eligible && (
              <form onSubmit={submitReview} className="glass-panel" style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold" style={{ fontSize: '1.25rem' }}>Write a Review</h4>
                  <button type="button" onClick={() => setShowReviewForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                </div>
                {reviewError && <p className="error-text">{reviewError}</p>}
                
                <div className="input-group">
                  <label htmlFor="rating">Rating</label>
                  <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Poor</option>
                    <option value={1}>1 - Terrible</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label htmlFor="comment">Comment</label>
                  <textarea 
                    id="comment"
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', color: 'var(--text-main)', fontFamily: 'inherit', width: '100%', resize: 'vertical' }}
                    rows={4}
                    placeholder="Share your thoughts about this product..."
                  ></textarea>
                </div>
                
                <button type="submit" className="btn mt-4">Submit Review</button>
              </form>
            )}
          </div>

          {/* Right Column: Review List */}
          <div className="col-span-2 flex flex-col gap-6" style={{ flex: '2' }}>
            {reviews.length === 0 ? (
              <div className="glass-panel text-center py-12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 className="font-bold text-muted mb-2">No reviews yet</h3>
                <p className="text-muted">This product doesn't have any reviews.</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="glass-panel transition-transform hover:shadow-md" style={{ padding: '1.75rem' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                      </div>
                      <div>
                        <span className="font-bold block" style={{ fontSize: '1.1rem' }}>{review.user?.firstName} {review.user?.lastName}</span>
                        <span className="text-primary font-bold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          Verified Buyer
                        </span>
                      </div>
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={16} fill={star <= review.rating ? '#F59E0B' : 'transparent'} color={star <= review.rating ? '#F59E0B' : 'var(--border-color)'} />
                    ))}
                  </div>
                  {review.comment && <p className="text-main" style={{ lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '1.05rem' }}>{review.comment}</p>}
                  
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleVote(review.id)}
                      className="flex items-center gap-2 text-muted transition-transform hover:scale-105"
                      style={{ background: 'var(--bg-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                      <ThumbsUp size={16} /> Helpful ({review.helpfulVotes || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProductDetail;
