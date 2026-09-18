import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Terms & Privacy</h1>
      
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>1. Terms of Service</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
          By accessing or using HappyPets, you agree to be bound by these Terms of Service. 
          All products and services provided are subject to our return and refund policies.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          We reserve the right to refuse service to anyone for any reason at any time. You understand that your content 
          (not including credit card information), may be transferred unencrypted.
        </p>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>2. Privacy Policy</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
          Your privacy is important to us. It is HappyPets' policy to respect your privacy regarding any information we may collect 
          from you across our website.
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, 
          with your knowledge and consent.
        </p>
      </div>
    </div>
  );
};

export default Terms;
