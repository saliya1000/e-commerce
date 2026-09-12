import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  brand: string;
  stockQuantity: number;
  category?: { id: string; name: string };
}

const ProductList: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categoryId, setCategoryId] = useState('');

  // Sync state from URL on mount and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const cat = params.get('categoryId') || '';
    
    setSearchTerm(q);
    setCategoryId(cat);
  }, [location.search]);

  // Extract unique brands for the filter dropdown
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('q', debouncedSearch);
      if (priceMin) params.append('minPrice', priceMin);
      if (priceMax) params.append('maxPrice', priceMax);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await api.get(`/products?${params.toString()}`);
      
      // Products might come wrapped in a pagination object or as an array
      // Let's assume the backend returns { data: [...], meta: {...} } based on typical Prisma setups
      const data = response.data.data || response.data;
      setProducts(data);
      
      // Extract unique brands from the current dataset if we haven't loaded them globally
      if (brands.length === 0) {
        const uniqueBrands = Array.from(new Set(data.map((p: Product) => p.brand))).filter(Boolean) as string[];
        setBrands(uniqueBrands);
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, priceMin, priceMax, selectedBrand, categoryId, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>


      <div style={{ display: 'flex', flex: 1, padding: '2rem', gap: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Faceted Search Sidebar */}
        <aside style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Category Widget */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => setCategoryId('')}
                style={{
                  textAlign: 'left', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: categoryId === '' ? 'var(--primary)' : 'transparent',
                  color: categoryId === '' ? 'white' : 'var(--text-main)',
                  fontWeight: categoryId === '' ? 600 : 400
                }}
              >
                All Categories
              </button>
              {categories
                .filter(cat => !debouncedSearch || products.some(p => p.category?.id === cat.id) || cat.id === categoryId)
                .map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  style={{
                    textAlign: 'left', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: categoryId === cat.id ? 'var(--primary)' : 'transparent',
                    color: categoryId === cat.id ? 'white' : 'var(--text-main)',
                    fontWeight: categoryId === cat.id ? 600 : 400
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Filter size={18} />
              <h3 style={{ fontSize: '1.1rem' }}>Filters</h3>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Brand</label>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.95rem' }}
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Price Range</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.95rem' }}
                />
                <span>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sort By</label>
              <select 
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '0.95rem' }}
              >
                <option value="relevance-desc">Relevance</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid rgba(255, 77, 79, 0.3)' }}>
              <h2 style={{ marginBottom: '1rem', color: '#ff4d4f' }}>Oops! Something went wrong.</h2>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>We're having trouble loading the products right now. Please check your connection or try again later.</p>
              <button 
                onClick={fetchProducts}
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'var(--primary)', color: 'white', fontWeight: 600, transition: 'all 0.2s'
                }}
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>No products found</h2>
              <p className="text-muted">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '2rem' 
            }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductList;
