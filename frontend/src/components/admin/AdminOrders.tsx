import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert('Failed to update status');
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

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 className="font-bold mb-6" style={{ fontSize: '1.5rem' }}>Order Management</h3>
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>Customer</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{order.id.slice(0, 8)}...</td>
                <td style={{ padding: '1rem' }}>{order.user?.email || 'Guest'}</td>
                <td style={{ padding: '1rem' }}>${Number(order.totalAmount).toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="form-input"
                    style={{ padding: '0.25rem' }}
                  >
                    <option value="Pending Payment">Pending Payment</option>
                    <option value="Payment Successful">Payment Successful</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refund Processing">Refund Processing</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  {['Payment Successful', 'Processing', 'Shipped', 'Delivered'].includes(order.status) && (
                    <button 
                      onClick={() => handleRefund(order.id, Number(order.totalAmount))} 
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                    >
                      Issue Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
