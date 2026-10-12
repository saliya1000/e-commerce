import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.post('/contact', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject || undefined,
        message: formData.message
      });

      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      console.error('Failed to submit contact message:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to send message. Please verify your information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Hero Header */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>We'd love to hear from you</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
          Whether you have a question about our pet products, need help with an order, or just want to share feedback, our team is ready to answer all your questions.
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
              <a href="mailto:support@happypets.com" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>support@happypets.com</a>
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
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', textAlign: 'center', color: 'var(--text-main)' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <CheckCircle2 size={56} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Message Sent!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '450px', marginBottom: '2rem', lineHeight: 1.5 }}>
                Thanks for reaching out! A copy of your inquiry has been dispatched to our support team and recorded in our email system. We will get back to you shortly.
              </p>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setIsSubmitted(false)}
                style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Send us a message</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Fill in the details below and we will get back to you promptly.</p>
              </div>

              {errorMsg && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  color: '#b91c1c',
                  fontSize: '0.9rem'
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label htmlFor="contact-first-name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>First name *</label>
                  <input 
                    id="contact-first-name"
                    type="text" 
                    placeholder="John" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required 
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label htmlFor="contact-last-name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Last name</label>
                  <input 
                    id="contact-last-name"
                    type="text" 
                    placeholder="Doe" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label htmlFor="contact-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email address *</label>
                  <input 
                    id="contact-email"
                    type="email" 
                    placeholder="john@example.com" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label htmlFor="contact-phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Phone number (optional)</label>
                  <input 
                    id="contact-phone"
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                    className="form-input" 
                    style={{ width: '100%' }} 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Subject / Topic</label>
                <input 
                  id="contact-subject"
                  type="text" 
                  placeholder="e.g. Question about dog nutrition or delivery" 
                  className="form-input" 
                  style={{ width: '100%' }} 
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="contact-message" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Message *</label>
                <textarea 
                  id="contact-message"
                  placeholder="How can we help you today? Please include any relevant details or order numbers." 
                  rows={5} 
                  className="form-input" 
                  style={{ width: '100%', resize: 'vertical' }} 
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  fontSize: '1.1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  marginTop: '0.5rem',
                  opacity: isSubmitting ? 0.75 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Sending Message...
                  </>
                ) : (
                  <>
                    <Send size={20} /> Send Message
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
      
    </div>
  );
};

export default Contact;
