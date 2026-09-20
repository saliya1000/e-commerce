import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSearch } from './AdminSearch';
import { AdminPagination } from './AdminPagination';

export const AdminRefunds: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchRefunds();
  }, [page, debouncedSearch]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/refunds', {
        params: { page, limit: 10, search: debouncedSearch }
      });
      setRefunds(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0 }}>Refunds</h3>
        <AdminSearch search={search} setSearch={setSearch} placeholder="Search refunds by order ID, status..." />
      </div>
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
      {!loading && refunds.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} setPage={setPage} />
      )}
    </div>
  );
};
