import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await axios.get('/api/faqs');
        setFaqs(response.data);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Hero Header */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>How can we help?</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
          Find answers to our most commonly asked questions below.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '-3rem auto 4rem', padding: '0 2rem' }}>
        
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', borderTop: '4px solid var(--primary)', backgroundColor: 'var(--bg-muted)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Loading FAQs...
            </div>
          ) : faqs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              <MessageCircleQuestion size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p>No FAQs available at the moment.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {faqs.map(faq => (
                <div 
                  key={faq.id} 
                  style={{ 
                    padding: '1.5rem', 
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: '12px',
                    border: openId === faq.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                    boxShadow: openId === faq.id ? '0 10px 25px rgba(99,102,241,0.1)' : 'none'
                  }} 
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: openId === faq.id ? 'var(--primary)' : 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>{faq.question}</h3>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      backgroundColor: openId === faq.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {openId === faq.id ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                    </div>
                  </div>
                  
                  {/* Expandable Content */}
                  <div style={{ 
                    maxHeight: openId === faq.id ? '500px' : '0', 
                    overflow: 'hidden', 
                    transition: 'max-height 0.3s ease-in-out',
                    opacity: openId === faq.id ? 1 : 0
                  }}>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem', paddingRight: '2rem' }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Still have questions?</p>
          <a href="/contact" className="btn btn-outline" style={{ display: 'inline-block', textDecoration: 'none' }}>Contact Support</a>
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FAQ;
