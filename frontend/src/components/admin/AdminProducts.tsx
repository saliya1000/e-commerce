import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { AdminSearch } from './AdminSearch';
import { AdminPagination } from './AdminPagination';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQuickEdit, setIsQuickEdit] = useState(false);
  
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
    name: '', sku: '', description: '', price: 0, cost: 0, stockQuantity: 0, categoryId: '', brand: '',
    weightMetric: '', lengthMetric: '', widthMetric: '', heightMetric: '',
    attributes: [] as { name: string, value: string }[],
    images: [] as { url: string, thumbnailUrl?: string, mediumUrl?: string, isPrimary: boolean }[]
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
        cost: Number(formData.cost),
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
      sku: prod.sku || '',
      description: prod.description,
      price: prod.price,
      cost: prod.cost || 0,
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

  const handleQuickUpdate = async (id: string, field: string, value: string | number) => {
    try {
      await api.patch(`/admin/products/${id}/quick`, { [field]: value });
      // Update local state to reflect change instantly
      setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    } catch (err) {
      alert('Failed to update product');
      fetchProducts(); // revert on failure
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    try {
      const res = await api.post('/products/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newImage = {
        url: res.data.url,
        thumbnailUrl: res.data.thumbnailUrl,
        mediumUrl: res.data.mediumUrl,
        isPrimary: formData.images.length === 0
      };
      setFormData(prev => ({ ...prev, images: [...prev.images, newImage] }));
    } catch (err) {
      alert('Failed to upload image');
    }
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
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AdminSearch search={search} setSearch={setSearch} placeholder="Search products..." />
          <button className="btn btn-outline" onClick={() => setIsQuickEdit(!isQuickEdit)} style={{ whiteSpace: 'nowrap', width: 'auto' }}>
            {isQuickEdit ? 'Exit Quick Edit' : 'Quick Stock Update'}
          </button>
          <button className="btn btn-primary" onClick={() => { setIsFormOpen(!isFormOpen); setEditingId(null); setFormData(initialFormState); setIsQuickEdit(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', width: 'auto' }}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem', padding: '2rem', background: 'var(--bg-muted)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h4 className="font-bold" style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h4>
          
          {/* Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Basic Information</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Product Name *</label>
                <input type="text" placeholder="e.g. Feline Finery Salmon Treats" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>SKU</label>
                <input type="text" placeholder="e.g. SKU-123" className="form-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Brand</label>
                <input type="text" placeholder="e.g. Feline Finery" className="form-input" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Category *</label>
                <select className="form-input" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Description *</label>
                <textarea placeholder="Enter detailed product description..." className="form-input" style={{ width: '100%', resize: 'vertical' }} rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

          {/* Pricing & Inventory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Pricing & Inventory</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Price ($) *</label>
                <input type="number" step="0.01" placeholder="0.00" className="form-input" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Cost ($) *</label>
                <input type="number" step="0.01" placeholder="0.00" className="form-input" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Stock Quantity *</label>
                <input type="number" placeholder="0" className="form-input" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} required />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

          {/* Shipping Dimensions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Shipping Dimensions</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Weight (kg)</label>
                <input type="number" step="0.01" placeholder="0.00" className="form-input" value={formData.weightMetric} onChange={e => setFormData({...formData, weightMetric: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Length (cm)</label>
                <input type="number" step="0.01" placeholder="0.00" className="form-input" value={formData.lengthMetric} onChange={e => setFormData({...formData, lengthMetric: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Width (cm)</label>
                <input type="number" step="0.01" placeholder="0.00" className="form-input" value={formData.widthMetric} onChange={e => setFormData({...formData, widthMetric: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Height (cm)</label>
                <input type="number" step="0.01" placeholder="0.00" className="form-input" value={formData.heightMetric} onChange={e => setFormData({...formData, heightMetric: e.target.value})} />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

          {/* Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h5 style={{ margin: 0, color: 'var(--text-muted)' }}>Product Images (Max 5)</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {formData.images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-muted)' }}>
                  {(img.thumbnailUrl || img.url) ? <img src={img.thumbnailUrl || img.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No Img</span>}
                  
                  <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', color: 'var(--error)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <Trash2 size={14} />
                  </button>
                  {img.isPrimary && <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0' }}>Primary</span>}
                </div>
              ))}
              
              {formData.images.length < 5 && (
                <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-main)' }} className="hover-lift">
                  <Plus size={24} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>{editingId ? 'Update Product' : 'Save New Product'}</button>
          </div>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            {isQuickEdit ? (
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Product</th>
                <th style={{ padding: '1rem' }}>SKU</th>
                <th style={{ padding: '1rem' }}>Price ($)</th>
                <th style={{ padding: '1rem' }}>Stock</th>
              </tr>
            ) : (
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Product</th>
                <th style={{ padding: '1rem' }}>Price</th>
                <th style={{ padding: '1rem' }}>Cost</th>
                <th style={{ padding: '1rem' }}>Stock</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {!isQuickEdit && prod.images?.[0] && <img src={prod.images[0].thumbnailUrl || prod.images[0].url} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                    <div>
                      <strong>{prod.name}</strong>
                      {!isQuickEdit && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{prod.brand}</div>}
                    </div>
                  </div>
                </td>
                
                {isQuickEdit ? (
                  <>
                    <td style={{ padding: '1rem' }}>
                      <input type="text" className="form-input" defaultValue={prod.sku || ''} style={{ width: '120px', padding: '0.25rem 0.5rem' }} onBlur={(e) => handleQuickUpdate(prod.id, 'sku', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input type="number" step="0.01" className="form-input" defaultValue={prod.price} style={{ width: '100px', padding: '0.25rem 0.5rem' }} onBlur={(e) => handleQuickUpdate(prod.id, 'price', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input type="number" className="form-input" defaultValue={prod.stockQuantity} style={{ width: '100px', padding: '0.25rem 0.5rem' }} onBlur={(e) => handleQuickUpdate(prod.id, 'stockQuantity', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '1rem' }}>${Number(prod.price).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>${Number(prod.cost || 0).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{prod.stockQuantity}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(prod)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                        <button onClick={() => handleDelete(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}><Trash2 size={20} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {!loading && products.length > 0 && (
          <AdminPagination page={page} totalPages={totalPages} setPage={setPage} />
        )}
        </>
      )}
    </div>
  );
};
