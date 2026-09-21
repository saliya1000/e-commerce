import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminSearch } from './AdminSearch';
import { AdminPagination } from './AdminPagination';
import { Eye, X, Package, MapPin } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [page, debouncedSearch, paymentStatusFilter, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders', {
        params: { 
          page, 
          limit: 10, 
          search: debouncedSearch, 
          paymentStatus: paymentStatusFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter 
        }
      });
      setOrders(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, field: 'status' | 'paymentStatus', value: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { [field]: value });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, [field]: value });
      }
    } catch (err) {
      alert(`Failed to update ${field}`);
    }
  };

  const handleRefund = async (orderId: string, amount: number) => {
    const reason = window.prompt('Enter refund reason:');
    if (reason === null) return;
    try {
      await api.post(`/admin/orders/${orderId}/refund`, { amount, reason });
      alert('Refund initiated successfully');
      fetchOrders();
    } catch (err) {
      alert('Failed to initiate refund');
    }
  };

  const renderAddress = (addrInput: any) => {
    try {
      const addr = typeof addrInput === 'string' ? JSON.parse(addrInput) : addrInput;
      if (!addr || typeof addr !== 'object') {
        return <p>{String(addrInput)}</p>;
      }
      return (
        <div>
          <p style={{ margin: 0 }}><strong>{addr.firstName} {addr.lastName}</strong></p>
          <p style={{ margin: 0 }}>{addr.address1} {addr.address2}</p>
          <p style={{ margin: 0 }}>{addr.city}, {addr.state} {addr.zipCode}</p>
          <p style={{ margin: 0 }}>{addr.country}</p>
          {addr.phone && <p style={{ margin: 0, marginTop: '0.25rem' }}>Phone: {addr.phone}</p>}
        </div>
      );
    } catch (e) {
      return <p style={{ wordBreak: 'break-all' }}>{typeof addrInput === 'object' ? JSON.stringify(addrInput) : String(addrInput)}</p>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0 }}>Order Management</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
            className="form-input"
            style={{ padding: '0.5rem', minWidth: '150px' }}
          >
            <option value="">All Payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <AdminSearch search={search} setSearch={setSearch} placeholder="Search orders by ID or email..." />
        </div>
      </div>
      
      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === status ? 'var(--primary)' : 'transparent',
              color: statusFilter === status ? 'white' : 'var(--text-main)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: statusFilter === status ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>Customer</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Payment</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ 
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: order.paymentStatus === 'FAILED' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
              }}>
                <td style={{ padding: '1rem' }}>{order.id.slice(0, 8)}...</td>
                <td style={{ padding: '1rem' }}>{order.user?.email || 'Guest'}</td>
                <td style={{ padding: '1rem' }}>${Number(order.totalAmount).toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    backgroundColor: order.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 
                                     order.paymentStatus === 'FAILED' ? 'rgba(239, 68, 68, 0.2)' : 
                                     order.paymentStatus === 'REFUNDED' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: order.paymentStatus === 'PAID' ? '#10b981' : 
                           order.paymentStatus === 'FAILED' ? '#ef4444' : 
                           order.paymentStatus === 'REFUNDED' ? '#f59e0b' : '#6b7280'
                  }}>
                    {order.paymentStatus || 'UNPAID'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, 'status', e.target.value)}
                    className="form-input"
                    style={{ padding: '0.25rem' }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {['Payment Successful', 'Processing', 'Shipped', 'Delivered'].includes(order.status) && (
                    <button 
                      onClick={() => handleRefund(order.id, Number(order.totalAmount))} 
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                    >
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && orders.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} setPage={setPage} />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel fade-in" style={{
            width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
            padding: '2rem', borderRadius: '16px', position: 'relative',
            backgroundColor: 'var(--bg-main)'
          }}>
            <button 
              onClick={() => setSelectedOrder(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>
            
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem' }}>Order Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <Package size={16} /> Order Info
                </h4>
                <p style={{ margin: '0 0 0.5rem' }}><strong>ID:</strong> {selectedOrder.id}</p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Logistics Status:</strong> 
                  <select 
                    value={selectedOrder.status} 
                    onChange={(e) => updateStatus(selectedOrder.id, 'status', e.target.value)}
                    className="form-input"
                    style={{ padding: '0.25rem', marginLeft: '0.5rem' }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>Payment Status:</strong> 
                  <select 
                    value={selectedOrder.paymentStatus || 'UNPAID'} 
                    onChange={(e) => updateStatus(selectedOrder.id, 'paymentStatus', e.target.value)}
                    className="form-input"
                    style={{ padding: '0.25rem', marginLeft: '0.5rem' }}
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </p>
                <p style={{ margin: '0 0 0.5rem' }}><strong>Customer:</strong> {selectedOrder.user?.email || 'Guest'}</p>
              </div>
              
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <MapPin size={16} /> Shipping Address
                </h4>
                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                  {renderAddress(selectedOrder.shippingAddress)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <Package size={16} /> Items
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Product</th>
                    <th style={{ padding: '0.5rem' }}>SKU</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{item.product?.name || 'Unknown Product'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{item.product?.sku || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>${Number(item.price).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>${(item.quantity * Number(item.price)).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No items found for this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '300px', backgroundColor: 'var(--bg-muted)', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>${(Number(selectedOrder.totalAmount) - Number(selectedOrder.shippingCost) + Number(selectedOrder.discountAmount)).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shipping ({selectedOrder.shippingMethod})</span>
                  <span>${Number(selectedOrder.shippingCost).toFixed(2)}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#10b981' }}>
                    <span>Discount</span>
                    <span>-${Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  <span>Total</span>
                  <span>${Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

