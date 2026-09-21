import React from 'react';
import { Heart, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Hero Section */}
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-muted)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
          
          <div style={{ flex: '1 1 400px', zIndex: 1 }}>
            <span style={{ display: 'inline-block', padding: '0.25rem 1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1rem' }}>
              OUR STORY
            </span>
            <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1.2', color: 'var(--text-main)' }}>
              Because they're not just pets.<br />
              <span style={{ color: 'var(--primary)' }}>They're family.</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              At HappyPets, we believe every wag, purr, and chirp deserves the absolute best. Since 2021, we've been on a mission to deliver premium nutrition, engaging toys, and unmatched care directly to your doorstep.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/products" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
                Shop Now
              </Link>
              <Link to="/contact" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
                Contact Us
              </Link>
            </div>
          </div>

          <div style={{ flex: '1 1 400px', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', 
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)', 
              zIndex: 0 
            }}></div>
            <img 
              src="/happypets-hero.png" 
              alt="Happy Golden Retriever and Kitten" 
              style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>50k+</div>
            <div style={{ opacity: 0.9, fontSize: '1.1rem' }}>Happy Pets</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>100%</div>
            <div style={{ opacity: 0.9, fontSize: '1.1rem' }}>Quality Guarantee</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>24/7</div>
            <div style={{ opacity: 0.9, fontSize: '1.1rem' }}>Customer Support</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>5★</div>
            <div style={{ opacity: 0.9, fontSize: '1.1rem' }}>Rated Service</div>
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <div style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Our Core Values</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Everything we do is guided by our commitment to pets and the humans who love them.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-panel hover-lift" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Uncompromising Quality</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>We rigorously test and vet every single product. If it's not good enough for our own pets, we won't sell it to yours.</p>
          </div>

          <div className="glass-panel hover-lift" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Heart size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Compassionate Care</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>We treat every customer and pet with empathy. From finding the perfect diet to choosing the right bed, we're here to help.</p>
          </div>

          <div className="glass-panel hover-lift" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Users size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Community First</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>A portion of every sale goes directly to local animal shelters. Together, we're making the world a better place for all pets.</p>
          </div>

        </div>
      </div>

      {/* Meet The Team Section */}
      <div style={{ backgroundColor: 'var(--bg-muted)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Meet the Pack</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              The passionate pet-lovers working behind the scenes to bring you the best.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
            
            {/* Team Member 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(99,102,241,0.2)' }}>
                SJ
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Sarah Jenkins</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem' }}>Founder & CEO</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Sarah founded HappyPets after struggling to find reliable, high-quality food for her Golden Retriever, Max.</p>
            </div>

            {/* Team Member 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(16,185,129,0.2)' }}>
                MR
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Dr. Mark Rover</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem' }}>Lead Veterinarian</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>With 15 years of clinical experience, Dr. Rover ensures every product meets our strict health standards.</p>
            </div>

            {/* Team Member 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(245,158,11,0.2)' }}>
                🐾
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Luna</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '1rem' }}>Chief Happiness Officer</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Our official product tester. If Luna doesn't purr for it, it doesn't make it to the store.</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
