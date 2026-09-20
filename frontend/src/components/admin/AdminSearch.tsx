import React from 'react';
import { Search } from 'lucide-react';

interface AdminSearchProps {
  search: string;
  setSearch: (value: string) => void;
  placeholder?: string;
}

export const AdminSearch: React.FC<AdminSearchProps> = ({ search, setSearch, placeholder = 'Search...' }) => {
  return (
    <div style={{ position: 'relative', width: '100%', minWidth: '250px', maxWidth: '400px' }}>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="form-input"
        style={{ width: '100%', paddingLeft: '2.5rem' }}
      />
      <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
    </div>
  );
};
