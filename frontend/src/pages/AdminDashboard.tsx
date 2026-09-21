import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SEO } from '../components/SEO';
import { Users, Package, HelpCircle, Trash2, FolderTree, ShoppingCart, RefreshCcw, UploadCloud, BarChart, Download, Tag } from 'lucide-react';

import { AdminCategories } from '../components/admin/AdminCategories';
import { AdminProducts } from '../components/admin/AdminProducts';
import { AdminOrders } from '../components/admin/AdminOrders';
import { AdminRefunds } from '../components/admin/AdminRefunds';
import { AdminSearch } from '../components/admin/AdminSearch';
import { AdminPagination } from '../components/admin/AdminPagination';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminReports } from '../components/admin/AdminReports';
import { AdminPromotions } from '../components/admin/AdminPromotions';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userDebouncedSearch, setUserDebouncedSearch] = useState('');

  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', order: 0 });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/orders/pending-count').then(res => setPendingOrdersCount(res.data.count)).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setUserDebouncedSearch(userSearch);
      setUserPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [userSearch]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userPage, userDebouncedSearch]);

  useEffect(() => {
    if (activeTab === 'faqs') {
      fetchFaqs();
    }
  }, [activeTab]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/faqs');
      setFaqs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/faqs', newFaq);
      setNewFaq({ question: '', answer: '', order: 0 });
      fetchFaqs();
    } catch (err) {
      alert('Failed to create FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      fetchFaqs();
    } catch (err) {
      alert('Failed to delete FAQ');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page: userPage, limit: 10, search: userDebouncedSearch }
      });
      setUsers(res.data.data);
      setUserTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(); // refresh
    } catch (err) {
      alert('Failed to update role');
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', paddingBottom: '2rem' }}>
      <div className="container py-12" style={{ display: 'flex', gap: '2rem' }}>
        <SEO title="Admin Dashboard | i-love-shopping" description="Admin management tools" />
      
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', padding: '0 1rem' }}>Admin Panel</h2>
        
        {/* Group 1: Analytics & Reports */}
        <div style={{ marginTop: '0.5rem', padding: '0 1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analytics & Reports</span>
        </div>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent', color: activeTab === 'dashboard' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <BarChart size={18} /> Dashboard Overview
        </button>

        <button 
          onClick={() => setActiveTab('reports')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'reports' ? 'var(--primary)' : 'transparent', color: activeTab === 'reports' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <BarChart size={18} /> Reports & Exports
        </button>

        {/* Group 2: Catalog Management */}
        <div style={{ marginTop: '1rem', padding: '0 1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catalog Management</span>
        </div>
        <button 
          onClick={() => setActiveTab('categories')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'categories' ? 'var(--primary)' : 'transparent', color: activeTab === 'categories' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <FolderTree size={18} /> Categories
        </button>

        <button 
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'products' ? 'var(--primary)' : 'transparent', color: activeTab === 'products' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <Package size={18} /> Products
        </button>

        <button 
          onClick={() => setActiveTab('bulk-upload')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'bulk-upload' ? 'var(--primary)' : 'transparent', color: activeTab === 'bulk-upload' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <UploadCloud size={18} /> Bulk Upload
        </button>

        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginTop: '1.5rem', marginBottom: '0.5rem', paddingLeft: '1rem' }}>Marketing</h3>
        <button 
          onClick={() => setActiveTab('promotions')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'promotions' ? 'var(--primary)' : 'transparent', color: activeTab === 'promotions' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <Tag size={18} /> Promotions
        </button>

        {/* Group 3: Sales & Orders */}
        <div style={{ marginTop: '1rem', padding: '0 1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales & Orders</span>
        </div>
        <button 
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: activeTab === 'orders' ? 'var(--primary)' : 'transparent', color: activeTab === 'orders' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} /> Orders
          </div>
          {pendingOrdersCount > 0 && (
            <span style={{ 
              background: '#ef4444', color: 'white', borderRadius: '9999px', 
              padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold' 
            }}>
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('refunds')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'refunds' ? 'var(--primary)' : 'transparent', color: activeTab === 'refunds' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <RefreshCcw size={18} /> Refunds
        </button>

        {/* Group 4: Administration */}
        <div style={{ marginTop: '1rem', padding: '0 1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administration</span>
        </div>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'users' ? 'var(--primary)' : 'transparent', color: activeTab === 'users' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <Users size={18} /> Manage Users
        </button>

        <button 
          onClick={() => setActiveTab('faqs')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'faqs' ? 'var(--primary)' : 'transparent', color: activeTab === 'faqs' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <HelpCircle size={18} /> Manage FAQs
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0 }}>User Management</h3>
              <AdminSearch search={userSearch} setSearch={setUserSearch} placeholder="Search users by email or name..." />
            </div>
            {loading ? <p>Loading...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Email</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Role</th>
                    <th style={{ padding: '1rem' }}>2FA</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>{u.firstName} {u.lastName}</td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="form-input"
                          style={{ padding: '0.25rem', width: 'auto' }}
                        >
                          <option value="customer">Customer</option>
                          <option value="support">Support</option>
                          <option value="sales">Sales</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.twoFactorEnabled ? <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Enabled</span> : <span style={{ color: 'var(--text-muted)' }}>Disabled</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {!loading && users.length > 0 && (
              <AdminPagination page={userPage} totalPages={userTotalPages} setPage={setUserPage} />
            )}
          </div>
        )}
        
        {activeTab === 'dashboard' && <AdminOverview />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'refunds' && <AdminRefunds />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'promotions' && <AdminPromotions />}

        {activeTab === 'bulk-upload' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={24} /> Bulk Upload Products (CSV)
            </h3>
            <p className="mb-4 text-muted">Upload a CSV file to add multiple products at once. Make sure to follow the template format.</p>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button 
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
                onClick={() => {
                  const headers = 'name,sku,description,price,cost,stockQuantity,categoryId,brand\n';
                  const sampleRow = 'Example Product,SKU-123,Detailed description here,19.99,10.00,50,replace-with-category-id,Example Brand\n';
                  const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('hidden', '');
                  a.setAttribute('href', url);
                  a.setAttribute('download', 'products_template.csv');
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download size={18} /> Download Sample Template
              </button>
            </div>

            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '3rem',
                textAlign: 'center',
                background: 'var(--bg-muted)',
                position: 'relative',
                cursor: 'pointer'
              }}
              className="hover-lift"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <UploadCloud size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Click or drag a CSV file to upload</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Max file size 5MB</p>
              
              <input 
                id="csv-upload"
                type="file" 
                accept=".csv"
                style={{ position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  try {
                    setLoading(true);
                    const res = await api.post('/admin/products/bulk', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    alert(res.data.message);
                    e.target.value = ''; // reset
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to upload CSV');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>FAQ Management</h3>
            
            <form onSubmit={handleCreateFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
              <h4 className="font-bold">Add New FAQ</h4>
              <input type="text" placeholder="Question" className="form-input" style={{ width: '100%', padding: '0.5rem' }} value={newFaq.question} onChange={e => setNewFaq({...newFaq, question: e.target.value})} required />
              <textarea placeholder="Answer" className="form-input" style={{ width: '100%', padding: '0.5rem' }} value={newFaq.answer} onChange={e => setNewFaq({...newFaq, answer: e.target.value})} required />
              <input type="number" placeholder="Order" className="form-input" style={{ width: '100%', padding: '0.5rem' }} value={newFaq.order} onChange={e => setNewFaq({...newFaq, order: parseInt(e.target.value) || 0})} />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Add FAQ</button>
            </form>

            {loading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {faqs.map(faq => (
                  <div key={faq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem' }}>{faq.question}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>{faq.answer}</p>
                    </div>
                    <button onClick={() => handleDeleteFaq(faq.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminDashboard;

