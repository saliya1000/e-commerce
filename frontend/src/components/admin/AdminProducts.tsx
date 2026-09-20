import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, Edit2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
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

  const initialFormState = {
    name: '', description: '', price: 0, stockQuantity: 0, categoryId: '', brand: '',
    weightMetric: '', lengthMetric: '', widthMetric: '', heightMetric: '',
    attributes: [] as { name: string, value: string }[],
    images: [] as { url: string, isPrimary: boolean }[]
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, debouncedSearch]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products', {
        params: { page, limit: 10, search: debouncedSearch }
      });
      setProducts(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stockQuantity: Number(formData.stockQuantity),
        weightMetric: formData.weightMetric ? Number(formData.weightMetric) : undefined,
        lengthMetric: formData.lengthMetric ? Number(formData.lengthMetric) : undefined,
        widthMetric: formData.widthMetric ? Number(formData.widthMetric) : undefined,
        heightMetric: formData.heightMetric ? Number(formData.heightMetric) : undefined,
      };

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
      } else {
        await api.post('/admin/products', payload); // wait, createProduct is in /admin/products?
        // Wait, in admin.routes.ts, createProduct is missing?! Let me double check if it is in product.routes.ts or admin.routes.ts.
        // I will use /products for POST if it's there. Actually, let's just use POST /products since it's probably unprotected or protected by role.
        // Checking the code: product.routes.ts has `router.post('/', requireAuth, requireRole('admin'), ...createProduct)`
        await api.post('/products', payload);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchProducts();
    } catch (err) {
      alert('Failed to save product');
    }
  };

  const handleEdit = (prod: any) => {
    setEditingId(prod.id);
    setFormData({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      stockQuantity: prod.stockQuantity,
      categoryId: prod.categoryId,
      brand: prod.brand || '',
      weightMetric: prod.weightMetric || '',
      lengthMetric: prod.lengthMetric || '',
      widthMetric: prod.widthMetric || '',
      heightMetric: prod.heightMetric || '',
      attributes: prod.attributes || [],
      images: prod.images || []
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, { url: '', isPrimary: formData.images.length === 0 }] });
  };

  const updateImage = (index: number, url: string) => {
    const newImages = [...formData.images];
    newImages[index].url = url;
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    if (newImages.length > 0 && formData.images[index].isPrimary) {
      newImages[0].isPrimary = true;
    }
    setFormData({ ...formData, images: newImages });
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0 }}>Products</h3>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, margin: '0 2rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="Search products or categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setFormData(initialFormState); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
          <h4 className="font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input type="text" placeholder="Name" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="text" placeholder="Brand" className="form-input" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            <input type="number" step="0.01" placeholder="Price" className="form-input" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
            <input type="number" placeholder="Stock Quantity" className="form-input" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} required />
            
            <select className="form-input" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <textarea placeholder="Description" className="form-input" style={{ width: '100%' }} rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>

            <h5 style={{ gridColumn: '1 / -1', margin: '1rem 0 0' }}>Dimensions & Weight (Metric)</h5>
            <input type="number" step="0.01" placeholder="Weight (kg)" className="form-input" value={formData.weightMetric} onChange={e => setFormData({...formData, weightMetric: e.target.value})} />
            <input type="number" step="0.01" placeholder="Length (cm)" className="form-input" value={formData.lengthMetric} onChange={e => setFormData({...formData, lengthMetric: e.target.value})} />
            <input type="number" step="0.01" placeholder="Width (cm)" className="form-input" value={formData.widthMetric} onChange={e => setFormData({...formData, widthMetric: e.target.value})} />
            <input type="number" step="0.01" placeholder="Height (cm)" className="form-input" value={formData.heightMetric} onChange={e => setFormData({...formData, heightMetric: e.target.value})} />

            <div style={{ gridColumn: '1 / -1' }}>
              <h5 style={{ margin: '1rem 0 0.5rem' }}>Images</h5>
              {formData.images.map((img, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="url" placeholder="Image URL" className="form-input" style={{ flex: 1 }} value={img.url} onChange={e => updateImage(i, e.target.value)} required />
                  <button type="button" onClick={() => removeImage(i)} className="btn btn-secondary">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addImage} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>Add Image URL</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Add'} Product</button>
            <button type="button" className="btn" onClick={() => setIsFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Product</th>
              <th style={{ padding: '1rem' }}>Price</th>
              <th style={{ padding: '1rem' }}>Stock</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {prod.images?.[0] && <img src={prod.images[0].url} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <div>
                      <strong>{prod.name}</strong>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{prod.brand}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>${Number(prod.price).toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{prod.stockQuantity}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(prod)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                    <button onClick={() => handleDelete(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}><Trash2 size={20} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
          <button 
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          
          <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>
            Page {page} of {Math.max(1, totalPages)}
          </span>
          
          <button 
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (page >= totalPages || totalPages === 0) ? 0.5 : 1, cursor: (page >= totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
        </>
      )}
    </div>
  );
};
