import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { DollarSign, ShoppingBag, AlertTriangle, Users, TrendingUp, RefreshCcw, Calendar, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, BarChart, Bar } from 'recharts';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Row 1: Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        
        {/* Total Sales */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 1.5rem 0 1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Total Sales</p>
              <h3 style={{ margin: '0.25rem 0', fontSize: '1.75rem', fontWeight: 'bold' }}>${Number(data.revenue).toFixed(2)}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={14}/> +18.2%</p>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <DollarSign size={20} style={{ color: '#10b981' }} />
            </div>
          </div>
          <div style={{ width: 'calc(100% + 3rem)', height: '60px', marginLeft: '-1.5rem', marginBottom: '-2px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySales || []}>
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 1.5rem 0 1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Avg Order Value</p>
              <h3 style={{ margin: '0.25rem 0', fontSize: '1.75rem', fontWeight: 'bold' }}>${Number(data.avgOrderValue || 0).toFixed(2)}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={14}/> +4.8%</p>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Calendar size={20} style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <div style={{ width: 'calc(100% + 3rem)', height: '60px', marginLeft: '-1.5rem', marginBottom: '-2px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySales || []}>
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Orders (Replaced Conversion Rate) */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 1.5rem 0 1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Total Orders</p>
              <h3 style={{ margin: '0.25rem 0', fontSize: '1.75rem', fontWeight: 'bold' }}>{data.totalOrders}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={14}/> +0.8%</p>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <TrendingUp size={20} style={{ color: '#6366f1' }} />
            </div>
          </div>
          <div style={{ width: 'calc(100% + 3rem)', height: '60px', marginLeft: '-1.5rem', marginBottom: '-2px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySales || []}>
                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Refund Rate */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 1.5rem 0 1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Refund Rate</p>
              <h3 style={{ margin: '0.25rem 0', fontSize: '1.75rem', fontWeight: 'bold' }}>{Number(data.refundRate || 0).toFixed(1)}%</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={14} style={{ transform: 'rotate(180deg)' }}/> -0.3%</p>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <RefreshCcw size={20} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div style={{ width: 'calc(100% + 3rem)', height: '60px', marginLeft: '-1.5rem', marginBottom: '-2px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailySales || []}>
                <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Sales Overview Area Chart */}
        <div className="admin-card" style={{ flex: '2', minWidth: '0' }}>
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
        <div className="admin-card" style={{ flex: '1', minWidth: '0' }}>
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

      {/* Row 3: Products & Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top Selling Products */}
        <div className="admin-card" style={{ flex: '2', minWidth: '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Top Selling Products</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Best performers this month</p>
            </div>
            <a href="#" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981', textDecoration: 'none' }}>View all &rarr;</a>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 500 }}>#</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 500 }}>Product</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 500 }}>Sold</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 500 }}>Revenue</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 500 }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts?.map((product: any, index: number) => (
                <tr key={product.id} style={{ borderBottom: index !== data.topProducts.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <td style={{ padding: '1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', background: 'var(--bg-muted)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Package size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.9rem' }}>{product.totalSold}</td>
                  <td style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.9rem' }}>${(product.totalSold * product.price).toFixed(2)}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <div style={{ width: '60px', height: '20px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={[{v: Math.random()*10}, {v: Math.random()*10}, {v: Math.random()*10}]}>
                           <Line type="monotone" dataKey="v" stroke={index % 3 === 0 ? "#ef4444" : "#10b981"} strokeWidth={2} dot={false} />
                         </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data.topProducts || data.topProducts.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sales By Category */}
        <div className="admin-card" style={{ flex: '1', minWidth: '0' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Sales by Category</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Revenue distribution across product types</p>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {data.salesByCategory && data.salesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByCategory} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} width={80} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                  <Bar dataKey="revenue" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No sales data available.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
