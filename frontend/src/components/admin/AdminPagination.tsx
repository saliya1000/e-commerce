import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({ page, totalPages, setPage }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px' }}>
      <button 
        disabled={page <= 1}
        onClick={() => setPage(p => Math.max(1, p - 1))}
        className="btn btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer', width: 'auto' }}
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
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (page >= totalPages || totalPages === 0) ? 0.5 : 1, cursor: (page >= totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', width: 'auto' }}
      >
        Next <ChevronRight size={18} />
      </button>
    </div>
  );
};
