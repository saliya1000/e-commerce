import prisma from '../prisma';
import { ReportColumn, ReportMetric, GeneratePdfOptions } from '../utils/reportPdfGenerator';
import { decrypt } from '../utils/encryption';

function resolveCustomerName(user: any, guestId?: string | null): string {
  if (!user) return guestId ? 'Guest Checkout' : 'Customer';
  const fName = user.firstName ? decrypt(user.firstName) : '';
  const lName = user.lastName ? decrypt(user.lastName) : '';
  const fullName = `${fName} ${lName}`.trim();
  if (fullName) return fullName;
  if (user.email) return decrypt(user.email);
  return 'Customer';
}

export interface ReportResult {
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

export async function generateAdminReportData(
  reportType: string = 'sales',
  startDate?: string,
  endDate?: string,
  search?: string
): Promise<ReportResult> {
  // Normalize date range
  let start: Date;
  let end: Date;

  if (startDate) {
    start = new Date(startDate);
  } else {
    // Default: 30 days ago
    start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  if (endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  const dateRangeStr = `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
  const searchFilter = (search || '').trim().toLowerCase();

  switch (reportType) {
    case 'cost': {
      // Cost, Profit & Margin Analysis
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] }
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, cost: true, price: true }
              }
            }
          }
        }
      });

      const productAggMap = new Map<string, {
        name: string;
        sku: string;
        unitsSold: number;
        revenue: number;
        cost: number;
      }>();

      for (const order of orders) {
        for (const item of order.items) {
          const prodId = item.productId;
          const pName = item.product?.name || 'Unknown Product';
          const pSku = item.product?.sku || 'N/A';
          const qty = item.quantity;
          const rev = Number(item.price) * qty;
          const c = Number(item.cost) * qty;

          if (!productAggMap.has(prodId)) {
            productAggMap.set(prodId, {
              name: pName,
              sku: pSku,
              unitsSold: 0,
              revenue: 0,
              cost: 0
            });
          }

          const current = productAggMap.get(prodId)!;
          current.unitsSold += qty;
          current.revenue += rev;
          current.cost += c;
        }
      }

      let aggList = Array.from(productAggMap.values()).map(p => {
        const profit = p.revenue - p.cost;
        const marginPct = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
        return {
          ...p,
          profit,
          marginPct
        };
      });

      if (searchFilter) {
        aggList = aggList.filter(
          item => item.name.toLowerCase().includes(searchFilter) || item.sku.toLowerCase().includes(searchFilter)
        );
      }

      aggList.sort((a, b) => b.profit - a.profit);

      const totalRevenue = aggList.reduce((s, i) => s + i.revenue, 0);
      const totalCost = aggList.reduce((s, i) => s + i.cost, 0);
      const totalProfit = totalRevenue - totalCost;
      const totalUnits = aggList.reduce((s, i) => s + i.unitsSold, 0);
      const blendedMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      const rows = aggList.map(item => ({
        product: item.name,
        sku: item.sku,
        unitsSold: item.unitsSold,
        revenue: `$${item.revenue.toFixed(2)}`,
        cost: `$${item.cost.toFixed(2)}`,
        grossProfit: `$${item.profit.toFixed(2)}`,
        margin: `${item.marginPct.toFixed(1)}%`
      }));

      const columns: ReportColumn[] = [
        { header: 'Product Name', key: 'product', width: 220 },
        { header: 'SKU', key: 'sku', width: 90 },
        { header: 'Units Sold', key: 'unitsSold', width: 70, align: 'right' },
        { header: 'Gross Revenue', key: 'revenue', width: 95, align: 'right' },
        { header: 'COGS (Cost)', key: 'cost', width: 95, align: 'right' },
        { header: 'Gross Profit', key: 'grossProfit', width: 95, align: 'right' },
        { header: 'Margin %', key: 'margin', width: 75, align: 'right' }
      ];

      return {
        reportType: 'cost',
        title: 'Cost, Profit & Margin Analysis Report',
        subtitle: 'Product profitability, Cost of Goods Sold (COGS), and gross margins',
        dateRange: dateRangeStr,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
          { label: 'Total COGS', value: `$${totalCost.toFixed(2)}` },
          { label: 'Gross Profit', value: `$${totalProfit.toFixed(2)}` },
          { label: 'Blended Margin', value: `${blendedMargin.toFixed(1)}%` },
          { label: 'Total Units Sold', value: `${totalUnits}` }
        ],
        columns,
        rows,
        totals: {
          product: 'Total / Aggregate',
          sku: `${aggList.length} SKUs`,
          unitsSold: `${totalUnits}`,
          revenue: `$${totalRevenue.toFixed(2)}`,
          cost: `$${totalCost.toFixed(2)}`,
          grossProfit: `$${totalProfit.toFixed(2)}`,
          margin: `${blendedMargin.toFixed(1)}%`
        }
      };
    }

    case 'inventory': {
      // Inventory Valuation & Stock Health Report
      const products = await prisma.product.findMany({
        include: { category: { select: { name: true } } },
        orderBy: { stockQuantity: 'asc' }
      });

      let filtered = products;
      if (searchFilter) {
        filtered = filtered.filter(
          p => p.name.toLowerCase().includes(searchFilter) ||
               (p.sku && p.sku.toLowerCase().includes(searchFilter)) ||
               (p.category?.name && p.category.name.toLowerCase().includes(searchFilter))
        );
      }

      const totalCatalog = filtered.length;
      const totalUnitsOnHand = filtered.reduce((s, p) => s + p.stockQuantity, 0);
      const totalAssetCostValuation = filtered.reduce((s, p) => s + (p.stockQuantity * Number(p.cost)), 0);
      const totalRetailValuation = filtered.reduce((s, p) => s + (p.stockQuantity * Number(p.price)), 0);
      const lowStockCount = filtered.filter(p => p.stockQuantity > 0 && p.stockQuantity < 5).length;
      const outOfStockCount = filtered.filter(p => p.stockQuantity === 0).length;

      const rows = filtered.map(p => {
        const costVal = p.stockQuantity * Number(p.cost);
        const retailVal = p.stockQuantity * Number(p.price);
        const status = p.stockQuantity === 0 ? 'Out of Stock' : p.stockQuantity < 5 ? 'Low Stock' : 'In Stock';

        return {
          product: p.name,
          sku: p.sku || 'N/A',
          category: p.category?.name || 'Uncategorized',
          stock: p.stockQuantity,
          unitCost: `$${Number(p.cost).toFixed(2)}`,
          unitPrice: `$${Number(p.price).toFixed(2)}`,
          assetValue: `$${costVal.toFixed(2)}`,
          retailValue: `$${retailVal.toFixed(2)}`,
          status
        };
      });

      const columns: ReportColumn[] = [
        { header: 'Product Name', key: 'product', width: 200 },
        { header: 'SKU', key: 'sku', width: 85 },
        { header: 'Category', key: 'category', width: 95 },
        { header: 'Stock Units', key: 'stock', width: 65, align: 'right' },
        { header: 'Unit Cost', key: 'unitCost', width: 70, align: 'right' },
        { header: 'Retail Price', key: 'unitPrice', width: 75, align: 'right' },
        { header: 'Asset Value', key: 'assetValue', width: 85, align: 'right' },
        { header: 'Retail Value', key: 'retailValue', width: 85, align: 'right' },
        { header: 'Stock Health', key: 'status', width: 80, align: 'center' }
      ];

      return {
        reportType: 'inventory',
        title: 'Inventory Valuation & Stock Health Report',
        subtitle: 'Warehouse inventory asset balance, retail valuation, and low-stock alerts',
        dateRange: `Current Snapshot (${new Date().toISOString().split('T')[0]})`,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Catalog SKUs', value: `${totalCatalog}` },
          { label: 'Units on Hand', value: `${totalUnitsOnHand}` },
          { label: 'Asset Valuation (Cost)', value: `$${totalAssetCostValuation.toFixed(2)}` },
          { label: 'Retail Valuation', value: `$${totalRetailValuation.toFixed(2)}` },
          { label: 'Low Stock (<5)', value: `${lowStockCount}` },
          { label: 'Out of Stock', value: `${outOfStockCount}` }
        ],
        columns,
        rows,
        totals: {
          product: 'Total Inventory Assets',
          sku: `${totalCatalog} SKUs`,
          category: '-',
          stock: `${totalUnitsOnHand}`,
          unitCost: '-',
          unitPrice: '-',
          assetValue: `$${totalAssetCostValuation.toFixed(2)}`,
          retailValue: `$${totalRetailValuation.toFixed(2)}`,
          status: `${lowStockCount} Low / ${outOfStockCount} Out`
        }
      };
    }

    case 'orders': {
      // Orders & Fulfillment Status Report
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      let filtered = orders;
      if (searchFilter) {
        filtered = filtered.filter(o => {
          const cust = resolveCustomerName(o.user, o.guestId).toLowerCase();
          return o.id.toLowerCase().includes(searchFilter) || cust.includes(searchFilter) || o.status.toLowerCase().includes(searchFilter);
        });
      }

      const totalOrders = filtered.length;
      const totalAmount = filtered.reduce((s, o) => s + Number(o.totalAmount), 0);
      const deliveredCount = filtered.filter(o => o.status === 'DELIVERED').length;
      const processingCount = filtered.filter(o => ['PENDING', 'PROCESSING', 'CONFIRMED'].includes(o.status)).length;
      const cancelledCount = filtered.filter(o => o.status === 'CANCELLED').length;
      const fulfillmentRate = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;

      const rows = filtered.map(o => {
        const custName = resolveCustomerName(o.user, o.guestId);
        const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);

        return {
          orderId: `#${o.id.slice(0, 8).toUpperCase()}`,
          date: o.createdAt.toISOString().replace('T', ' ').slice(0, 16),
          customer: custName,
          shippingMethod: o.shippingMethod ? o.shippingMethod.toUpperCase() : 'STANDARD',
          paymentStatus: o.paymentStatus,
          orderStatus: o.status,
          items: itemCount,
          total: `$${Number(o.totalAmount).toFixed(2)}`
        };
      });

      const columns: ReportColumn[] = [
        { header: 'Order ID', key: 'orderId', width: 90 },
        { header: 'Date & Time', key: 'date', width: 110 },
        { header: 'Customer', key: 'customer', width: 150 },
        { header: 'Shipping', key: 'shippingMethod', width: 85 },
        { header: 'Payment', key: 'paymentStatus', width: 80, align: 'center' },
        { header: 'Status', key: 'orderStatus', width: 85, align: 'center' },
        { header: 'Items', key: 'items', width: 55, align: 'right' },
        { header: 'Total Amount', key: 'total', width: 85, align: 'right' }
      ];

      return {
        reportType: 'orders',
        title: 'Orders & Fulfillment Status Report',
        subtitle: 'Comprehensive order lifecycle, customer information, and delivery progress',
        dateRange: dateRangeStr,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Total Orders', value: `${totalOrders}` },
          { label: 'Gross Value', value: `$${totalAmount.toFixed(2)}` },
          { label: 'Delivered', value: `${deliveredCount}` },
          { label: 'In-Flight', value: `${processingCount}` },
          { label: 'Cancelled', value: `${cancelledCount}` },
          { label: 'Fulfillment Rate', value: `${fulfillmentRate.toFixed(1)}%` }
        ],
        columns,
        rows,
        totals: {
          orderId: 'Total Orders',
          date: `${totalOrders} orders`,
          customer: '-',
          shippingMethod: '-',
          paymentStatus: '-',
          orderStatus: `${fulfillmentRate.toFixed(0)}% Delivered`,
          items: `${filtered.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)}`,
          total: `$${totalAmount.toFixed(2)}`
        }
      };
    }

    case 'refunds': {
      // Refunds & Returns Analysis Report
      const refunds = await prisma.refund.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        },
        include: {
          order: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      let filtered = refunds;
      if (searchFilter) {
        filtered = filtered.filter(r => {
          const cust = resolveCustomerName(r.order?.user, r.order?.guestId).toLowerCase();
          return r.id.toLowerCase().includes(searchFilter) ||
                 r.orderId.toLowerCase().includes(searchFilter) ||
                 cust.includes(searchFilter) ||
                 (r.reason && r.reason.toLowerCase().includes(searchFilter));
        });
      }

      const totalRefundsCount = filtered.length;
      const totalRefundAmount = filtered.reduce((s, r) => s + Number(r.amount), 0);
      const completedCount = filtered.filter(r => r.status.toLowerCase() === 'completed').length;
      const pendingCount = filtered.filter(r => r.status.toLowerCase() === 'pending').length;

      const rows = filtered.map(r => {
        const custName = resolveCustomerName(r.order?.user, r.order?.guestId);

        return {
          refundId: `#${r.id.slice(0, 8).toUpperCase()}`,
          orderId: `#${r.orderId.slice(0, 8).toUpperCase()}`,
          date: r.createdAt.toISOString().replace('T', ' ').slice(0, 16),
          customer: custName,
          amount: `$${Number(r.amount).toFixed(2)}`,
          reason: r.reason || 'General customer return',
          status: r.status.toUpperCase()
        };
      });

      const columns: ReportColumn[] = [
        { header: 'Refund ID', key: 'refundId', width: 95 },
        { header: 'Order ID', key: 'orderId', width: 95 },
        { header: 'Date & Time', key: 'date', width: 120 },
        { header: 'Customer', key: 'customer', width: 160 },
        { header: 'Refund Amount', key: 'amount', width: 95, align: 'right' },
        { header: 'Reason', key: 'reason', width: 180 },
        { header: 'Status', key: 'status', width: 85, align: 'center' }
      ];

      return {
        reportType: 'refunds',
        title: 'Refunds & Returns Analysis Report',
        subtitle: 'Customer refund requests, return amounts, and disposition status',
        dateRange: dateRangeStr,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Total Refunds', value: `${totalRefundsCount}` },
          { label: 'Total Refund Value', value: `$${totalRefundAmount.toFixed(2)}` },
          { label: 'Completed Refunds', value: `${completedCount}` },
          { label: 'Pending Action', value: `${pendingCount}` }
        ],
        columns,
        rows,
        totals: {
          refundId: 'Total Refunds',
          orderId: `${totalRefundsCount} refunds`,
          date: '-',
          customer: '-',
          amount: `$${totalRefundAmount.toFixed(2)}`,
          reason: `${completedCount} Completed / ${pendingCount} Pending`,
          status: '-'
        }
      };
    }

    case 'top_products': {
      // Top-Selling & Fast-Moving Products Report
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            status: { notIn: ['CANCELLED'] }
          }
        },
        include: {
          product: {
            include: { category: true }
          }
        }
      });

      const productSalesMap = new Map<string, {
        id: string;
        name: string;
        sku: string;
        category: string;
        unitsSold: number;
        revenue: number;
        currentStock: number;
      }>();

      for (const item of orderItems) {
        const prodId = item.productId;
        const pName = item.product?.name || 'Unknown Product';
        const pSku = item.product?.sku || 'N/A';
        const pCategory = item.product?.category?.name || 'Uncategorized';
        const pStock = item.product?.stockQuantity ?? 0;
        const qty = item.quantity;
        const rev = Number(item.price) * qty;

        if (!productSalesMap.has(prodId)) {
          productSalesMap.set(prodId, {
            id: prodId,
            name: pName,
            sku: pSku,
            category: pCategory,
            unitsSold: 0,
            revenue: 0,
            currentStock: pStock
          });
        }

        const curr = productSalesMap.get(prodId)!;
        curr.unitsSold += qty;
        curr.revenue += rev;
      }

      let topList = Array.from(productSalesMap.values()).sort((a, b) => b.unitsSold - a.unitsSold);

      if (searchFilter) {
        topList = topList.filter(
          item => item.name.toLowerCase().includes(searchFilter) ||
                  item.sku.toLowerCase().includes(searchFilter) ||
                  item.category.toLowerCase().includes(searchFilter)
        );
      }

      const totalUnits = topList.reduce((s, i) => s + i.unitsSold, 0);
      const totalRevenue = topList.reduce((s, i) => s + i.revenue, 0);

      const rows = topList.map((item, index) => ({
        rank: `#${index + 1}`,
        product: item.name,
        sku: item.sku,
        category: item.category,
        unitsSold: item.unitsSold,
        revenue: `$${item.revenue.toFixed(2)}`,
        avgPrice: item.unitsSold > 0 ? `$${(item.revenue / item.unitsSold).toFixed(2)}` : '$0.00',
        currentStock: item.currentStock
      }));

      const columns: ReportColumn[] = [
        { header: 'Rank', key: 'rank', width: 45, align: 'center' },
        { header: 'Product Name', key: 'product', width: 220 },
        { header: 'SKU', key: 'sku', width: 90 },
        { header: 'Category', key: 'category', width: 100 },
        { header: 'Units Sold', key: 'unitsSold', width: 75, align: 'right' },
        { header: 'Gross Revenue', key: 'revenue', width: 95, align: 'right' },
        { header: 'Avg Selling Price', key: 'avgPrice', width: 95, align: 'right' },
        { header: 'In Stock', key: 'currentStock', width: 65, align: 'right' }
      ];

      return {
        reportType: 'top_products',
        title: 'Top-Selling & Fast-Moving Products Report',
        subtitle: 'Product volume rankings, market velocity, and inventory availability',
        dateRange: dateRangeStr,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Ranked Products', value: `${topList.length}` },
          { label: 'Total Units Sold', value: `${totalUnits}` },
          { label: 'Revenue Generated', value: `$${totalRevenue.toFixed(2)}` },
          { label: 'Top Seller', value: topList[0]?.name ? `${topList[0].name.slice(0, 18)}...` : 'N/A' }
        ],
        columns,
        rows,
        totals: {
          rank: '-',
          product: 'Top Products Total',
          sku: `${topList.length} SKUs`,
          category: '-',
          unitsSold: `${totalUnits}`,
          revenue: `$${totalRevenue.toFixed(2)}`,
          avgPrice: totalUnits > 0 ? `$${(totalRevenue / totalUnits).toFixed(2)}` : '$0.00',
          currentStock: '-'
        }
      };
    }

    case 'customers': {
      // Customer Spending & Lifetime Value Report
      const users = await prisma.user.findMany({
        include: {
          orders: {
            where: {
              createdAt: { gte: start, lte: end },
              status: { notIn: ['CANCELLED'] }
            }
          }
        }
      });

      // Filter to users with at least 1 order in period, or all registered accounts
      let customerList = users
        .filter(u => u.orders.length > 0)
        .map(u => {
          const totalSpent = u.orders.reduce((s, o) => s + Number(o.totalAmount), 0);
          const aov = u.orders.length > 0 ? totalSpent / u.orders.length : 0;
          const fullName = resolveCustomerName(u, null);
          const email = u.email ? decrypt(u.email) : 'N/A';

          return {
            id: u.id,
            name: fullName,
            email,
            role: u.role.toUpperCase(),
            ordersCount: u.orders.length,
            totalSpent,
            aov,
            joinedDate: u.createdAt.toISOString().split('T')[0]
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent);

      if (searchFilter) {
        customerList = customerList.filter(
          c => c.name.toLowerCase().includes(searchFilter) ||
               c.email.toLowerCase().includes(searchFilter) ||
               c.role.toLowerCase().includes(searchFilter)
        );
      }

      const totalCustomers = customerList.length;
      const totalCustomerSpend = customerList.reduce((s, c) => s + c.totalSpent, 0);
      const avgLTV = totalCustomers > 0 ? totalCustomerSpend / totalCustomers : 0;
      const repeatCount = customerList.filter(c => c.ordersCount > 1).length;

      const rows = customerList.map(c => ({
        customer: c.name,
        email: c.email,
        role: c.role,
        ordersCount: c.ordersCount,
        totalSpent: `$${c.totalSpent.toFixed(2)}`,
        aov: `$${c.aov.toFixed(2)}`,
        joinedDate: c.joinedDate
      }));

      const columns: ReportColumn[] = [
        { header: 'Customer Name', key: 'customer', width: 170 },
        { header: 'Email Address', key: 'email', width: 200 },
        { header: 'Role', key: 'role', width: 75, align: 'center' },
        { header: 'Orders Placed', key: 'ordersCount', width: 85, align: 'right' },
        { header: 'Total Spent', key: 'totalSpent', width: 95, align: 'right' },
        { header: 'Avg Order Value', key: 'aov', width: 95, align: 'right' },
        { header: 'Member Since', key: 'joinedDate', width: 90, align: 'center' }
      ];

      return {
        reportType: 'customers',
        title: 'Customer Spending & Lifetime Value Report',
        subtitle: 'Customer transaction volume, cumulative spending, and purchasing frequency',
        dateRange: dateRangeStr,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Active Customers', value: `${totalCustomers}` },
          { label: 'Total Customer Spend', value: `$${totalCustomerSpend.toFixed(2)}` },
          { label: 'Avg Customer Spend', value: `$${avgLTV.toFixed(2)}` },
          { label: 'Repeat Buyers', value: `${repeatCount}` }
        ],
        columns,
        rows,
        totals: {
          customer: 'Customer Totals',
          email: `${totalCustomers} accounts`,
          role: '-',
          ordersCount: `${customerList.reduce((s, c) => s + c.ordersCount, 0)}`,
          totalSpent: `$${totalCustomerSpend.toFixed(2)}`,
          aov: `$${avgLTV.toFixed(2)}`,
          joinedDate: '-'
        }
      };
    }

    case 'sales':
    default: {
      // Sales & Revenue Performance Report
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] }
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      let filtered = orders;
      if (searchFilter) {
        filtered = filtered.filter(o => {
          const cust = resolveCustomerName(o.user, o.guestId).toLowerCase();
          return o.id.toLowerCase().includes(searchFilter) || cust.includes(searchFilter);
        });
      }

      const totalRevenue = filtered.reduce((s, o) => s + Number(o.totalAmount), 0);
      const totalOrders = filtered.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalItems = filtered.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
      const totalShipping = filtered.reduce((s, o) => s + Number(o.shippingCost), 0);
      const totalDiscounts = filtered.reduce((s, o) => s + Number(o.discountAmount), 0);

      const rows = filtered.map(o => {
        const custName = resolveCustomerName(o.user, o.guestId);
        const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);

        return {
          orderId: `#${o.id.slice(0, 8).toUpperCase()}`,
          date: o.createdAt.toISOString().replace('T', ' ').slice(0, 16),
          customer: custName,
          itemsCount: itemCount,
          shipping: `$${Number(o.shippingCost).toFixed(2)}`,
          discount: `$${Number(o.discountAmount).toFixed(2)}`,
          total: `$${Number(o.totalAmount).toFixed(2)}`,
          paymentStatus: o.paymentStatus,
          status: o.status
        };
      });

      const columns: ReportColumn[] = [
        { header: 'Order ID', key: 'orderId', width: 90 },
        { header: 'Date & Time', key: 'date', width: 115 },
        { header: 'Customer', key: 'customer', width: 155 },
        { header: 'Items', key: 'itemsCount', width: 55, align: 'right' },
        { header: 'Shipping', key: 'shipping', width: 75, align: 'right' },
        { header: 'Discount', key: 'discount', width: 75, align: 'right' },
        { header: 'Total Revenue', key: 'total', width: 90, align: 'right' },
        { header: 'Payment', key: 'paymentStatus', width: 75, align: 'center' },
        { header: 'Status', key: 'status', width: 85, align: 'center' }
      ];

      return {
        reportType: 'sales',
        title: 'Sales & Revenue Performance Report',
        subtitle: 'Comprehensive order sales revenue, transaction discounts, and fulfillment metrics',
        dateRange: dateRangeStr,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        metrics: [
          { label: 'Gross Sales Revenue', value: `$${totalRevenue.toFixed(2)}` },
          { label: 'Orders Completed', value: `${totalOrders}` },
          { label: 'Avg Order Value (AOV)', value: `$${avgOrderValue.toFixed(2)}` },
          { label: 'Total Units Sold', value: `${totalItems}` },
          { label: 'Shipping Revenue', value: `$${totalShipping.toFixed(2)}` },
          { label: 'Total Discounts', value: `$${totalDiscounts.toFixed(2)}` }
        ],
        columns,
        rows,
        totals: {
          orderId: 'Gross Totals',
          date: `${totalOrders} orders`,
          customer: '-',
          itemsCount: `${totalItems}`,
          shipping: `$${totalShipping.toFixed(2)}`,
          discount: `$${totalDiscounts.toFixed(2)}`,
          total: `$${totalRevenue.toFixed(2)}`,
          paymentStatus: '-',
          status: '-'
        }
      };
    }
  }
}
