import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { 
  UploadCloud, Download, CheckCircle, AlertCircle, FileText, 
  Trash2, ArrowRight, Loader2, Info, Layers, Check, Copy, Package,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
}

interface ParsedPreviewRow {
  name: string;
  category: string;
  price: string;
  stock: string;
  cost?: string;
  sku?: string;
  brand?: string;
  imageUrl?: string;
  isCategoryValid: boolean;
}

interface AdminBulkUploadProps {
  onNavigateToProducts?: () => void;
}

export const AdminBulkUpload: React.FC<AdminBulkUploadProps> = ({ onNavigateToProducts }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [allParsedRows, setAllParsedRows] = useState<ParsedPreviewRow[]>([]);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const pageSize = 10;
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ 
    type: 'success' | 'error'; 
    text: string; 
    count?: number;
    imagesCount?: number;
    details?: string[] 
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showCategoriesList, setShowCategoriesList] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const getValidCategoryNames = () => {
    return categories.map(c => c.name.toLowerCase().trim());
  };

  // Client-side CSV parser for instant preview
  const parseCsvPreview = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      setAllParsedRows([]);
      setPreviewPage(1);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["'\uFEFF]/g, ''));
    const nameIdx = headers.findIndex(h => ['name', 'product_name', 'title'].includes(h));
    const catIdx = headers.findIndex(h => ['category', 'categoryid', 'category_id', 'categoryname'].includes(h));
    const priceIdx = headers.findIndex(h => ['price', 'unit_price', 'amount'].includes(h));
    const costIdx = headers.findIndex(h => ['cost', 'unit_cost', 'cost_price'].includes(h));
    const stockIdx = headers.findIndex(h => ['stockquantity', 'stock_quantity', 'stock', 'qty', 'quantity'].includes(h));
    const skuIdx = headers.findIndex(h => ['sku', 'code'].includes(h));
    const brandIdx = headers.findIndex(h => ['brand', 'brand_name', 'manufacturer'].includes(h));
    const imgIdx = headers.findIndex(h => ['imageurl', 'image_url', 'image', 'images', 'img'].includes(h));

    const validCatNames = getValidCategoryNames();
    const validCatIds = categories.map(c => c.id.toLowerCase());

    const parsed: ParsedPreviewRow[] = [];
    const dataLines = lines.slice(1);

    for (let i = 0; i < dataLines.length; i++) {
      // Support basic comma split with quoted text
      const rawCols = dataLines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || dataLines[i].split(',');
      const cleanCol = (idx: number) => {
        if (idx === -1 || !rawCols[idx]) return '';
        return rawCols[idx].replace(/^"|"$/g, '').trim();
      };

      const name = cleanCol(nameIdx);
      if (!name) continue;

      const cat = cleanCol(catIdx);
      const price = cleanCol(priceIdx);
      const cost = cleanCol(costIdx);
      const stock = cleanCol(stockIdx);
      const sku = cleanCol(skuIdx);
      const brand = cleanCol(brandIdx);
      const imageUrl = cleanCol(imgIdx);

      const isCategoryValid = 
        validCatNames.includes(cat.toLowerCase().trim()) || 
        validCatIds.includes(cat.toLowerCase().trim()) ||
        cat.toLowerCase() === 'replace-with-category-id' ||
        !cat;

      parsed.push({
        name,
        category: cat || '(Default Catalog Category)',
        price: price || '0.00',
        cost: cost || '0.00',
        stock: stock || '0',
        sku,
        brand,
        imageUrl,
        isCategoryValid
      });
    }

    setAllParsedRows(parsed);
    setPreviewPage(1);
  };

  const handleFileSelect = (selectedFile: File) => {
    setResultMessage(null);
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setResultMessage({
        type: 'error',
        text: 'Invalid file format. Please upload a file with a .csv extension.'
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        parseCsvPreview(text);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'name,sku,description,price,cost,stockQuantity,category,brand,imageUrl\n';
    
    // Choose actual available categories from the catalog
    const primaryCat = categories.find(c => !c.parentId)?.name || 'Food';
    const subCat = categories.find(c => c.parentId)?.name || categories[1]?.name || 'Toys';
    const accCat = categories.find(c => c.name.toLowerCase().includes('acc'))?.name || categories[2]?.name || 'Accessories';

    const row1 = `Organic Salmon Dry Food,DOG-FOOD-01,Nutritious grain-free salmon formula for adult dogs,49.99,25.00,45,${primaryCat},HealthyPaws,https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600\n`;
    const row2 = `Interactive Squeaky Ball,TOY-BALL-02,Durable non-toxic rubber ball for active fetch play,14.50,6.00,120,${subCat},PetPlay,https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600\n`;
    const row3 = `Adjustable Reflective Leash,LEASH-ACC-03,Weatherproof nylon walking leash with padded handle,22.00,9.50,60,${accCat},SafeWalk,https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600\n`;

    const csvContent = headers + row1 + row2 + row3;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'happypets_products_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResultMessage(null);

    try {
      const res = await api.post('/admin/products/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResultMessage({
        type: 'success',
        text: res.data.message || 'Products uploaded successfully!',
        count: res.data.count,
        imagesCount: res.data.imagesCount
      });

      // Clear the current file after successful upload
      setFile(null);
      setAllParsedRows([]);
      setPreviewPage(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorResponse = err.response?.data;
      const errorMsg = 
        errorResponse?.message ||
        (typeof errorResponse?.error === 'string' ? errorResponse.error : null) ||
        errorResponse?.details?.message ||
        'Failed to upload CSV file. Please verify category names and column formats.';

      const details = Array.isArray(errorResponse?.details) ? errorResponse.details : undefined;

      setResultMessage({
        type: 'error',
        text: errorMsg,
        details
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCategoryName = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedText(name);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const resetUploadState = () => {
    setFile(null);
    setAllParsedRows([]);
    setPreviewPage(1);
    setResultMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalRowsCount = allParsedRows.length;
  const totalPreviewPages = Math.ceil(totalRowsCount / pageSize) || 1;
  const currentPreviewRows = allParsedRows.slice(
    (previewPage - 1) * pageSize,
    previewPage * pageSize
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="font-bold" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 0.4rem 0' }}>
              <UploadCloud size={26} style={{ color: 'var(--primary)' }} /> Bulk Upload Products (CSV)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, maxWidth: '750px' }}>
              Import new products into your store catalog from a spreadsheet. Use readable category names (e.g. <strong>"Food"</strong>, <strong>"Toys"</strong>) or Category IDs, and include optional product image URLs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-outline"
              onClick={handleDownloadTemplate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
            >
              <Download size={18} /> Download Sample Template
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setShowCategoriesList(!showCategoriesList)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
            >
              <Layers size={18} /> {showCategoriesList ? 'Hide Categories' : 'View Catalog Categories'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner Card */}
      {resultMessage && resultMessage.type === 'success' && (
        <div className="glass-panel" style={{
          padding: '1.5rem 2rem',
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                background: '#22c55e', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white' 
              }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.2rem 0', fontWeight: 700, color: '#15803d', fontSize: '1.1rem' }}>
                  Import Completed Successfully!
                </h4>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>
                  {resultMessage.text}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {onNavigateToProducts && (
                <button
                  className="btn btn-primary"
                  onClick={onNavigateToProducts}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                  <Package size={17} /> View in Products List <ArrowRight size={15} />
                </button>
              )}
              <button
                className="btn btn-outline"
                onClick={resetUploadState}
                style={{ padding: '0.5rem 1rem' }}
              >
                Upload Another File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner Card */}
      {resultMessage && resultMessage.type === 'error' && (
        <div className="glass-panel" style={{
          padding: '1.25rem 1.75rem',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: '#b91c1c', fontSize: '0.95rem' }}>
              {resultMessage.text}
            </span>
          </div>

          {resultMessage.details && resultMessage.details.length > 0 && (
            <div style={{ margin: '0.25rem 0 0 2rem', padding: 0, fontSize: '0.85rem', color: '#991b1b' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Row Details:</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {resultMessage.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone & Preview Container */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Hidden File Input */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".csv,text/csv,application/vnd.ms-excel"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
          }}
        />

        {/* Step 1: Drag & Drop Area (Shows when no file is selected) */}
        {!file ? (
          <div 
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
              borderRadius: '14px',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              background: isDragging ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              boxSizing: 'border-box'
            }}
            className="hover-lift"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud 
              size={52} 
              style={{ 
                color: isDragging ? 'var(--primary)' : 'var(--text-muted)', 
                margin: '0 auto 1rem auto',
                display: 'block'
              }} 
            />

            <h4 style={{ fontWeight: 600, fontSize: '1.15rem', margin: '0 0 0.5rem 0' }}>
              Click or drag a CSV file here to upload
            </h4>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Supports .csv files up to 10MB • UTF-8 encoded
            </p>
          </div>
        ) : (
          /* Step 2: Selected File Details & Preview Table Box */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            
            {/* File Info & Action Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem 1.25rem',
              background: 'var(--bg-muted)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-all' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>
                      {totalRowsCount} products detected
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Change File
                </button>

                <button
                  className="btn btn-outline"
                  onClick={resetUploadState}
                  disabled={loading}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#dc2626' }}
                >
                  <Trash2 size={15} /> Remove
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={loading}
                  style={{ padding: '0.45rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading Catalog...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} /> Confirm & Import ({totalRowsCount} Products)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CSV Data Preview Table */}
            {allParsedRows.length > 0 && (
              <div style={{
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                background: 'var(--bg-surface, #ffffff)'
              }}>
                <div style={{ 
                  padding: '0.75rem 1.25rem', 
                  background: 'var(--bg-muted)', 
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    Data Preview ({totalRowsCount} Products in CSV)
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Showing page {previewPage} of {totalPreviewPages}
                  </span>
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto', overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>#</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Product Name</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Price</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Cost</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Stock</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>SKU</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPreviewRows.map((r, i) => {
                        const globalIndex = (previewPage - 1) * pageSize + i + 1;
                        return (
                          <tr 
                            key={i} 
                            style={{ 
                              borderBottom: i < currentPreviewRows.length - 1 ? '1px solid var(--border-color)' : 'none',
                              background: i % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.015)'
                            }}
                          >
                            <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {globalIndex}
                            </td>
                            <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>
                              {r.name}
                              {r.brand && (
                                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                                  by {r.brand}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.65rem 1rem' }}>
                              <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.2rem 0.55rem', 
                                borderRadius: '4px', 
                                fontSize: '0.75rem',
                                background: r.isCategoryValid ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.15)',
                                color: r.isCategoryValid ? '#15803d' : '#a16207',
                                fontWeight: 600
                              }}>
                                {r.category}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>
                              ${Number(r.price).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)' }}>
                              ${Number(r.cost || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.65rem 1rem', fontWeight: 500 }}>
                              {r.stock}
                            </td>
                            <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {r.sku || '-'}
                            </td>
                            <td style={{ padding: '0.65rem 1rem' }}>
                              {r.imageUrl ? (
                                <img 
                                  src={r.imageUrl} 
                                  alt="" 
                                  style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with Pagination */}
                <div style={{ 
                  padding: '0.75rem 1.25rem', 
                  background: 'var(--bg-muted)', 
                  borderTop: '1px solid var(--border-color)', 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Showing {(previewPage - 1) * pageSize + 1} to {Math.min(previewPage * pageSize, totalRowsCount)} of {totalRowsCount} products
                  </span>

                  {totalPreviewPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        disabled={previewPage <= 1}
                        onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <span style={{ fontWeight: 600, padding: '0 0.4rem', color: 'var(--text-main)' }}>
                        Page {previewPage} of {totalPreviewPages}
                      </span>
                      <button
                        className="btn btn-outline"
                        disabled={previewPage >= totalPreviewPages}
                        onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Catalog Categories Box */}
      {showCategoriesList && (
        <div className="glass-panel" style={{ padding: '1.75rem 2rem', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
              <Layers size={20} style={{ color: 'var(--primary)' }} /> Available Catalog Categories ({categories.length})
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Click any category card to copy its exact name for your CSV
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '0.75rem'
          }}>
            {categories.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                No categories found in catalog. Create categories first before uploading products.
              </p>
            ) : (
              categories.map((cat) => {
                const isSub = Boolean(cat.parentId || cat.parent);
                const parentName = cat.parent?.name || categories.find(c => c.id === cat.parentId)?.name;
                const isCopied = copiedText === cat.name;

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCopyCategoryName(cat.name)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface, #ffffff)',
                      border: `1px solid ${isCopied ? '#22c55e' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    className="hover-lift"
                    title={`Click to copy "${cat.name}"`}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: '0.85rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {isSub && <span style={{ color: '#16a34a' }}>↳</span>}
                        {cat.name}
                      </div>
                      {isSub && parentName && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          in {parentName}
                        </div>
                      )}
                    </div>

                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      background: isCopied ? '#22c55e' : 'var(--bg-muted)',
                      color: isCopied ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexShrink: 0
                    }}>
                      {isCopied ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy
                        </>
                      )}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CSV Guide Info Card */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
          <Info size={18} /> Supported CSV Columns Reference
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Your CSV spreadsheet can contain the following headers (order and casing do not matter):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
            <div>• <strong>name</strong> (Required): Product display title</div>
            <div>• <strong>category</strong>: Category name or UUID</div>
            <div>• <strong>price</strong>: Retail unit selling price</div>
            <div>• <strong>cost</strong>: Wholesale unit cost (default: 0)</div>
            <div>• <strong>stockQuantity</strong>: Available unit quantity (default: 0)</div>
            <div>• <strong>sku</strong>: Unique SKU code identifier</div>
            <div>• <strong>brand</strong>: Brand or manufacturer name</div>
            <div>• <strong>imageUrl</strong>: Full public image URL</div>
            <div>• <strong>description</strong>: Product overview text</div>
          </div>
        </div>
      </div>

    </div>
  );
};
