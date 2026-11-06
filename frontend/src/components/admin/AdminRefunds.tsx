import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSearch } from './AdminSearch';
import { AdminPagination } from './AdminPagination';
import { RefreshCcw, RotateCcw } from 'lucide-react';

export const AdminRefunds: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
      setRefunds(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setTotalCount(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRefundAmount = refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {/* Header and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={24} color="var(--primary)" /> Refunds & Returns
          </h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Review, track, and monitor all refunded customer orders
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AdminSearch search={search} setSearch={setSearch} placeholder="Search by order ID, reason, status..." />
          <button 
            onClick={fetchRefunds}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            title="Refresh refunds list"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-muted)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Refunded Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-main)' }}>{totalCount}</div>
        </div>
        <div style={{ background: 'var(--bg-muted)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Page Refund Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#ef4444' }}>
            ${totalRefundAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Refunds Table / Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCcw size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <p>Loading refunds...</p>
        </div>
      ) : refunds.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3.5rem 1rem', 
          background: 'var(--bg-muted)', 
          borderRadius: '12px', 
          border: '1px dashed var(--border-color)' 
        }}>
          <RotateCcw size={44} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 0.75rem' }} />
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Refunded Orders Found</h4>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {debouncedSearch ? 'No refunds matched your search criteria.' : 'Orders marked as refunded in Order Management will automatically show up here.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Refund ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Order ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map(refund => (
                <tr key={refund.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem' }} title={refund.id}>
                    {refund.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem' }} title={refund.orderId}>
                    {refund.orderId.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem' }}>
                    {refund.order?.user?.email || 'Guest'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#ef4444' }}>
                    ${Number(refund.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', maxWidth: '280px', wordBreak: 'break-word' }}>
                    {refund.reason || 'N/A'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: refund.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : refund.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: refund.status === 'completed' ? '#10b981' : refund.status === 'failed' ? '#ef4444' : '#f59e0b'
                    }}>
                      {refund.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(refund.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && refunds.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} setPage={setPage} />
      )}
    </div>
  );
};
