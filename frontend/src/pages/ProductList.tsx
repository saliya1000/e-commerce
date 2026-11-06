import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  SlidersHorizontal,
  RotateCcw,
  Star,
  Check
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { SEO } from '../components/SEO';

interface Product {
  id: string;
  name: string;
  sku?: string;
  description: string;
  price: number | string;
  brand: string;
  stockQuantity: number;
  rating?: number | string;
  reviewCount?: number;
  category?: { id: string; name: string };
  images?: { url: string; mediumUrl?: string; thumbnailUrl?: string; isPrimary: boolean }[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const PRESET_PRICES = [
  { label: 'All', min: '', max: '' },
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 to $50', min: '25', max: '50' },
  { label: '$50 to $100', min: '50', max: '100' },
  { label: 'Over $100', min: '100', max: '' },
];

const ProductList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);

  // Raw query params parsed from URL
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Search & Filter State
  const initialQ = queryParams.get('q') || '';
  const initialCategory = queryParams.get('categoryId') || '';
  const initialBrand = queryParams.get('brand') || '';
  const initialMinPrice = queryParams.get('minPrice') || '';
  const initialMaxPrice = queryParams.get('maxPrice') || '';
  const initialInStock = queryParams.get('inStock') === 'true';
  const initialMinRating = queryParams.get('minRating') || '';
  const initialSortBy = queryParams.get('sortBy') || (initialQ ? 'relevance' : 'createdAt');
  const initialSortOrder = queryParams.get('sortOrder') || 'desc';
  const initialPage = parseInt(queryParams.get('page') || '1', 10) || 1;
  const initialLimit = parseInt(queryParams.get('limit') || '12', 10) || 12;

  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [priceMin, setPriceMin] = useState(initialMinPrice);
  const [priceMax, setPriceMax] = useState(initialMaxPrice);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // UI state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Metadata
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Sync state if URL changes externally (e.g. browser back/forward, navbar search)
  useEffect(() => {
    const q = queryParams.get('q') || '';
    const cat = queryParams.get('categoryId') || '';
    const b = queryParams.get('brand') || '';
    const pMin = queryParams.get('minPrice') || '';
    const pMax = queryParams.get('maxPrice') || '';
    const stock = queryParams.get('inStock') === 'true';
    const rating = queryParams.get('minRating') || '';
    const sBy = queryParams.get('sortBy') || (q ? 'relevance' : 'createdAt');
    const sOrder = queryParams.get('sortOrder') || 'desc';
    const pNum = parseInt(queryParams.get('page') || '1', 10) || 1;
    const lNum = parseInt(queryParams.get('limit') || '12', 10) || 12;

    setSearchTerm(q);
    setDebouncedSearch(q);
    setCategoryId(cat);
    setSelectedBrand(b);
    setPriceMin(pMin);
    setPriceMax(pMax);
    setInStockOnly(stock);
    setMinRating(rating);
    setSortBy(sBy);
    setSortOrder(sOrder);
    setPage(pNum);
    setLimit(lNum);
  }, [location.search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearch) {
        setDebouncedSearch(searchTerm);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // Sync filters to URL
  const updateUrl = useCallback((updates: Record<string, string | number | boolean | null | undefined>) => {
    const currentParams = new URLSearchParams(location.search);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === false) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(value));
      }
    });

    const newQuery = currentParams.toString();
    const newPath = `${location.pathname}${newQuery ? `?${newQuery}` : ''}`;
    
    if (newPath !== `${location.pathname}${location.search}`) {
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // Load initial Categories and Brands
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/products/categories').catch(() => ({ data: [] })),
          api.get('/products/brands').catch(() => ({ data: [] }))
        ]);
        setCategories(catRes.data || []);
        if (Array.isArray(brandRes.data) && brandRes.data.length > 0) {
          setBrands(brandRes.data);
        }
      } catch (err) {
        console.error('Failed to load categories or brands:', err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch Products based on current filters and pagination
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('q', debouncedSearch.trim());
      if (categoryId) params.append('categoryId', categoryId);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (priceMin) params.append('minPrice', priceMin);
      if (priceMax) params.append('maxPrice', priceMax);
      if (inStockOnly) params.append('inStock', 'true');
      if (minRating) params.append('minRating', minRating);
      
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await api.get(`/products?${params.toString()}`);
      const data = response.data.data || [];
      const meta = response.data.meta || {};

      setProducts(data);
      setTotalCount(meta.total !== undefined ? meta.total : data.length);
      setTotalPages(meta.totalPages || Math.ceil((meta.total || data.length) / limit) || 1);

      // If brands were not loaded from /products/brands, extract from products
      if (brands.length === 0 && data.length > 0) {
        const unique = Array.from(new Set(data.map((p: Product) => p.brand))).filter(Boolean) as string[];
        setBrands(unique);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Unable to load products. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, selectedBrand, priceMin, priceMax, inStockOnly, minRating, sortBy, sortOrder, page, limit, brands.length]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handlers for filter updates
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    setPage(1);
    updateUrl({ categoryId: catId || undefined, page: 1 });
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setPage(1);
    updateUrl({ brand: brand || undefined, page: 1 });
  };

  const handlePriceApply = (min: string, max: string) => {
    setPriceMin(min);
    setPriceMax(max);
    setPage(1);
    updateUrl({ minPrice: min || undefined, maxPrice: max || undefined, page: 1 });
  };

  const handlePresetPrice = (min: string, max: string) => {
    handlePriceApply(min, max);
  };

  const handleInStockChange = (val: boolean) => {
    setInStockOnly(val);
    setPage(1);
    updateUrl({ inStock: val ? 'true' : undefined, page: 1 });
  };

  const handleRatingChange = (val: string) => {
    setMinRating(val);
    setPage(1);
    updateUrl({ minRating: val || undefined, page: 1 });
  };

  const handleSortChange = (combinedValue: string) => {
    const [newSortBy, newSortOrder] = combinedValue.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
    updateUrl({ sortBy: newSortBy, sortOrder: newSortOrder, page: 1 });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    updateUrl({ limit: newLimit, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    updateUrl({ page: newPage });
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setPage(1);
    updateUrl({ q: undefined, page: 1 });
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setCategoryId('');
    setSelectedBrand('');
    setPriceMin('');
    setPriceMax('');
    setInStockOnly(false);
    setMinRating('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
    navigate(location.pathname, { replace: true });
  };

  // Active filters count and list for badges
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; onRemove: () => void }[] = [];
    if (debouncedSearch.trim()) {
      list.push({
        key: 'search',
        label: `Search: "${debouncedSearch.trim()}"`,
        onRemove: handleClearSearch
      });
    }
    if (categoryId) {
      const cat = categories.find(c => c.id === categoryId);
      list.push({
        key: 'category',
        label: `Category: ${cat ? cat.name : 'Selected'}`,
        onRemove: () => handleCategoryChange('')
      });
    }
    if (selectedBrand) {
      list.push({
        key: 'brand',
        label: `Brand: ${selectedBrand}`,
        onRemove: () => handleBrandChange('')
      });
    }
    if (priceMin || priceMax) {
      let label = 'Price: ';
      if (priceMin && priceMax) label += `$${priceMin} - $${priceMax}`;
      else if (priceMin) label += `Over $${priceMin}`;
      else if (priceMax) label += `Under $${priceMax}`;
      list.push({
        key: 'price',
        label,
        onRemove: () => handlePriceApply('', '')
      });
    }
    if (inStockOnly) {
      list.push({
        key: 'inStock',
        label: 'In Stock Only',
        onRemove: () => handleInStockChange(false)
      });
    }
    if (minRating) {
      list.push({
        key: 'rating',
        label: `${minRating}★ & above`,
        onRemove: () => handleRatingChange('')
      });
    }
    return list;
  }, [debouncedSearch, categoryId, categories, selectedBrand, priceMin, priceMax, inStockOnly, minRating]);

  // Page Numbers Array Builder with Ellipsis
  const paginationRange = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      range.unshift('...');
    }
    if (page + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }
    return range;
  }, [page, totalPages]);

  // Result numbers calculation
  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <SEO 
        title={debouncedSearch ? `Search results for "${debouncedSearch}" | HappyPets` : 'Shop All Products | HappyPets'} 
        description="Browse premium pet food, durable toys, orthopedic beds, and supplies. Filter and sort our extensive pet catalog." 
      />

      <div ref={topRef} style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Search Header Banner */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            
            {/* Search Input on Results Page */}
            <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: '520px' }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="text"
                aria-label="Search products"
                placeholder="Search toys, food, brands, SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 2.6rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'box-shadow 0.2s, border-color 0.2s'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search text"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="hide-desktop" style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}
              >
                <SlidersHorizontal size={18} />
                <span>Filters {activeFilters.length > 0 ? `(${activeFilters.length})` : ''}</span>
              </button>
            </div>

            {/* Controls: Items per page & Sort */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
              
              {/* Sort By Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ArrowUpDown size={14} /> Sort:
                </span>
                <select 
                  id="sortSelect"
                  aria-label="Sort products by"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="relevance-desc">Relevance / Best Match</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="createdAt-desc">Newest Arrivals</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>

              {/* Items Per Page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Show:</span>
                <select
                  aria-label="Products per page"
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  style={{
                    padding: '0.65rem 0.75rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

            </div>
          </div>

          {/* Result Count and Active Search Terms */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {loading ? (
                <span style={{ color: 'var(--text-muted)' }}>Searching products...</span>
              ) : totalCount > 0 ? (
                <span>
                  Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalCount}</strong> {totalCount === 1 ? 'product' : 'products'}
                  {debouncedSearch.trim() && (
                    <span> for <strong style={{ color: 'var(--primary)' }}>"{debouncedSearch.trim()}"</strong></span>
                  )}
                </span>
              ) : (
                <span>
                  No products found
                  {debouncedSearch.trim() && (
                    <span> for <strong style={{ color: 'var(--error)' }}>"{debouncedSearch.trim()}"</strong></span>
                  )}
                </span>
              )}
            </div>

            {/* Reset All Filters button */}
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <RotateCcw size={14} /> Clear all filters
              </button>
            )}
          </div>

          {/* Active Filter Chips / Pills */}
          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {activeFilters.map(filter => (
                <div
                  key={filter.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-color)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    color: 'var(--text-main)',
                    fontWeight: 500
                  }}
                >
                  <span>{filter.label}</span>
                  <button
                    type="button"
                    onClick={filter.onRemove}
                    aria-label={`Remove filter ${filter.label}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Main Content Layout: Sidebar Filters + Products Grid */}
        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>

          {/* Sidebar Filters */}
          <aside 
            className={`filters-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}
            style={{ 
              width: '270px', 
              flexShrink: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem' 
            }}
          >
            {/* Sidebar Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                <Filter size={18} color="var(--primary)" />
                <span>Filters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
                {mobileFiltersOpen && (
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="hide-desktop"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label="Close filters"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Filter Box */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Categories</h3>
                {categoryId && (
                  <button 
                    onClick={() => handleCategoryChange('')} 
                    style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '240px', overflowY: 'auto' }}>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    background: categoryId === '' ? 'var(--primary)' : 'transparent',
                    color: categoryId === '' ? 'white' : 'var(--text-main)',
                    fontWeight: categoryId === '' ? 700 : 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>All Categories</span>
                  {categoryId === '' && <Check size={16} />}
                </button>
                {categories.map(cat => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-main)',
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Filter Box */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Brand</h3>
                {selectedBrand && (
                  <button 
                    onClick={() => handleBrandChange('')} 
                    style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <select 
                id="brandSelect"
                aria-label="Filter by brand"
                value={selectedBrand} 
                onChange={(e) => handleBrandChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Brands ({brands.length})</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter Box */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Price Range</h3>
                {(priceMin || priceMax) && (
                  <button 
                    onClick={() => handlePriceApply('', '')} 
                    style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Price Preset Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                {PRESET_PRICES.map(preset => {
                  const isActive = priceMin === preset.min && priceMax === preset.max;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetPrice(preset.min, preset.max)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: isActive ? 'var(--primary)' : 'var(--bg-muted)',
                        color: isActive ? 'white' : 'var(--text-main)',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Min/Max Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>$</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="Min"
                    aria-label="Minimum price"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePriceApply(priceMin, priceMax); }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.5rem 0.55rem 1.25rem',
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>$</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="Max"
                    aria-label="Maximum price"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePriceApply(priceMin, priceMax); }}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.5rem 0.55rem 1.25rem',
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handlePriceApply(priceMin, priceMax)}
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem', fontWeight: 600, width: 'auto' }}
                >
                  Go
                </button>
              </div>
            </div>

            {/* Availability & Rating Box */}
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.65rem' }}>Availability</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => handleInStockChange(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span>In Stock Only</span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Customer Rating</h3>
                  {minRating && (
                    <button 
                      onClick={() => handleRatingChange('')} 
                      style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {[
                    { value: '', label: 'All Ratings' },
                    { value: '4', label: '4★ & above' },
                    { value: '3', label: '3★ & above' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRatingChange(option.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: minRating === option.value ? 'var(--bg-muted)' : 'transparent',
                        color: minRating === option.value ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: minRating === option.value ? 700 : 500,
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      {option.value ? (
                        <>
                          <Star size={14} fill="var(--primary)" color="var(--primary)" />
                          <span>{option.label}</span>
                        </>
                      ) : (
                        <span>{option.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </aside>

          {/* Product Grid & Pagination Section */}
          <main style={{ flex: 1, width: '100%' }}>
            
            {/* Loading Spinner */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '45vh', gap: '1rem' }}>
                <div style={{ width: '45px', height: '45px', border: '3.5px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Finding the best products for you...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : error ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px solid rgba(229, 62, 62, 0.3)' }}>
                <h2 style={{ marginBottom: '0.75rem', color: 'var(--error)' }}>Something went wrong</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem' }}
                >
                  <RotateCcw size={16} /> Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  No matching products found
                </h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                  {debouncedSearch 
                    ? `We couldn't find any products matching "${debouncedSearch}". Try checking your spelling or adjusting your filters.`
                    : 'No products match the selected filters. Try broadening your criteria.'}
                </p>
                <button 
                  onClick={handleResetAllFilters}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem' }}
                >
                  <RotateCcw size={16} /> Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div 
                  className="product-grid" 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
                    gap: '1.5rem' 
                  }}
                >
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Numbered Pagination Bar */}
                {totalPages > 1 && (
                  <nav 
                    aria-label="Products pagination"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      marginTop: '2.5rem',
                      padding: '1.25rem 1.5rem',
                      background: 'var(--bg-card)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Showing info text */}
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total results)
                    </div>

                    {/* Pagination Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      
                      {/* First Page button */}
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(1)}
                        aria-label="Go to first page"
                        style={{
                          padding: '0.5rem',
                          minWidth: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-muted)',
                          color: 'var(--text-main)',
                          cursor: page <= 1 ? 'not-allowed' : 'pointer',
                          opacity: page <= 1 ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        <ChevronsLeft size={16} />
                      </button>

                      {/* Previous Page button */}
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                        aria-label="Go to previous page"
                        style={{
                          padding: '0.5rem 0.75rem',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-muted)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: page <= 1 ? 'not-allowed' : 'pointer',
                          opacity: page <= 1 ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>

                      {/* Page Numbers */}
                      {paginationRange.map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span 
                              key={`ellipsis-${idx}`} 
                              style={{ padding: '0 0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}
                            >
                              …
                            </span>
                          );
                        }
                        const pageNum = Number(p);
                        const isCurrent = pageNum === page;
                        return (
                          <button
                            key={`page-${pageNum}`}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            aria-label={`Page ${pageNum}`}
                            aria-current={isCurrent ? 'page' : undefined}
                            style={{
                              minWidth: '36px',
                              height: '36px',
                              padding: '0 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '8px',
                              border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                              background: isCurrent ? 'var(--primary)' : 'var(--bg-card)',
                              color: isCurrent ? 'white' : 'var(--text-main)',
                              fontWeight: isCurrent ? 700 : 500,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              boxShadow: isCurrent ? '0 2px 6px rgba(255, 127, 80, 0.35)' : 'none',
                              transition: 'all 0.15s'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {/* Next Page button */}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(page + 1)}
                        aria-label="Go to next page"
                        style={{
                          padding: '0.5rem 0.75rem',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-muted)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                          opacity: page >= totalPages ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        Next <ChevronRight size={16} />
                      </button>

                      {/* Last Page button */}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        aria-label="Go to last page"
                        style={{
                          padding: '0.5rem',
                          minWidth: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-muted)',
                          color: 'var(--text-main)',
                          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                          opacity: page >= totalPages ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        <ChevronsRight size={16} />
                      </button>

                    </div>
                  </nav>
                )}
              </>
            )}

          </main>
        </div>

      </div>

      {/* Responsive Styles for Filter Sidebar on Mobile */}
      <style>{`
        @media (max-width: 900px) {
          .filters-sidebar {
            display: none !important;
          }
          .filters-sidebar.mobile-open {
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100% !important;
            height: 100vh;
            z-index: 999;
            background: var(--bg-main);
            overflow-y: auto;
            padding: 1.5rem;
            box-shadow: 0 0 25px rgba(0,0,0,0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default ProductList;
