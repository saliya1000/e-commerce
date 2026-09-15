import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SEO } from '../components/SEO';
import { Users, Package } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
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
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'users' ? 'var(--primary)' : 'transparent', color: activeTab === 'users' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <Users size={18} /> Manage Users
        </button>

        <button 
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: activeTab === 'products' ? 'var(--primary)' : 'transparent', color: activeTab === 'products' ? 'white' : 'inherit', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}
        >
          <Package size={18} /> Bulk Products
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>User Management</h3>
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
          </div>
        )}
        
        {activeTab === 'products' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Bulk Upload Products</h3>
            <p className="mb-4">Upload a JSON array of products to add them to the database.</p>
            <textarea 
              id="bulk-json"
              className="form-input mb-4" 
              rows={10} 
              placeholder='[{"name": "Dog Toy", "description": "...", "price": 10.99, "stockQuantity": 100, "categoryId": "...", "brand": "PetCo"}]'
              style={{ fontFamily: 'monospace' }}
            ></textarea>
            <button 
              className="btn"
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
      </div>
    </div>
  );
};

export default AdminDashboard;
