import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Trash2, Edit2, FolderTree, Folder, Plus, CornerDownRight, Search } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parentId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      alert('Failed to save category');
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, description: cat.description || '', parentId: cat.parentId || '' });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSubcategory = (parentCat: any) => {
    setEditingId(null);
    setFormData({ name: '', description: '', parentId: parentCat.id });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Any associated products may lose their category link.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  // Group categories into parent and children
  const topLevelCategories = categories.filter(c => !c.parentId);
  const totalSubcategories = categories.filter(c => !!c.parentId).length;

  // Filter for search
  const filteredTopLevel = topLevelCategories.filter(parent => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const parentMatches = parent.name.toLowerCase().includes(term) || (parent.description && parent.description.toLowerCase().includes(term));
    const childrenMatch = categories.some(c => c.parentId === parent.id && (c.name.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term))));
    return parentMatches || childrenMatch;
  });

  // Orphaned subcategories (if parent was deleted or not found)
  const orphanSubcategories = categories.filter(c => c.parentId && !categories.some(p => p.id === c.parentId));

  const selectedParentCategory = categories.find(c => c.id === formData.parentId);

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderTree size={24} style={{ color: 'var(--primary)' }} />
            Category Management
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {topLevelCategories.length} Parent Categories • {totalSubcategories} Subcategories
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search categories..." 
              className="form-input" 
              style={{ width: '100%', paddingLeft: '2rem', height: '38px', fontSize: '0.85rem' }} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', whiteSpace: 'nowrap' }}
            onClick={() => {
              if (isFormOpen && !editingId) {
                setIsFormOpen(false);
              } else {
                setEditingId(null);
                setFormData({ name: '', description: '', parentId: '' });
                setIsFormOpen(true);
              }
            }}
          >
            <Plus size={18} />
            {isFormOpen && !editingId ? 'Close Form' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Category Creation / Edit Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-muted)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="font-bold" style={{ margin: 0, fontSize: '1.15rem' }}>
              {editingId ? 'Edit Category' : (formData.parentId ? `Add Subcategory under "${selectedParentCategory?.name}"` : 'Add New Category')}
            </h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Required fields</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Category Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Dry Food, Chew Toys..." 
                className="form-input" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Parent Category</label>
              <select 
                className="form-input" 
                value={formData.parentId} 
                onChange={e => setFormData({...formData, parentId: e.target.value})}
              >
                <option value="">None (Top-Level Parent Category)</option>
                {topLevelCategories.filter(c => c.id !== editingId).map(c => (
                  <option key={c.id} value={c.id}>📁 {c.name} (Top-Level Parent)</option>
                ))}
              </select>

              {/* Dynamic feedback indicator */}
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
                {formData.parentId ? (
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CornerDownRight size={14} /> Will be created as a <strong>Subcategory</strong> of <em>{selectedParentCategory?.name}</em>
                  </span>
                ) : (
                  <span style={{ color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <Folder size={14} /> Will be created as a <strong>Top-Level Parent Category</strong>
                  </span>
                )}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
              <textarea 
                placeholder="Short description for this category..." 
                className="form-input" 
                rows={2} 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ width: 'auto' }} 
              onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData({ name: '', description: '', parentId: '' }); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              {editingId ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      )}

      {/* Category List */}
      {loading ? <p>Loading categories...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredTopLevel.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <FolderTree size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No categories found matching "{searchTerm}"</p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try clearing the search or add a new category.</p>
            </div>
          )}

          {filteredTopLevel.map(parentCat => {
            const subcategories = categories.filter(c => c.parentId === parentCat.id);
            const parentProductCount = parentCat._count?.products || 0;

            return (
              <div 
                key={parentCat.id} 
                style={{ 
                  background: 'var(--bg-card, #ffffff)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                {/* Parent Category Card Header */}
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1.25rem 1.5rem', 
                    background: 'var(--bg-muted)',
                    borderBottom: subcategories.length > 0 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Folder size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{parentCat.name}</h4>
                        <span style={{ background: '#2563EB', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          Parent Category
                        </span>
                        <span style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {subcategories.length} {subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          • {parentProductCount} products directly linked
                        </span>
                      </div>
                      {parentCat.description && (
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{parentCat.description}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleAddSubcategory(parentCat)} 
                      className="btn btn-outline" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'auto' }}
                      title="Add a subcategory directly under this parent"
                    >
                      <Plus size={14} /> Add Subcategory
                    </button>
                    <button 
                      onClick={() => handleEdit(parentCat)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '6px' }}
                      title="Edit Category"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(parentCat.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error, #EF4444)', padding: '6px' }}
                      title="Delete Category"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Nested Under Parent */}
                {subcategories.length > 0 && (
                  <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      Subcategories under "{parentCat.name}":
                    </div>

                    {subcategories.map(subCat => {
                      const subProductCount = subCat._count?.products || 0;

                      return (
                        <div 
                          key={subCat.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '0.75rem 1rem', 
                            background: 'var(--bg-main)', 
                            borderRadius: '8px', 
                            borderLeft: '4px solid #10B981',
                            border: '1px solid var(--border-color)',
                            borderLeftWidth: '4px',
                            marginLeft: '1rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CornerDownRight size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.95rem' }}>{subCat.name}</strong>
                                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  ↳ Subcategory of {parentCat.name}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  • {subProductCount} products
                                </span>
                              </div>
                              {subCat.description && (
                                <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{subCat.description}</p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEdit(subCat)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                              title="Edit Subcategory"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(subCat.id)} 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error, #EF4444)', padding: '4px' }}
                              title="Delete Subcategory"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Orphaned subcategories (if any exist) */}
          {orphanSubcategories.length > 0 && (
            <div style={{ marginTop: '1rem', border: '1px dashed var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
              <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Other Subcategories (Unassigned Parent)</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {orphanSubcategories.map(orphan => (
                  <div key={orphan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong>{orphan.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Parent ID: {orphan.parentId})</span>
                      </div>
                      {orphan.description && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{orphan.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEdit(orphan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(orphan.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
