import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, Edit2 } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parentId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, parentId: formData.parentId || undefined };
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, payload);
      } else {
        await api.post('/products/categories', payload);
      }
      setFormData({ name: '', description: '', parentId: '' });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      alert('Failed to save category');
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || '', parentId: cat.parentId || '' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Category Management</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
        <h4 className="font-bold">{editingId ? 'Edit Category' : 'Add New Category'}</h4>
        <input type="text" placeholder="Name" className="form-input" style={{ width: '100%', padding: '0.5rem' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <textarea placeholder="Description" className="form-input" style={{ width: '100%', padding: '0.5rem' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <select className="form-input" style={{ width: '100%', padding: '0.5rem' }} value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})}>
          <option value="">No Parent (Top Level)</option>
          {categories.filter(c => c.id !== editingId).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Category</button>
          {editingId && (
            <button type="button" className="btn" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', parentId: '' }); }}>Cancel</button>
          )}
        </div>
      </form>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem' }}>{cat.name}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{cat.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEdit(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                  <Edit2 size={20} />
                </button>
                <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
