import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

const Contact: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Hero Header */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>We'd love to hear from you</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
          Whether you have a question about our products, need help with an order, or just want to share a picture of your pet, our team is ready to answer all your questions.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-3rem auto 4rem', padding: '0 2rem', display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
        
        {/* Contact Info Cards */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '12px' }}>
              <Mail size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Chat with us</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Our friendly team is here to help.</p>
              <a href="mailto:hello@happypets.com" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>hello@happypets.com</a>
            </div>
          </div>

          <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '12px' }}>
              <MapPin size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Visit us</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Come say hello at our headquarters.</p>
              <p style={{ color: 'var(--text-main)', fontWeight: 500 }}>100 Paws Way<br />San Francisco, CA 94107</p>
            </div>
          </div>

          <div className="glass-panel hover-lift" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1rem', borderRadius: '12px' }}>
              <Phone size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Call us</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Mon-Fri from 8am to 5pm.</p>
              <a href="tel:+18005550199" style={{ color: 'var(--text-main)', fontWeight: 'bold', textDecoration: 'none' }}>+1 (800) 555-0199</a>
            </div>
          </div>

        </div>

        {/* Contact Form */}
        <div className="glass-panel" style={{ flex: '2 1 500px', padding: '3rem', borderRadius: '16px', borderTop: '4px solid var(--primary)', position: 'relative' }}>
          
          {isSubmitted ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'var(--text-main)' }}>
              <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Message Sent!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Thanks for reaching out. Our team will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Send us a message</h2>
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>First name</label>
                  <input type="text" placeholder="John" className="form-input" style={{ width: '100%' }} required />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Last name</label>
                  <input type="text" placeholder="Doe" className="form-input" style={{ width: '100%' }} required />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email</label>
                <input type="email" placeholder="john@example.com" className="form-input" style={{ width: '100%' }} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Phone number (optional)</label>
                <input type="tel" placeholder="+1 (555) 000-0000" className="form-input" style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Message</label>
                <textarea placeholder="How can we help you today?" rows={5} className="form-input" style={{ width: '100%', resize: 'vertical' }} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <Send size={20} /> Send Message
              </button>
            </form>
          )}

        </div>
      </div>
      
    </div>
  );
};

export default Contact;
