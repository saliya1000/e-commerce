import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package, Users, Download } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // PDF Report State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!startDate || !endDate) return alert('Please select a start and end date.');
    setDownloading(true);
    try {
      const response = await api.get('/admin/reports/download', {
        params: { startDate, endDate, reportType },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading reports...</div>;
  if (!data) return <div style={{ padding: '2rem' }}>Failed to load reports.</div>;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Reports & Analytics</h2>

      {/* PDF Generation Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Report Type</label>
          <select value={reportType} onChange={e => setReportType(e.target.value)} className="form-input">
            <option value="sales">Sales Report</option>
            <option value="cost">Cost & Profit Report</option>
            <option value="inventory">Inventory Updates</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input" />
        </div>
        <button 
          onClick={handleDownloadReport} 
          disabled={downloading}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={18} /> {downloading ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Best-Selling Products */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 'bold' }}>Top 5 Best-Selling Products</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0' }}>Product</th>
                <th style={{ padding: '0.75rem 0' }}>Price</th>
                <th style={{ padding: '0.75rem 0' }}>Sold</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0' }}>{p.name}</td>
                  <td style={{ padding: '0.75rem 0' }}>${Number(p.price).toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{p.totalSold}</td>
                </tr>
              ))}
              {data.topProducts.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No sales data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Package size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 'bold' }}>Low Stock Inventory (&lt; 5)</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0' }}>Product</th>
                <th style={{ padding: '0.75rem 0' }}>Stock Left</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStockProducts.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0' }}>{p.name}</td>
                  <td style={{ padding: '0.75rem 0', color: '#ef4444', fontWeight: 'bold' }}>{p.stockQuantity}</td>
                </tr>
              ))}
              {data.lowStockProducts.length === 0 && (
                <tr><td colSpan={2} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>All products are well stocked.</td></tr>
              )}
            </tbody>
          </table>
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
