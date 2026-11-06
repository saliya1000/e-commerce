import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, Edit2, Plus, Package, Star } from 'lucide-react';
import { AdminSearch } from './AdminSearch';
import { AdminPagination } from './AdminPagination';
import { getImageUrl } from '../../utils/image';

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
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');

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
    isEnabled: true,
    isFeatured: false,
    attributes: [] as { name: string, value: string }[],
    images: [] as { url: string, thumbnailUrl?: string, mediumUrl?: string, isPrimary: boolean }[]
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, debouncedSearch, featuredFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10, search: debouncedSearch };
      if (featuredFilter === 'featured') params.isFeatured = 'true';
      if (featuredFilter === 'standard') params.isFeatured = 'false';

      const res = await api.get('/admin/products', { params });
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
        isEnabled: formData.isEnabled !== false,
        isFeatured: Boolean(formData.isFeatured),
        weightMetric: formData.weightMetric ? Number(formData.weightMetric) : undefined,
        lengthMetric: formData.lengthMetric ? Number(formData.lengthMetric) : undefined,
        widthMetric: formData.widthMetric ? Number(formData.widthMetric) : undefined,
        heightMetric: formData.heightMetric ? Number(formData.heightMetric) : undefined,
      };

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Failed to save product';
      alert(msg);
    }
  };

  const handleEdit = (prod: any) => {
    setEditingId(prod.id);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      description: prod.description || '',
      price: prod.price !== undefined && prod.price !== null ? Number(prod.price) : 0,
      cost: prod.cost !== undefined && prod.cost !== null ? Number(prod.cost) : 0,
      stockQuantity: prod.stockQuantity !== undefined && prod.stockQuantity !== null ? Number(prod.stockQuantity) : 0,
      categoryId: prod.categoryId || '',
      brand: prod.brand || '',
      weightMetric: prod.weightMetric !== null && prod.weightMetric !== undefined ? String(prod.weightMetric) : '',
      lengthMetric: prod.lengthMetric !== null && prod.lengthMetric !== undefined ? String(prod.lengthMetric) : '',
      widthMetric: prod.widthMetric !== null && prod.widthMetric !== undefined ? String(prod.widthMetric) : '',
      heightMetric: prod.heightMetric !== null && prod.heightMetric !== undefined ? String(prod.heightMetric) : '',
      isEnabled: prod.isEnabled !== false,
      isFeatured: Boolean(prod.isFeatured),
      attributes: prod.attributes || [],
      images: prod.images || []
    });
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isEnabled: nextStatus } : p));
      await api.patch(`/admin/products/${id}/quick`, { isEnabled: nextStatus });
    } catch (err) {
      console.error('Failed to toggle product status', err);
      fetchProducts();
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    const nextFeatured = !currentFeatured;
    try {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isFeatured: nextFeatured } : p));
      await api.patch(`/admin/products/${id}/quick`, { isFeatured: nextFeatured });
    } catch (err) {
      console.error('Failed to toggle featured status', err);
      fetchProducts();
    }
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
        url: getImageUrl(res.data.url),
        thumbnailUrl: getImageUrl(res.data.thumbnailUrl),
        mediumUrl: getImageUrl(res.data.mediumUrl),
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
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <AdminSearch search={search} setSearch={setSearch} placeholder="Search products..." />
          <select 
            className="form-input"
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value as any);
              setPage(1);
            }}
            style={{ 
              width: 'auto', 
              minWidth: '150px', 
              padding: '0.45rem 0.75rem', 
              cursor: 'pointer',
              fontWeight: 500
            }}
            title="Filter by featured status"
          >
            <option value="all">All Products</option>
            <option value="featured">⭐ Featured Only</option>
            <option value="standard">Standard Products</option>
          </select>
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
                <select 
                  className="form-input" 
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                  required
                >
                  <option value="">Select Category</option>
                  {/* Top-Level Categories with their subcategories grouped */}
                  {categories.filter(c => !c.parentId).map(parent => {
                    const subs = categories.filter(sub => sub.parentId === parent.id);
                    return (
                      <optgroup key={parent.id} label={`📁 ${parent.name} (Parent Category)`}>
                        <option value={parent.id}>
                          {parent.name} (Parent Category)
                        </option>
                        {subs.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            &nbsp;&nbsp;&nbsp;&nbsp;↳ {parent.name} &gt; {sub.name} (Subcategory)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  {/* Any orphaned subcategories whose parent is not in the list */}
                  {categories.filter(c => c.parentId && !categories.some(p => p.id === c.parentId)).map(orphan => (
                    <option key={orphan.id} value={orphan.id}>
                      ↳ {orphan.name} (Subcategory)
                    </option>
                  ))}
                </select>

                {/* Selected Category Visual Path */}
                {(() => {
                  const selectedCat = categories.find(c => c.id === formData.categoryId);
                  if (!selectedCat) return null;
                  const parentCat = selectedCat.parent || categories.find(c => c.id === selectedCat.parentId);
                  return (
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned as:</span>
                      {parentCat ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          <span>{parentCat.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
                          <strong>{selectedCat.name}</strong>
                          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Subcategory)</span>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          📁 <strong>{selectedCat.name}</strong>
                          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Parent Category)</span>
                        </span>
                      )}
                    </div>
                  );
                })()}
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
              {formData.images.map((img, i) => {
                const previewSrc = getImageUrl(img.thumbnailUrl || img.url);
                return (
                  <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-muted)' }}>
                    {previewSrc ? (
                      <img 
                        src={previewSrc} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No Img</span>
                    )}
                    
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', color: 'var(--error)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <Trash2 size={14} />
                    </button>
                    {img.isPrimary && <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', textAlign: 'center', padding: '2px 0' }}>Primary</span>}
                  </div>
                );
              })}
              
              {formData.images.length < 5 && (
                <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-main)' }} className="hover-lift">
                  <Plus size={24} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }} />
                </div>
              )}
            </div>
          </div>

          {/* Visibility & Featured Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Status / Visibility */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1.25rem', background: 'var(--bg-muted)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <input 
                type="checkbox"
                id="product-is-enabled"
                checked={formData.isEnabled}
                onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)', marginTop: '2px' }}
              />
              <label htmlFor="product-is-enabled" style={{ cursor: 'pointer', userSelect: 'none' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: formData.isEnabled ? '#15803d' : '#b91c1c' }}>
                  {formData.isEnabled ? '✅ Enabled (Visible in Store)' : '⚠️ Disabled (Hidden from Store)'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formData.isEnabled 
                    ? 'Customers can browse, search, and purchase this product on the frontend.' 
                    : 'This product will immediately disappear from frontend customer search results and store catalog.'}
                </span>
              </label>
            </div>

            {/* Featured Showcase */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem', 
              padding: '0.85rem 1.25rem', 
              background: formData.isFeatured ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-muted)', 
              borderRadius: '10px', 
              border: `1px solid ${formData.isFeatured ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease'
            }}>
              <input 
                type="checkbox"
                id="product-is-featured"
                checked={formData.isFeatured}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b', marginTop: '2px' }}
              />
              <label htmlFor="product-is-featured" style={{ cursor: 'pointer', userSelect: 'none' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', color: formData.isFeatured ? '#d97706' : 'var(--text-main)' }}>
                  <Star size={16} style={{ fill: formData.isFeatured ? '#f59e0b' : 'none', color: formData.isFeatured ? '#f59e0b' : 'var(--text-muted)' }} />
                  {formData.isFeatured ? '⭐ Featured on Homepage' : 'Standard Product'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formData.isFeatured 
                    ? 'Featured in the Featured Products section on the customer homepage.' 
                    : 'Not featured on the homepage (standard store product).'}
                </span>
              </label>
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
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Featured</th>
                <th style={{ padding: '1rem' }}>SKU</th>
                <th style={{ padding: '1rem' }}>Price ($)</th>
                <th style={{ padding: '1rem' }}>Stock</th>
              </tr>
            ) : (
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Product</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Featured</th>
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
                    {!isQuickEdit && (() => {
                      const primaryImg = prod.images?.find((img: any) => img.isPrimary) || prod.images?.[0];
                      const imgSrc = primaryImg ? getImageUrl(primaryImg.thumbnailUrl || primaryImg.url) : null;
                      return imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={prod.name} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                          }}
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="var(--text-muted)" />
                        </div>
                      );
                    })()}
                    <div>
                      <strong style={{ opacity: prod.isEnabled === false ? 0.65 : 1 }}>{prod.name}</strong>
                      {prod.isEnabled === false && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '3px', background: '#fee2e2', color: '#b91c1c', fontWeight: 600, marginLeft: '0.4rem' }}>
                          Hidden
                        </span>
                      )}
                      {prod.isFeatured && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontWeight: 600, marginLeft: '0.4rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          ★ Featured
                        </span>
                      )}
                      {!isQuickEdit && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                          {prod.brand && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prod.brand}</span>}
                          {prod.category && (
                            <span style={{ 
                              fontSize: '0.72rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              background: prod.category.parent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                              color: prod.category.parent ? '#059669' : '#2563EB',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {prod.category.parent ? (
                                <>
                                  <span style={{ opacity: 0.75 }}>{prod.category.parent.name} &gt;</span>
                                  <span>{prod.category.name}</span>
                                </>
                              ) : (
                                <>📁 {prod.category.name}</>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status Column */}
                <td style={{ padding: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(prod.id, prod.isEnabled !== false)}
                    className="hover-lift"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: `1px solid ${prod.isEnabled !== false ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
                      cursor: 'pointer',
                      background: prod.isEnabled !== false ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                      color: prod.isEnabled !== false ? '#15803d' : '#b91c1c',
                      transition: 'all 0.15s ease'
                    }}
                    title={prod.isEnabled !== false ? 'Click to Disable (Hide from frontend)' : 'Click to Enable (Show in frontend)'}
                  >
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: prod.isEnabled !== false ? '#22c55e' : '#ef4444',
                      display: 'inline-block'
                    }} />
                    {prod.isEnabled !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </td>

                {/* Featured Column */}
                <td style={{ padding: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(prod.id, Boolean(prod.isFeatured))}
                    className="hover-lift"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: `1px solid ${prod.isFeatured ? 'rgba(245, 158, 11, 0.45)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      background: prod.isFeatured ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-muted)',
                      color: prod.isFeatured ? '#d97706' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                    title={prod.isFeatured ? 'Click to unfeature this product' : 'Click to feature this product on homepage'}
                  >
                    <Star
                      size={13}
                      style={{
                        fill: prod.isFeatured ? '#f59e0b' : 'none',
                        color: prod.isFeatured ? '#f59e0b' : 'var(--text-muted)'
                      }}
                    />
                    {prod.isFeatured ? 'Featured' : 'Standard'}
                  </button>
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
