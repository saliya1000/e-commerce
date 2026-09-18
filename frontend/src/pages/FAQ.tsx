import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>Frequently Asked Questions</h1>
      
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No FAQs available at the moment.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map(faq => (
            <div key={faq.id} className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => setOpenId(openId === faq.id ? null : faq.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{faq.question}</h3>
                {openId === faq.id ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
              </div>
              {openId === faq.id && (
                <p className="fade-in" style={{ marginTop: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQ;
