import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Package, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { getImageUrl } from '../utils/image';

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
        const rawPrimaryImg = prodRes.data.images?.find((img: any) => img.isPrimary)?.url || prodRes.data.images?.[0]?.url || null;
        setActiveImage(rawPrimaryImg ? getImageUrl(rawPrimaryImg) : null);
        
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
                  onClick={() => setActiveImage(getImageUrl(img.url))}
                  className={`rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 transition-transform ${activeImage === getImageUrl(img.url) ? 'shadow-md' : ''}`}
                  style={{ 
                    width: '90px', height: '90px',
                    border: activeImage === getImageUrl(img.url) ? '3px solid var(--primary)' : '3px solid transparent',
                    opacity: activeImage === getImageUrl(img.url) ? 1 : 0.7,
                  }}
                >
                  <img src={getImageUrl(img.thumbnailUrl || img.url)} alt={`${product.name} thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <img src={getImageUrl(prod.images[0].mediumUrl || prod.images[0].url)} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
      <section className="py-12" style={{ marginTop: '2rem' }}>
        {/* Top Header */}
        <div className="flex justify-between items-center pb-6 mb-8" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-4">
            <h2 className="font-extrabold text-3xl m-0">{product.reviewCount} Reviews</h2>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full">
              <span className="font-extrabold text-xl text-yellow-600 dark:text-yellow-500">{product.rating ? Number(product.rating).toFixed(1) : '0.0'}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={20} fill={star <= Number(product.rating) ? '#F59E0B' : 'transparent'} color="#F59E0B" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '0.9rem', fontWeight: 700 }}>
            <ShieldCheck size={18} /> Verified Purchases
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-max shadow-inner">
          <button 
            onClick={() => setSortType('recommended')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${sortType === 'recommended' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-muted hover:text-main'}`} 
          >
            Recommended
          </button>
          <button 
            onClick={() => setSortType('recent')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${sortType === 'recent' ? 'bg-white dark:bg-gray-700 shadow-md text-primary' : 'text-muted hover:text-main'}`} 
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...reviews]
                .sort((a, b) => {
                  if (sortType === 'recent') {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }
                  return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
                })
                .slice(0, visibleReviews)
                .map(review => (
                <div key={review.id} className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF4B2B, #FF416C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(255, 65, 108, 0.3)' }}>
                        {review.user?.firstName?.[0] || 'A'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-main" style={{ fontSize: '1.05rem' }}>{review.user?.firstName} {review.user?.lastName?.[0]}.</span>
                        <span className="text-muted text-xs font-medium">on {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating & Tag */}
                  <div className="flex items-center gap-1 mb-4 bg-yellow-50 dark:bg-yellow-900/10 w-max px-2 py-1 rounded-md">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} fill={star <= review.rating ? '#F59E0B' : 'transparent'} color="#F59E0B" />
                    ))}
                  </div>
                  
                  {/* Comment */}
                  {review.comment && <p className="text-main mb-6" style={{ lineHeight: 1.7, fontSize: '1rem', color: 'var(--text-muted)' }}>"{review.comment}"</p>}

                  {/* Helpful Button */}
                  <div className="flex items-center mt-auto border-t border-gray-100 dark:border-gray-700 pt-4">
                    <button 
                      onClick={() => handleVoteHelpful(review.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{ color: review.helpfulVotes > 0 ? 'var(--primary)' : 'var(--text-muted)' }}
                    >
                      👍 Helpful <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">{review.helpfulVotes || 0}</span>
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
