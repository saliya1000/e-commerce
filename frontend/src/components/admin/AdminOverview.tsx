import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { DollarSign, ShoppingBag, AlertTriangle, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Sales Overview Area Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', flex: '2', minWidth: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Sales Overview</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily performance for the current month</p>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-muted)', padding: '0.25rem', borderRadius: '8px' }}>
              <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', background: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }}>Revenue</button>
              <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Orders</button>
              <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Profit</button>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {data.dailySales && data.dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No sales data available.</div>
            )}
          </div>
        </div>

        {/* Order Status Doughnut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', flex: '1', minWidth: '0' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Order Status</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Distribution of current orders</p>
          </div>
          <div style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column' }}>
            {data.statusBreakdown && data.statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {data.statusBreakdown.map((entry: any, index: number) => {
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No orders found.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
