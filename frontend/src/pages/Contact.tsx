import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Contact Us</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>
        Have a question or feedback? We'd love to hear from you.
      </p>
      
      <div className="glass-panel hover-lift">
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={(e) => e.preventDefault()}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
              <input type="text" placeholder="John Doe" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-muted)', color: 'var(--text-main)' }} required />
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
              <input type="email" placeholder="john@example.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-muted)', color: 'var(--text-main)' }} required />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message</label>
            <textarea placeholder="How can we help you?" rows={5} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-muted)', color: 'var(--text-main)', resize: 'vertical' }} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Send Message</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
