import React from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Users, 
  Award, 
  Mail, 
  Building2, 
  Calendar, 
  Target, 
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Brand SVG Icons
const InstagramIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const YouTubeIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.29.62.11 1.26.04 1.84-.19.8-.31 1.44-.96 1.74-1.76.15-.43.23-.89.23-1.35.01-4.44-.01-8.88.02-13.32z"/>
  </svg>
);

const About: React.FC = () => {
  const teamMembers = [
    {
      id: 'sarah-jenkins',
      name: 'Sarah Jenkins',
      role: 'Founder & Chief Executive Officer',
      initials: 'SJ',
      gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
      bio: 'Founded HappyPets in 2021 after searching for clean-ingredient food for her rescue Golden Retriever. Sarah leads our product strategy and animal welfare partnerships.',
      social: {
        linkedin: 'https://linkedin.com/in/sarah-jenkins-happypets',
        twitter: 'https://twitter.com/sarahjenkins_pets'
      }
    },
    {
      id: 'dr-mark-rover',
      name: 'Dr. Mark Rover, DVM',
      role: 'Chief Veterinary Officer & Health Lead',
      initials: 'MR',
      gradient: 'linear-gradient(135deg, #10b981, #3b82f6)',
      bio: 'With over 15 years of companion animal practice, Dr. Rover ensures every nutritional formulation, treat, and toy adheres to the highest veterinary safety standards.',
      social: {
        linkedin: 'https://linkedin.com/in/drmarkrover-dvm',
        twitter: 'https://twitter.com/dr_markrover'
      }
    },
    {
      id: 'emily-chen',
      name: 'Emily Chen',
      role: 'Head of Product Quality & Ethical Sourcing',
      initials: 'EC',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      bio: 'Specializing in sustainable pet goods, Emily vets suppliers worldwide to deliver 100% non-toxic, durable playthings and eco-friendly accessories.',
      social: {
        linkedin: 'https://linkedin.com/in/emilychen-sourcing',
        instagram: 'https://instagram.com/emilychen_pets'
      }
    },
    {
      id: 'david-kim',
      name: 'David Kim',
      role: 'Director of Customer Care & Experience',
      initials: 'DK',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      bio: 'David and his dedicated support team ensure every pet parent receives lightning-fast order tracking, helpful feeding guidance, and compassionate service.',
      social: {
        linkedin: 'https://linkedin.com/in/davidkim-support',
        twitter: 'https://twitter.com/davidkim_care'
      }
    }
  ];

  const socialLinks = [
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@happypets',
      url: 'https://instagram.com/happypets',
      color: '#E4405F',
      bgGradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
      description: 'Daily pet nutrition tips, cute customer features, and community photos.',
      icon: <InstagramIcon size={24} />
    },
    {
      id: 'facebook',
      name: 'Facebook',
      handle: 'HappyPets Official',
      url: 'https://facebook.com/happypets',
      color: '#1877F2',
      bgGradient: 'linear-gradient(135deg, #1877f2, #0d5fc2)',
      description: 'Join our thriving community of over 50,000 engaged pet parents.',
      icon: <FacebookIcon size={24} />
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      handle: '@HappyPetsApp',
      url: 'https://twitter.com/happypets',
      color: '#000000',
      bgGradient: 'linear-gradient(135deg, #1f2937, #111827)',
      description: 'Live product release updates, pet wellness advice, and fast support.',
      icon: <TwitterIcon size={24} />
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      handle: 'HappyPets Inc.',
      url: 'https://linkedin.com/company/happypets',
      color: '#0A66C2',
      bgGradient: 'linear-gradient(135deg, #0a66c2, #004182)',
      description: 'Corporate news, veterinary research, pet care insights, and open careers.',
      icon: <LinkedInIcon size={24} />
    },
    {
      id: 'youtube',
      name: 'YouTube',
      handle: '@HappyPetsOfficial',
      url: 'https://youtube.com/@happypets',
      color: '#FF0000',
      bgGradient: 'linear-gradient(135deg, #ff0000, #cc0000)',
      description: 'Educational veterinary Q&As, healthy feeding tutorials, and pet guides.',
      icon: <YouTubeIcon size={24} />
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: '@happypets',
      url: 'https://tiktok.com/@happypets',
      color: '#000000',
      bgGradient: 'linear-gradient(135deg, #00f2fe, #4facfe)',
      description: 'Fun pet training hacks, unboxing videos, and wholesome pet moments.',
      icon: <TikTokIcon size={24} />
    }
  ];

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* 1. Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-muted)', padding: '4.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
          
          <div style={{ flex: '1 1 450px', zIndex: 1 }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.35rem 1rem', 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary)', 
              borderRadius: '9999px', 
              fontWeight: 'bold', 
              fontSize: '0.85rem', 
              marginBottom: '1.25rem' 
            }}>
              <Sparkles size={16} /> ABOUT HAPPYPETS
            </span>
            <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1.2', color: 'var(--text-main)' }}>
              Dedicated to the Health and Happiness of Every Pet
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              At HappyPets, we believe pets aren't just animals—they're cherished family members. Founded in 2021, we deliver veterinarian-vetted nutrition, safe interactive toys, and cozy pet essentials directly to loving homes across the nation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/products" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.05rem', textDecoration: 'none' }}>
                Shop Our Products
              </Link>
              <Link to="/contact" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '1.05rem', textDecoration: 'none' }}>
                Contact Support
              </Link>
            </div>
          </div>

          <div style={{ flex: '1 1 400px', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', 
              background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(255,255,255,0) 70%)', 
              zIndex: 0 
            }}></div>
            <img 
              src="/happypets-hero.png" 
              alt="Happy Dog and Cat" 
              style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1 }}
            />
          </div>
        </div>
      </section>

      {/* 2. Key Numbers & Metrics Banner */}
      <section style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>50,000+</div>
            <div style={{ opacity: 0.9, fontSize: '1rem' }}>Pets Nourished & Happy</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>100,000+</div>
            <div style={{ opacity: 0.9, fontSize: '1rem' }}>Orders Delivered</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>25,000+</div>
            <div style={{ opacity: 0.9, fontSize: '1rem' }}>Shelter Meals Donated</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>100%</div>
            <div style={{ opacity: 0.9, fontSize: '1rem' }}>Vet-Approved Quality</div>
          </div>
        </div>
      </section>

      {/* 3. Companies Information Section */}
      <section id="company-information" style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ORGANIZATION & ROOTS
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '1rem' }}>
            Company Information
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
            HappyPets Inc. is a registered pet lifestyle and wellness enterprise committed to ethical product sourcing, animal health, and exceptional customer delight.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-panel hover-lift" style={{ padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                <Building2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Corporate Headquarters</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
              <strong>HappyPets Inc.</strong><br />
              100 Paws Way, Suite 400<br />
              San Francisco, CA 94107, USA
            </p>
          </div>

          <div className="glass-panel hover-lift" style={{ padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Calendar size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>History & Background</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
              Founded in <strong>2021</strong>, HappyPets began with a small group of animal nutritionists and veterinarians looking to provide transparent, safe, and wholesome alternatives to generic retail pet supplies.
            </p>
          </div>

          <div className="glass-panel hover-lift" style={{ padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Customer Support & Inquiries</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
              <strong>Email:</strong> <a href="mailto:support@happypets.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>support@happypets.com</a><br />
              <strong>Phone:</strong> <a href="tel:+18005550199" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>+1 (800) 555-0199</a><br />
              <strong>Hours:</strong> Mon – Fri: 8:00 AM – 5:00 PM PST
            </p>
          </div>

        </div>
      </section>

      {/* 4. Mission & Values Section */}
      <section id="company-mission" style={{ backgroundColor: 'var(--bg-muted)', padding: '5.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.35rem 1rem', 
              background: 'rgba(16, 185, 129, 0.12)', 
              color: '#059669', 
              borderRadius: '9999px', 
              fontWeight: 'bold', 
              fontSize: '0.85rem', 
              marginBottom: '1rem' 
            }}>
              <Target size={16} /> OUR MISSION & PURPOSE
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-main)' }}>
              Our Mission
            </h2>
            <div style={{ 
              background: 'var(--bg-main)', 
              padding: '2.5rem', 
              borderRadius: '20px', 
              border: '2px solid rgba(99, 102, 241, 0.2)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              maxWidth: '900px',
              margin: '0 auto 3rem'
            }}>
              <p style={{ 
                fontSize: '1.4rem', 
                fontWeight: 600, 
                lineHeight: '1.6', 
                color: 'var(--text-main)', 
                margin: 0,
                fontStyle: 'italic'
              }}>
                "At HappyPets, our mission is to enrich the health, happiness, and lifespan of pets everywhere by providing clean, veterinarian-vetted nutrition, safe interactive enrichment, and compassionate support for pet parents. We believe pets are family, and we exist to make world-class pet care accessible, transparent, and joyful."
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            <div className="glass-panel hover-lift" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Uncompromising Quality</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Every single item in our catalog undergoes rigorous safety checks and veterinarian approval. If it wouldn't be safe for our own beloved pets, it will never be listed in our store.
              </p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Heart size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Compassionate Care</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                We guide pet parents through every stage of their pet's life. From tailored diets for sensitive stomachs to orthopedic recovery beds, empathy drives everything we do.
              </p>
            </div>

            <div className="glass-panel hover-lift" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Award size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 'bold' }}>Community Giving</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                A dedicated percentage of every purchase goes directly to local rescue animal shelters and rehabilitation programs, funding emergency meals, vaccinations, and adoption drives.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Team Section */}
      <section id="our-team" style={{ padding: '5.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.35rem 1rem', 
            background: 'rgba(99, 102, 241, 0.1)', 
            color: 'var(--primary)', 
            borderRadius: '9999px', 
            fontWeight: 'bold', 
            fontSize: '0.85rem', 
            marginBottom: '1rem' 
          }}>
            <Users size={16} /> LEADERSHIP & SPECIALISTS
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Meet Our Team
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            The veterinarians, nutrition specialists, and dedicated pet advocates working every day to ensure your companion receives the best.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem' }}>
          {teamMembers.map(member => (
            <div 
              key={member.id} 
              className="glass-panel hover-lift" 
              style={{ 
                padding: '2.5rem 1.5rem', 
                borderRadius: '20px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between' 
              }}
            >
              <div>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: member.gradient, 
                  margin: '0 auto 1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '2.25rem', 
                  fontWeight: 'bold', 
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)' 
                }}>
                  {member.initials}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
                  {member.name}
                </h3>
                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {member.role}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {member.bio}
                </p>
              </div>

              {/* Team Member Social Links */}
              <div style={{ 
                borderTop: '1px solid var(--border-color)', 
                paddingTop: '1rem', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '1rem' 
              }}>
                {member.social.linkedin && (
                  <a 
                    href={member.social.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={`${member.name} on LinkedIn`}
                    style={{ color: '#0A66C2', transition: 'transform 0.2s ease', display: 'inline-flex' }}
                    className="hover-lift"
                  >
                    <LinkedInIcon size={20} />
                  </a>
                )}
                {member.social.twitter && (
                  <a 
                    href={member.social.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={`${member.name} on Twitter / X`}
                    style={{ color: 'var(--text-main)', transition: 'transform 0.2s ease', display: 'inline-flex' }}
                    className="hover-lift"
                  >
                    <TwitterIcon size={20} />
                  </a>
                )}
                {member.social.instagram && (
                  <a 
                    href={member.social.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label={`${member.name} on Instagram`}
                    style={{ color: '#E4405F', transition: 'transform 0.2s ease', display: 'inline-flex' }}
                    className="hover-lift"
                  >
                    <InstagramIcon size={20} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Links to Social Media Section */}
      <section id="social-media" style={{ backgroundColor: 'var(--bg-muted)', padding: '5.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.35rem 1rem', 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary)', 
              borderRadius: '9999px', 
              fontWeight: 'bold', 
              fontSize: '0.85rem', 
              marginBottom: '1rem' 
            }}>
              STAY CONNECTED
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-main)' }}>
              Follow Us on Social Media
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Connect with HappyPets across all major platforms for pet care guidance, real customer stories, live giveaways, and product launches.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {socialLinks.map(social => (
              <div 
                key={social.id}
                className="glass-panel hover-lift"
                style={{ 
                  padding: '2rem', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${social.color}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '12px', 
                        background: social.bgGradient, 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}>
                        {social.icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{social.name}</h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{social.handle}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
                    {social.description}
                  </p>
                </div>

                <a 
                  id={`social-link-${social.id}`}
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={`Visit HappyPets on ${social.name}`}
                  className="btn btn-outline"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem', 
                    textDecoration: 'none', 
                    fontWeight: 600,
                    padding: '0.75rem 1rem',
                    borderRadius: '8px'
                  }}
                >
                  <span>Follow on {social.name}</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. Bottom Call to Action Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.06))', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Have a question for our team?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            We're here to help you select the ideal diet, fit the right accessories, or answer any pet wellness questions.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Send Us a Message</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/faq" className="btn btn-outline" style={{ padding: '0.85rem 2.25rem', fontSize: '1.1rem', textDecoration: 'none' }}>
              Read FAQs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;

