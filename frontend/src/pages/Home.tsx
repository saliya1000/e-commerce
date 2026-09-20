import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, HeadphonesIcon, Award } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import SubNavbar from '../components/SubNavbar';
import { SEO } from '../components/SEO';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await api.get('/products?limit=4&sortBy=rating&sortOrder=desc');
        setTrendingProducts(response.data.data);
      } catch (err) {
        console.error('Failed to fetch trending products', err);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div style={{ paddingBottom: '0' }}>
      <SEO 
        title="Premium Pet Products & Accessories | i-love-shopping" 
        description="Explore our premium collection of dog food, cat toys, bird accessories, and more. Shop i-love-shopping for the best quality pet supplies online today!" 
      />
      <SubNavbar />
      <main>
      {/* 2. Hero Banner Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--bg-muted) 0%, #FFF5F2 100%)',
        padding: '4rem 1rem',
        overflow: 'hidden'
      }}>
        <div className="container flex-col-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
          <div style={{ flex: 1, maxWidth: '600px' }}>
            <h1 className="font-extrabold text-main" style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Spoil Your <span className="text-primary">Best Friend</span> Today! <br />
              <span style={{ fontSize: '2rem' }}>Premium Pet Products & Supplies</span>
            </h1>
            <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '2.5rem' }}>
              Explore our premium collection of dog food, cat toys, and accessories for your beloved pets.
            </p>
            <button className="btn" onClick={() => navigate('/products')} style={{ display: 'inline-flex', width: 'auto', padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '9999px' }}>
              Shop Now
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative', height: '400px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80" 
              alt="Happy Dog" 
              style={{ objectFit: 'cover', borderRadius: '2rem', width: '100%', height: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} 
            />
          </div>
        </div>
      </section>

      {/* 3. Quick Categories Grid */}
      <section className="container py-16">
        <h2 className="text-center font-extrabold mb-12" style={{ fontSize: '2rem' }}>Shop Premium Pet Products by Category</h2>
        <div className="grid grid-cols-5 gap-6 category-grid">
          {[
            { name: 'Dogs', icon: '🐶', path: '/products?q=dog' },
            { name: 'Cats', icon: '🐱', path: '/products?q=cat' },
            { name: 'Birds', icon: '🦜', path: '/products?q=bird' },
            { name: 'Toys', icon: '🎾', path: '/products?categoryId=toys' },
            { name: 'Food', icon: '🍖', path: '/products?categoryId=food' }
          ].map((cat, i) => (
            <div key={i} onClick={() => navigate(cat.path)} className="glass-panel text-center transition-transform hover:scale-105 hover:shadow-xl" style={{ cursor: 'pointer', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>{cat.icon}</div>
              <h3 className="font-bold">{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Special Offers / Promotional Banner */}
      <section style={{ background: 'var(--secondary)', color: 'white' }} className="py-12 text-center">
        <div className="container">
          <h2 className="font-extrabold mb-4" style={{ fontSize: '2.5rem' }}>🐾 Weekend Special!</h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Get 20% OFF all Premium Dog Food. Limited time only!</p>
          <button onClick={() => navigate('/products?categoryId=food')} style={{ background: 'white', color: 'var(--secondary)', border: 'none', padding: '1rem 2rem', borderRadius: '9999px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            Claim Offer
          </button>
        </div>
      </section>

      {/* 5. Featured / Trending Products */}
      <section className="container py-16">
        <div className="flex flex-col-mobile justify-between items-center mb-12" style={{ gap: '1rem' }}>
          <h2 className="font-extrabold" style={{ fontSize: '2rem' }}>Trending Pet Supplies</h2>
          <Link to="/products" className="text-primary font-bold" style={{ textDecoration: 'none' }}>View All →</Link>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {trendingProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <button className="btn btn-outline" onClick={() => navigate('/products')} style={{ display: 'inline-block', width: 'auto' }}>
            View All Products
          </button>
        </div>
      </section>

      {/* 6. Trust Badges / Features */}
      <section className="container py-12 mb-8" style={{ borderTop: '1px solid var(--border-color)' }}>
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
              <h4 className="font-bold">{feature.title}</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </main>
    </div>
  );
};

export default Home;
