import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export const AdminRefunds: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/refunds');
      setRefunds(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Refunds</h3>
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Refund ID</th>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>Amount</th>
              <th style={{ padding: '1rem' }}>Reason</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map(refund => (
              <tr key={refund.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{refund.id.slice(0, 8)}...</td>
                <td style={{ padding: '1rem' }}>{refund.orderId.slice(0, 8)}...</td>
                <td style={{ padding: '1rem' }}>${Number(refund.amount).toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{refund.reason || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    background: refund.status === 'completed' ? 'var(--success)' : refund.status === 'failed' ? 'red' : 'orange',
                    color: 'white'
                  }}>
                    {refund.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{new Date(refund.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
