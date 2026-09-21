import React, { useState } from 'react';
import { Shield, Lock, FileText } from 'lucide-react';

const Terms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Hero Header */}
      <div style={{ backgroundColor: 'var(--bg-muted)', padding: '5rem 2rem 6rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--text-main)' }}>Legal & Privacy</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)' }}>
          Everything you need to know about our terms of service, privacy practices, and policies.
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '-3rem auto 4rem', padding: '0 2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar */}
        <div className="glass-panel" style={{ flex: '1 1 250px', padding: '1rem', borderRadius: '16px', position: 'sticky', top: '100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('terms')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '12px', 
                background: activeTab === 'terms' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: activeTab === 'terms' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'terms' ? 'bold' : 'normal',
                border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s'
              }}
            >
              <FileText size={20} /> Terms of Service
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '12px', 
                background: activeTab === 'privacy' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: activeTab === 'privacy' ? '#10b981' : 'var(--text-muted)',
                fontWeight: activeTab === 'privacy' ? 'bold' : 'normal',
                border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s'
              }}
            >
              <Lock size={20} /> Privacy Policy
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="glass-panel" style={{ flex: '3 1 500px', padding: '3rem', borderRadius: '16px', backgroundColor: 'var(--bg-main)' }}>
          
          {activeTab === 'terms' ? (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>Terms of Service</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: September 2026</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <section>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>1. Agreement to Terms</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    By accessing or using HappyPets, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. All products and services provided are subject to our return and refund policies.
                  </p>
                </section>
                
                <section>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>2. Intellectual Property</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    The Service and its original content, features, and functionality are and will remain the exclusive property of HappyPets and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                  </p>
                </section>

                <section>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>3. General Conditions</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices.
                  </p>
                </section>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={24} />
                </div>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>Privacy Policy</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Last updated: September 2026</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <section>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>1. Information We Collect</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    Your privacy is important to us. It is HappyPets' policy to respect your privacy regarding any information we may collect from you across our website. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.
                  </p>
                </section>
                
                <section>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>2. How We Use Information</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    We use the information we collect in various ways, including to:
                  </p>
                  <ul style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li>Provide, operate, and maintain our website</li>
                    <li>Improve, personalize, and expand our website</li>
                    <li>Understand and analyze how you use our website</li>
                    <li>Process your transactions and manage your orders</li>
                  </ul>
                </section>

                <section>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>3. Data Security</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                    We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                  </p>
                </section>
              </div>
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
};

export default Terms;
