import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Truck, Plus, Edit2, Trash2, Clock, Search } from 'lucide-react';

interface DeliveryOption {
  id: string;
  name: string;
  description?: string | null;
  cost: number | string;
  estimatedDays: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const AdminDeliveryOptions: React.FC = () => {
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFormState = {
    name: '',
    description: '',
    cost: '5.00',
    estimatedDays: '3',
    active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchDeliveryOptions();
  }, []);

  const fetchDeliveryOptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/delivery-options');
      setOptions(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('Failed to fetch delivery options', err);
      setError('Could not load delivery options');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (opt: DeliveryOption) => {
    setEditingId(opt.id);
    setFormData({
      name: opt.name,
      description: opt.description || '',
      cost: String(opt.cost),
      estimatedDays: String(opt.estimatedDays || 1),
      active: opt.active !== false,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    const nextStatus = !currentActive;
    // Optimistic UI update
    setOptions(prev => prev.map(o => (o.id === id ? { ...o, active: nextStatus } : o)));

    try {
      await api.put(`/admin/delivery-options/${id}`, { active: nextStatus });
    } catch (err: any) {
      console.error('Failed to toggle delivery option status', err);
      alert('Failed to update status. Please try again.');
      fetchDeliveryOptions();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/delivery-options/${id}`);
      setOptions(prev => prev.filter(o => o.id !== id));
    } catch (err: any) {
      console.error('Failed to delete delivery option', err);
      alert('Failed to delete delivery option');
      fetchDeliveryOptions();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const costNum = parseFloat(formData.cost);
    if (isNaN(costNum) || costNum < 0) {
      setError('Please provide a valid price (>= 0)');
      setSubmitting(false);
      return;
    }

    const daysNum = parseInt(formData.estimatedDays, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      setError('Please provide a valid estimated delivery duration (at least 1 day)');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      cost: costNum,
      estimatedDays: daysNum,
      active: formData.active,
    };

    try {
      if (editingId) {
        await api.put(`/admin/delivery-options/${editingId}`, payload);
      } else {
        await api.post('/admin/delivery-options', payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      fetchDeliveryOptions();
    } catch (err: any) {
      console.error('Failed to save delivery option', err);
      setError(err.response?.data?.error || 'Failed to save delivery option');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.name.toLowerCase().includes(term) ||
      (opt.description && opt.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(32, 178, 170, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#20B2AA' }}>
              <Truck size={22} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Delivery & Shipping Options</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            Configure shipping methods, rates, delivery timelines, and toggle availability for customer checkout.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '10px' }}
        >
          <Plus size={18} />
          Add Delivery Option
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search delivery options..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: '10px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Total Options: <strong style={{ color: 'var(--text-main)' }}>{options.length}</strong></span>
          <span>•</span>
          <span>Enabled: <strong style={{ color: '#15803d' }}>{options.filter(o => o.active !== false).length}</strong></span>
          <span>•</span>
          <span>Disabled: <strong style={{ color: '#b91c1c' }}>{options.filter(o => o.active === false).length}</strong></span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading delivery options...</p>
        </div>
      ) : filteredOptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-muted, #f8fafc)', borderRadius: '16px', border: '1px dashed var(--border-color, #e2e8f0)' }}>
          <Truck size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No delivery options found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
            {searchTerm ? 'No options matched your search query.' : 'Get started by creating your first shipping method for customers.'}
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} style={{ marginRight: '6px' }} /> Create Delivery Option
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted, #f8fafc)', borderBottom: '2px solid var(--border-color, #e2e8f0)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Option Name & Details</th>
                <th style={{ padding: '1rem 1.25rem' }}>Estimated Delivery</th>
                <th style={{ padding: '1rem 1.25rem' }}>Price / Fee</th>
                <th style={{ padding: '1rem 1.25rem' }}>Store Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOptions.map(opt => {
                const costNum = Number(opt.cost);
                const isEnabled = opt.active !== false;

                return (
                  <tr
                    key={opt.id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #e2e8f0)',
                      transition: 'background 0.15s',
                      background: isEnabled ? 'transparent' : 'rgba(239, 68, 68, 0.02)',
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          background: isEnabled ? 'rgba(32, 178, 170, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isEnabled ? '#20B2AA' : '#94a3b8'
                        }}>
                          <Truck size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '1rem', color: isEnabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {opt.name}
                            </strong>
                            {!isEnabled && (
                              <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
                                Hidden in Checkout
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-main)', background: 'var(--bg-muted, #f1f5f9)', padding: '4px 10px', borderRadius: '6px' }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{opt.estimatedDays} business day{opt.estimatedDays > 1 ? 's' : ''}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: costNum === 0 ? '#15803d' : 'var(--text-main)' }}>
                        {costNum === 0 ? 'FREE' : `$${costNum.toFixed(2)}`}
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(opt.id, isEnabled)}
                        title={isEnabled ? 'Click to Disable (Hide from Checkout)' : 'Click to Enable (Show in Checkout)'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: `1px solid ${isEnabled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
                          background: isEnabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                          color: isEnabled ? '#15803d' : '#b91c1c',
                        }}
                      >
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isEnabled ? '#22c55e' : '#ef4444',
                        }} />
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleOpenEditModal(opt)}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(opt.id, opt.name)}
                          style={{
                            padding: '6px 10px',
                            background: 'none',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete Delivery Option"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            background: 'white',
            width: '100%',
            maxWidth: '520px',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: '#20B2AA' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  {editingId ? 'Edit Delivery Option' : 'Add New Delivery Option'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Option Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Shipping, Express Delivery, Store Pickup"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Price / Fee ($) <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={e => setFormData({ ...formData, cost: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', paddingLeft: '1.8rem', borderRadius: '8px' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Set 0 for Free Delivery
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Estimated Days <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="3"
                      value={formData.estimatedDays}
                      onChange={e => setFormData({ ...formData, estimatedDays: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Timeline in business days
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Description / Subtitle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivered safely to your door within 3-5 days"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              {/* Active Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: formData.active ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: `1px solid ${formData.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <input
                  type="checkbox"
                  id="deliveryOptionActive"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#20B2AA', cursor: 'pointer' }}
                />
                <label htmlFor="deliveryOptionActive" style={{ cursor: 'pointer', margin: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: formData.active ? '#15803d' : '#b91c1c' }}>
                    {formData.active ? '✅ Enabled (Visible at Checkout)' : '⚠️ Disabled (Hidden from Checkout)'}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formData.active
                      ? 'Customers can select this shipping option when placing an order.'
                      : 'This option will not be selectable or visible to customers.'}
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '120px' }}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Option' : 'Create Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
