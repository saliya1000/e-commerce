import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Package, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [sortType, setSortType] = useState<'recommended' | 'recent'>('recommended');
  const [visibleReviews, setVisibleReviews] = useState(5);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  

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

  const handleVoteHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      alert('Please login to vote.');
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/vote`);
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 } : r
      ));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to vote');
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
              <span className="text-muted font-bold ml-2">{Number(product.rating).toFixed(1)} ({product.reviewCount} reviews)</span>
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
      <section className="py-12" style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 mb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <span className="font-extrabold" style={{ fontSize: '1.25rem' }}>{product.reviewCount} reviews</span>
            <span className="text-muted">|</span>
            <span className="font-extrabold text-lg">{product.rating ? Number(product.rating).toFixed(1) : '0.0'}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={18} fill={star <= Number(product.rating) ? 'var(--text-main)' : 'transparent'} color="var(--text-main)" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>
            <ShieldCheck size={16} /> All reviews are from verified purchases
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 items-center flex-wrap">
          <button 
            onClick={() => setSortType('recommended')}
            className={`btn btn-outline px-4 py-1.5 rounded-full text-sm flex items-center gap-1 ${sortType === 'recommended' ? 'font-semibold text-main' : 'text-muted'}`} 
            style={{ border: sortType === 'recommended' ? '1px solid var(--text-main)' : '1px solid var(--border-color)' }}
          >
            Recommended
          </button>
          <button 
            onClick={() => setSortType('recent')}
            className={`btn btn-outline px-4 py-1.5 rounded-full text-sm flex items-center gap-1 ${sortType === 'recent' ? 'font-semibold text-main' : 'text-muted'}`} 
            style={{ border: sortType === 'recent' ? '1px solid var(--text-main)' : '1px solid var(--border-color)' }}
          >
            Most recent
          </button>
        </div>
        
        {reviews.length === 0 ? (
          <div className="text-center py-12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 className="font-bold text-muted mb-2">No reviews yet</h3>
            <p className="text-muted">This product doesn't have any reviews.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              {[...reviews]
                .sort((a, b) => {
                  if (sortType === 'recent') {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }
                  return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
                })
                .slice(0, visibleReviews)
                .map(review => (
                <div key={review.id} className="pb-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E91E63', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                        {review.user?.firstName?.[0] || 'A'}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-main">{review.user?.firstName} {review.user?.lastName?.[0]}.</span>
                        <span className="text-muted text-sm mx-1">on {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating & Tag */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={16} fill={star <= review.rating ? 'var(--text-main)' : 'transparent'} color="var(--text-main)" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Comment */}
                  {review.comment && <p className="text-main mb-3" style={{ lineHeight: 1.6, fontSize: '1rem' }}>{review.comment}</p>}

                  {/* Helpful Button */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleVoteHelpful(review.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded border text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                    >
                      👍 Helpful ({review.helpfulVotes || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {visibleReviews < reviews.length && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => setVisibleReviews(prev => prev + 5)}
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem 2rem', borderRadius: '9999px', fontWeight: 'bold', border: '1px solid var(--text-main)' }}
                >
                  See all reviews
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default ProductDetail;
