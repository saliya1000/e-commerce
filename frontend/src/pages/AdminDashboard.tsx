import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SEO } from '../components/SEO';
import { Users, Package, HelpCircle, Trash2, FolderTree, ShoppingCart, RefreshCcw, UploadCloud, BarChart } from 'lucide-react';

import { AdminCategories } from '../components/admin/AdminCategories';
import { AdminProducts } from '../components/admin/AdminProducts';
import { AdminOrders } from '../components/admin/AdminOrders';
import { AdminRefunds } from '../components/admin/AdminRefunds';
import { AdminSearch } from '../components/admin/AdminSearch';
import { AdminPagination } from '../components/admin/AdminPagination';
import { AdminReports } from '../components/admin/AdminReports';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
  const [users, setUsers] = useState<any[]>([]);
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
    <div className="container py-12" style={{ display: 'flex', gap: '2rem' }}>
      <SEO title="Admin Dashboard | i-love-shopping" description="Admin management tools" />
      
      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '250px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', padding: '0 1rem' }}>Admin Panel</h2>
        
        <button 
          onClick={() => setActiveTab('reports')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'reports' ? 'var(--primary)' : 'transparent', color: activeTab === 'reports' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <BarChart size={18} /> Dashboard Overview
        </button>

        <button 
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'users' ? 'var(--primary)' : 'transparent', color: activeTab === 'users' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <Users size={18} /> Manage Users
        </button>

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
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'orders' ? 'var(--primary)' : 'transparent', color: activeTab === 'orders' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <ShoppingCart size={18} /> Orders
        </button>

        <button 
          onClick={() => setActiveTab('refunds')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'refunds' ? 'var(--primary)' : 'transparent', color: activeTab === 'refunds' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <RefreshCcw size={18} /> Refunds
        </button>

        <button 
          onClick={() => setActiveTab('bulk-upload')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'bulk-upload' ? 'var(--primary)' : 'transparent', color: activeTab === 'bulk-upload' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <UploadCloud size={18} /> Bulk Upload
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
        
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'refunds' && <AdminRefunds />}
        {activeTab === 'reports' && <AdminReports />}

        {activeTab === 'bulk-upload' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Bulk Upload Products</h3>
            <p className="mb-4">Upload a JSON array of products to add them to the database.</p>
            <textarea 
              id="bulk-json"
              className="form-input mb-4" 
              rows={10} 
              placeholder='[{"name": "Dog Toy", "description": "...", "price": 10.99, "stockQuantity": 100, "categoryId": "...", "brand": "PetCo"}]'
              style={{ fontFamily: 'monospace', width: '100%' }}
            ></textarea>
            <button 
              className="btn btn-primary"
              onClick={async () => {
                try {
                  const val = (document.getElementById('bulk-json') as HTMLTextAreaElement).value;
                  const data = JSON.parse(val);
                  const res = await api.post('/admin/products/bulk', { products: data });
                  alert(res.data.message);
                } catch (e) {
                  alert('Invalid JSON or request failed');
                }
              }}
            >Upload JSON</button>
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
  );
};

export default AdminDashboard;

