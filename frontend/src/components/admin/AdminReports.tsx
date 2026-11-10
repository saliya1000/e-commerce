import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { 
  TrendingUp, 
  Package, 
  Download, 
  DollarSign, 
  Search, 
  RefreshCw, 
  ShoppingCart, 
  RotateCcw, 
  Users, 
  FileText,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ReportMetric {
  label: string;
  value: string;
}

interface ReportColumn {
  header: string;
  key: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

interface ReportData {
  reportType: string;
  title: string;
  subtitle: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  metrics: ReportMetric[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  totals?: Record<string, string>;
}

export const AdminReports: React.FC = () => {
  // Report Config
  const [reportType, setReportType] = useState<string>('sales');
  
  // Date Range Defaults (Last 30 Days)
  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultDates.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.end);
  const [activePreset, setActivePreset] = useState<string>('30d');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data & Loading States
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const reportOptions = [
    { id: 'sales', label: 'Sales & Revenue Performance', icon: DollarSign, description: 'Order revenue, customer spending, shipping, and discount metrics' },
    { id: 'cost', label: 'Cost, Profit & Gross Margins', icon: TrendingUp, description: 'Product profitability, COGS (Cost of Goods Sold), and gross profit margins' },
    { id: 'inventory', label: 'Inventory Valuation & Health', icon: Package, description: 'Warehouse stock balance, asset valuation at cost, and low-stock alerts' },
    { id: 'orders', label: 'Orders & Fulfillment Lifecycle', icon: ShoppingCart, description: 'Fulfillment pipeline, shipping methods, and order completion rates' },
    { id: 'refunds', label: 'Refunds & Returns Analysis', icon: RotateCcw, description: 'Customer refund requests, return reasons, and disposition statuses' },
    { id: 'top_products', label: 'Top-Selling & Fast Movers', icon: TrendingUp, description: 'Velocity rankings, units sold, and stock availability' },
    { id: 'customers', label: 'Customer Spending & LTV', icon: Users, description: 'Customer transaction frequency, cumulative spend, and account LTV' }
  ];

  // Preset handlers
  const applyPreset = (preset: '7d' | '30d' | 'thisMonth' | 'all') => {
    setActivePreset(preset);
    const end = new Date();
    let start = new Date();

    if (preset === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 30);
    } else if (preset === 'thisMonth') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset === 'all') {
      start = new Date(2024, 0, 1);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    fetchReport();
    setCurrentPage(1);
  }, [reportType, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/admin/reports', {
        params: {
          reportType,
          startDate,
          endDate
        }
      });
      setReportData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch report', err);
      setErrorMsg(err.response?.data?.error || 'Failed to load report data from server.');
    } finally {
      setLoading(false);
    }
  };

  // Filter rows locally by search term
  const filteredRows = useMemo(() => {
    if (!reportData || !reportData.rows) return [];
    if (!searchTerm.trim()) return reportData.rows;

    const term = searchTerm.toLowerCase().trim();
    return reportData.rows.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [reportData, searchTerm]);

  // Paginated Rows
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Download PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get('/admin/reports/download', {
        params: { reportType, startDate, endDate, search: searchTerm },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Failed to generate PDF report. Please verify connection and try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Download CSV
  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const response = await api.get('/admin/reports/csv', {
        params: { reportType, startDate, endDate, search: searchTerm },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed', err);
      alert('Failed to export CSV report.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Status Badge Formatter
  const renderCellContent = (key: string, val: any) => {
    if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>-</span>;

    const strVal = String(val);

    if (key === 'status' || key === 'paymentStatus' || key === 'orderStatus') {
      const upper = strVal.toUpperCase();
      let bg = '#f1f5f9';
      let color = '#475569';
      let border = '#cbd5e1';

      if (['PAID', 'DELIVERED', 'COMPLETED', 'IN STOCK'].includes(upper)) {
        bg = 'rgba(16, 185, 129, 0.12)';
        color = '#059669';
        border = 'rgba(16, 185, 129, 0.3)';
      } else if (['PENDING', 'PROCESSING', 'LOW STOCK'].includes(upper)) {
        bg = 'rgba(245, 158, 11, 0.12)';
        color = '#d97706';
        border = 'rgba(245, 158, 11, 0.3)';
      } else if (['CANCELLED', 'FAILED', 'OUT OF STOCK'].includes(upper)) {
        bg = 'rgba(239, 68, 68, 0.12)';
        color = '#dc2626';
        border = 'rgba(239, 68, 68, 0.3)';
      }

      return (
        <span style={{
          display: 'inline-block',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: bg,
          color,
          border: `1px solid ${border}`,
          textTransform: 'uppercase',
          letterSpacing: '0.025em'
        }}>
          {strVal}
        </span>
      );
    }

    if (key === 'grossProfit' || key === 'total' || key === 'revenue' || key === 'assetValue' || key === 'totalSpent') {
      return <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{strVal}</span>;
    }

    if (key === 'margin') {
      const num = parseFloat(strVal.replace('%', ''));
      const color = num >= 40 ? '#059669' : num >= 20 ? '#d97706' : '#dc2626';
      return <span style={{ fontWeight: 600, color }}>{strVal}</span>;
    }

    return <span>{strVal}</span>;
  };

  const selectedReportInfo = reportOptions.find(r => r.id === reportType) || reportOptions[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
      
      {/* Top Banner & Title */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div style={{ background: 'rgba(67, 56, 202, 0.1)', padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)' }}>
                <FileText size={26} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Analytics & Reports</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {selectedReportInfo.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-outline" 
              onClick={fetchReport}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleDownloadCsv}
              disabled={downloadingCsv || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FileSpreadsheet size={16} /> {downloadingCsv ? 'Exporting CSV...' : 'Export CSV'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} /> {downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
          </div>
        </div>

        {/* Quick Report Type Selector Pills */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginTop: '1.5rem', 
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.25rem'
        }}>
          {reportOptions.map(opt => {
            const Icon = opt.icon;
            const isSelected = reportType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setReportType(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Date Control Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Date Range Presets & Pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Calendar size={16} /> Date Range:
            </div>
            
            <div style={{ display: 'flex', background: 'var(--bg-muted)', borderRadius: '8px', padding: '0.2rem', gap: '0.2rem' }}>
              {(['7d', '30d', 'thisMonth', 'all'] as const).map(p => {
                const labels: Record<string, string> = { '7d': '7 Days', '30d': '30 Days', 'thisMonth': 'This Month', 'all': 'All Time' };
                const isCurrent = activePreset === p;
                return (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    style={{
                      background: isCurrent ? 'var(--bg-card)' : 'transparent',
                      border: isCurrent ? '1px solid var(--border-color)' : 'none',
                      boxShadow: isCurrent ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 600 : 500,
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => { setStartDate(e.target.value); setActivePreset('custom'); }}
                className="form-input" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }} 
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => { setEndDate(e.target.value); setActivePreset('custom'); }}
                className="form-input" 
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }} 
              />
            </div>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Filter in ${selectedReportInfo.label}...`}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

        </div>
      </div>

      {/* KPI Cards for the Selected Report */}
      {reportData && reportData.metrics && reportData.metrics.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, 
          gap: '1rem' 
        }}>
          {reportData.metrics.map((metric, idx) => (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.4rem',
                borderLeft: '4px solid var(--primary)'
              }}
            >
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                {metric.label}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderColor: '#fca5a5', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Interactive Report Data Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
              {reportData?.title || selectedReportInfo.label}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'} ({reportData?.dateRange || 'Current'})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="form-input"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
            <div>Loading report data...</div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Data Found</div>
            <div style={{ fontSize: '0.85rem' }}>There are no records matching the selected report and date range criteria.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  {reportData?.columns.map(col => (
                    <th 
                      key={col.key} 
                      style={{ 
                        padding: '0.85rem 0.75rem', 
                        fontWeight: 600,
                        textAlign: col.align || 'left',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(67, 56, 202, 0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {reportData?.columns.map(col => (
                      <td 
                        key={col.key} 
                        style={{ 
                          padding: '0.75rem', 
                          textAlign: col.align || 'left',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {renderCellContent(col.key, row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* Totals Summary Row */}
              {reportData?.totals && (
                <tfoot>
                  <tr style={{ 
                    borderTop: '2px solid var(--primary)', 
                    background: 'rgba(67, 56, 202, 0.06)',
                    fontWeight: 'bold',
                    color: 'var(--text-main)'
                  }}>
                    {reportData.columns.map((col, idx) => {
                      const totalVal = reportData.totals![col.key] || (idx === 0 ? 'Total' : '');
                      return (
                        <td 
                          key={col.key} 
                          style={{ 
                            padding: '0.85rem 0.75rem', 
                            textAlign: col.align || 'left',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {totalVal}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredRows.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="btn btn-outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
