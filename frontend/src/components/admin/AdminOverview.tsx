import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { DollarSign, ShoppingBag, AlertTriangle, Users } from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/reports');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch overview', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  if (!data) return <div style={{ padding: '2rem' }}>Failed to load dashboard.</div>;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Dashboard Overview</h2>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <DollarSign size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Revenue</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>${Number(data.revenue).toFixed(2)}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <ShoppingBag size={24} style={{ color: '#10b981' }} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Orders</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{data.totalOrders}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Users size={24} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Active Users</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{data.totalUsers}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Low Stock Items</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{data.lowStockProducts.length}</h3>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>Order Status Breakdown</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {data.statusBreakdown.map((statusItem: any, index: number) => (
            <div key={index} style={{ background: 'var(--bg-muted)', padding: '1rem 1.5rem', borderRadius: '8px', minWidth: '150px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{statusItem.status}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusItem.count}</span>
            </div>
          ))}
          {data.statusBreakdown.length === 0 && (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No orders found.</div>
          )}
        </div>
      </div>
    </div>
  );
};
