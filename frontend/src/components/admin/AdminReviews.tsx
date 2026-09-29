import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reviews', {
        params: { status: statusFilter || undefined }
      });
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const updateStatus = async (reviewId: string, status: string) => {
    try {
      await api.put(`/admin/reviews/${reviewId}/status`, { status });
      fetchReviews();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'rating-high') return b.rating - a.rating;
    if (sortBy === 'rating-low') return a.rating - b.rating;
    return 0;
  });

  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);
  const paginatedReviews = sortedReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="glass-panel" style={{ padding: '2rem', position: 'relative', minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="font-bold" style={{ fontSize: '1.5rem', margin: 0 }}>Review Moderation</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem', minWidth: '150px' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem', minWidth: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? <p>Loading reviews...</p> : (
        <div style={{ overflowX: 'auto', minHeight: '350px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Product</th>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Rating</th>
                <th style={{ padding: '1rem', width: '30%' }}>Comment</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReviews.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No reviews found.
                  </td>
                </tr>
              )}
              {paginatedReviews.map(review => (
                <tr key={review.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{review.product?.name || 'Unknown Product'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{review.productId.slice(0, 8)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{review.user?.firstName} {review.user?.lastName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{review.user?.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {review.rating} <Star size={16} fill="#F59E0B" color="#F59E0B" style={{ marginLeft: '0.25rem' }} />
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    {review.comment || <span style={{ color: 'var(--text-muted)' }}>No comment</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      backgroundColor: review.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 
                                       review.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: review.status === 'approved' ? '#10b981' : 
                             review.status === 'rejected' ? '#ef4444' : '#f59e0b'
                    }}>
                      {review.status || 'pending'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {review.status !== 'approved' && (
                      <button 
                        onClick={() => updateStatus(review.id, 'approved')}
                        style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Approve"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button 
                        onClick={() => updateStatus(review.id, 'rejected')}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Reject"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteReview(review.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn btn-outline" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Previous
          </button>
          <span style={{ fontWeight: 'bold' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn btn-outline" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ padding: '0.5rem 1rem' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
