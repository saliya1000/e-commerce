import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, HeadphonesIcon, Award, ArrowRight, Sparkles, Layers } from 'lucide-react';
import api from '../services/api';
import ProductTile from '../components/ProductTile';
import SubNavbar from '../components/SubNavbar';
import { SEO } from '../components/SEO';
import { getImageUrl } from '../utils/image';

interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  productCount?: number;
}

const defaultCategoryFallbackImages: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&q=80',
  toys: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&q=80',
  accessories: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600&q=80',
  dogs: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80',
  cats: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
  birds: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600&q=80'
};

const getCategoryImg = (col: CollectionItem) => {
  if (col.thumbnailUrl) return getImageUrl(col.thumbnailUrl);
  if (col.imageUrl) return getImageUrl(col.imageUrl);
  const lower = col.name.toLowerCase();
  for (const [key, img] of Object.entries(defaultCategoryFallbackImages)) {
    if (lower.includes(key)) return img;
  }
  return 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80';
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/storefront/home?limit=10');
        if (res.data) {
          setCollections(res.data.collections || []);
          const featured = (res.data.featuredProducts || []).filter((p: any) => p.isFeatured);
          setFeaturedProducts(featured);
        }
      } catch (err) {
        console.error('Failed to fetch storefront home data, falling back:', err);
        try {
          const [prodRes, catRes] = await Promise.all([
            api.get('/products?limit=10&isFeatured=true&sortBy=rating&sortOrder=desc'),
            api.get('/products/categories')
          ]);
          const fallbackFeatured = (prodRes.data?.data || []).filter((p: any) => p.isFeatured);
          setFeaturedProducts(fallbackFeatured);
          const rawCats = catRes.data || [];
          setCollections(rawCats.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            productCount: c._count?.products || 0,
            imageUrl: c.imageUrl
          })));
        } catch (fallbackErr) {
          console.error('Fallback failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div style={{ paddingBottom: '0' }}>
      <SEO 
        title="Premium Pet Products & Accessories | i-love-shopping" 
        description="Explore our premium collection of dog food, cat toys, bird accessories, and more. Shop i-love-shopping for the best quality pet supplies online today!" 
      />
      <SubNavbar />

      {/* 2. Hero Banner Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--bg-muted) 0%, #FFF5F2 100%)',
        padding: '3.5rem 1rem',
        overflow: 'hidden'
      }}>
        <div 
          className="container flex-col-mobile" 
          style={{ 
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '2.5rem' 
          }}
        >
          <div style={{ flex: 1, maxWidth: '580px' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: 'white', 
              color: 'var(--primary)', 
              padding: '0.35rem 0.85rem', 
              borderRadius: '9999px', 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              marginBottom: '1rem'
            }}>
              🐾 Welcome to HappyPets
            </span>
            <h1 className="font-extrabold text-main" style={{ fontSize: '3.2rem', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Spoil Your <span className="text-primary">Best Friend</span> Today! <br />
              <span style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginTop: '0.5rem' }}>
                Premium Pet Products & Supplies
              </span>
            </h1>
            <p className="text-muted" style={{ fontSize: '1.15rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Explore our premium collection of nutritional pet food, interactive toys, and cozy accessories crafted for happy pets.
            </p>
            <button 
              className="btn" 
              onClick={() => navigate('/products')} 
              style={{ display: 'inline-flex', width: 'auto', padding: '0.9rem 2.2rem', fontSize: '1.05rem', borderRadius: '9999px', gap: '0.5rem' }}
            >
              <span>Shop Now</span>
              <ArrowRight size={18} />
            </button>
          </div>
          <div style={{ flex: 1, width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=700&q=80" 
              alt="Happy Beagle Dog" 
              style={{ 
                objectFit: 'cover', 
                borderRadius: '1.75rem', 
                width: '100%', 
                height: '360px', 
                boxShadow: '0 16px 32px -8px rgba(0, 0, 0, 0.12)',
                display: 'block'
              }} 
            />
          </div>
        </div>
      </section>

      {/* 3. Collections / Shop by Category */}
      <section className="py-16" style={{ maxWidth: '1240px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div className="flex flex-col-mobile justify-between items-center mb-10" style={{ gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFF5F2', color: 'var(--primary)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <Layers size={14} /> Curated Collections
            </div>
            <h2 className="font-extrabold" style={{ fontSize: '2.25rem', margin: 0, color: 'var(--text-main)' }}>
              Shop by Collection
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Discover specialized categories tailored for all your pets' daily needs
            </p>
          </div>
          <Link to="/products" className="text-primary font-bold hover:underline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: collections.length <= 4 
              ? 'repeat(auto-fit, minmax(240px, 1fr))' 
              : 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '1.25rem' 
          }}
        >
          {collections.map((col) => (
            <div 
              key={col.id} 
              onClick={() => navigate(`/products?categoryId=${col.id}`)} 
              className="hover-lift"
              style={{ 
                borderRadius: '16px', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                padding: '0.75rem',
                gap: '0.75rem'
              }}
            >
              {/* Clean Image Window */}
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden', width: '100%', borderRadius: '12px', background: 'var(--bg-muted)' }}>
                <img 
                  src={getCategoryImg(col)} 
                  alt={col.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {col.productCount !== undefined && col.productCount > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    color: 'var(--text-main)', 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '3px 8px', 
                    borderRadius: '9999px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    {col.productCount} {col.productCount === 1 ? 'Item' : 'Items'}
                  </span>
                )}
              </div>

              {/* Clean Card Body */}
              <div style={{ padding: '0.25rem 0.5rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                    {col.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 0.75rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.description || `Explore our ${col.name} selection`}
                  </p>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Explore Collection</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Special Offers / Promotional Banner */}
      <section style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #16938a 100%)', color: 'white' }} className="py-12 text-center">
        <div className="container" style={{ maxWidth: '1240px' }}>
          <h2 className="font-extrabold mb-3" style={{ fontSize: '2.5rem', letterSpacing: '-0.02em' }}>🐾 Weekend Special!</h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '1.75rem', opacity: 0.95 }}>Get 20% OFF all Premium Dog Food. Limited time only!</p>
          <button 
            onClick={() => navigate('/products?categoryId=food')} 
            style={{ 
              background: 'white', 
              color: 'var(--secondary)', 
              border: 'none', 
              padding: '0.85rem 2.2rem', 
              borderRadius: '9999px', 
              fontSize: '1.05rem', 
              fontWeight: 800, 
              cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s ease'
            }}
          >
            Claim Offer
          </button>
        </div>
      </section>

      {/* 5. Featured Products Section */}
      <section className="py-16" style={{ maxWidth: '1240px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div className="flex flex-col-mobile justify-between items-center mb-10" style={{ gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFF5F2', color: 'var(--primary)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <Sparkles size={14} /> Handpicked For You
            </div>
            <h2 className="font-extrabold" style={{ fontSize: '2.25rem', margin: 0, color: 'var(--text-main)' }}>
              Featured Products
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
              Handpicked top favorites and customer bestsellers for your furry family members
            </p>
          </div>
          <Link to="/products" className="text-primary font-bold hover:underline" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>View All Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {featuredProducts.length === 0 && !loading ? (
          <div className="text-center py-12 text-muted">
            No featured products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {featuredProducts.map(product => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12" style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/products')} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.85rem 2.25rem', borderRadius: '9999px', fontWeight: 700 }}
          >
            <span>Explore All Products</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 6. Trust Badges / Features */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem 4rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div className="grid grid-cols-4 gap-6">
          {[
            { icon: <Truck size={32} color="var(--primary)" />, title: 'Free Shipping', desc: 'On orders over $50' },
            { icon: <HeadphonesIcon size={32} color="var(--primary)" />, title: '24/7 Support', desc: 'Always here for you' },
            { icon: <ShieldCheck size={32} color="var(--primary)" />, title: 'Secure Payments', desc: '100% safe checkout' },
            { icon: <Award size={32} color="var(--primary)" />, title: 'Quality Guarantee', desc: '30-day return policy' }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <div style={{ background: '#FFF5F2', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
                {feature.icon}
              </div>
              <h4 className="font-bold" style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{feature.title}</h4>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
