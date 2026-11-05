import React, { useState, useEffect, useMemo } from 'react'
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  RefreshCw, 
  PieChart as PieIcon, 
  Calendar, 
  Package, 
  Receipt, 
  Maximize2, 
  Minimize2,
  Printer,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { api } from '../lib/api'
import InteractivePieChart from './InteractivePieChart'
import ReceiptPrintModal from './ReceiptPrintModal'

/**
 * Universal In-App Spreadsheet Hub & Pie Chart Analytics Suite
 * Displays daily sales, itemized transactions, and stock & restock history in spreadsheet format.
 * Features 1-click CSV export for Excel & Google Sheets.
 */
const SpreadsheetView = ({ onBack, isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState('charts') // 'charts' | 'daily' | 'transactions' | 'stock'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTxnForPrint, setSelectedTxnForPrint] = useState(null)
  const [settings, setSettings] = useState(null)

  const fetchSpreadsheetData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const [sheetRes, setRes] = await Promise.all([
        api.get('/api/reports/spreadsheet'),
        api.get('/api/settings')
      ])

      if (sheetRes.ok) {
        setData(await sheetRes.json())
      }
      if (setRes.ok) {
        setSettings(await setRes.json())
      }
    } catch (err) {
      console.error('Failed to load spreadsheet data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSpreadsheetData()
  }, [])

  // Filtered Daily Sales
  const filteredDailySales = useMemo(() => {
    if (!data?.dailySales) return []
    if (!searchQuery.trim()) return data.dailySales
    const q = searchQuery.toLowerCase()
    return data.dailySales.filter(d => 
      d.date.toLowerCase().includes(q) || 
      d.displayDate.toLowerCase().includes(q)
    )
  }, [data?.dailySales, searchQuery])

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (!data?.allTransactions) return []
    if (!searchQuery.trim()) return data.allTransactions
    const q = searchQuery.toLowerCase()
    return data.allTransactions.filter(tx => 
      tx.id.toLowerCase().includes(q) || 
      tx.formattedDate.toLowerCase().includes(q) || 
      tx.itemsSummary.toLowerCase().includes(q) ||
      tx.paymentMethod.toLowerCase().includes(q)
    )
  }, [data?.allTransactions, searchQuery])

  // Filtered Stock & Restock History
  const filteredStock = useMemo(() => {
    if (!data?.inventoryStock) return []
    if (!searchQuery.trim()) return data.inventoryStock
    const q = searchQuery.toLowerCase()
    return data.inventoryStock.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      p.lastStockedFormatted.toLowerCase().includes(q)
    )
  }, [data?.inventoryStock, searchQuery])

  // CSV Export Helper
  const exportToCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportDailySales = () => {
    if (!data?.dailySales) return
    const headers = ['Date', 'Display Date', 'Total Sales (INR)', 'Bills Count', 'Cash Sales (INR)', 'UPI Sales (INR)', 'Average Bill Value (INR)', 'Units Sold']
    const rows = data.dailySales.map(d => [
      d.date,
      d.displayDate,
      d.totalSales,
      d.billsCount,
      d.cashSales,
      d.upiSales,
      d.avgBillValue,
      d.itemsCount
    ])
    exportToCSV('Daily_Sales_Ledger', headers, rows)
  }

  const handleExportStockReport = () => {
    if (!data?.inventoryStock) return
    const headers = ['Product / SKU Name', 'Category', 'Stock Units Remaining', 'Unit Cost (INR)', 'Retail Price (INR)', 'Total Valuation (INR)', 'Margin %', 'Last Stocked Date & Time', 'Inventory Status']
    const rows = data.inventoryStock.map(p => [
      p.name,
      p.category,
      p.quantity,
      p.cost,
      p.price,
      p.totalValuation,
      p.marginPercent,
      p.lastStockedFormatted,
      p.status
    ])
    exportToCSV('Stock_and_Restock_Ledger', headers, rows)
  }

  const handleExportAllTransactions = () => {
    if (!data?.allTransactions) return
    const headers = ['Invoice ID', 'Date & Time', 'Items Summary', 'Subtotal (INR)', 'Discount (INR)', 'GST Tax (INR)', 'Grand Total (INR)', 'Payment Tender']
    const rows = data.allTransactions.map(tx => [
      tx.id,
      tx.formattedDate,
      tx.itemsSummary,
      tx.subtotal,
      tx.discount,
      tx.tax,
      tx.total,
      tx.paymentMethod.toUpperCase()
    ])
    exportToCSV('Complete_Transactions_Ledger', headers, rows)
  }

  if (loading && !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading Sales & Stock Spreadsheet...</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-100 dark:bg-slate-950 overflow-y-auto' : ''}`}>
      
      {/* Top Header Card */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                Sales & Stock Spreadsheet Hub
              </h2>
              <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400">
                Daily sales ledger, restocking dates, live stock valuation, and visual pie charts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchSpreadsheetData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 transition"
              title="Refresh spreadsheet data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* CSV Export Dropdown / Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportDailySales}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
                title="Download daily sales table as Excel CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales CSV</span>
              </button>

              <button
                onClick={handleExportStockReport}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition active:scale-95"
                title="Download inventory stock & restock dates as Excel CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Stock CSV</span>
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 transition hidden sm:flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Search Bar */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 transition shrink-0 ${
                activeTab === 'charts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span>Pie Charts & Visuals</span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 transition shrink-0 ${
                activeTab === 'daily'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Daily Sales Ledger ({data?.dailySales?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 transition shrink-0 ${
                activeTab === 'stock'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Stock & Restock Ledger ({data?.inventoryStock?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-2 transition shrink-0 ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>All Receipts ({data?.allTransactions?.length || 0})</span>
            </button>
          </div>

          {/* Quick Search */}
          {activeTab !== 'charts' && (
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spreadsheet rows..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: PIE CHARTS & VISUAL DASHBOARD */}
      {activeTab === 'charts' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive KPI Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Lifetime Sales</span>
              <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{Number(data?.summary?.grandSales || 0).toFixed(2)}
              </p>
              <span className="text-[11px] font-bold text-slate-500">Across {data?.summary?.totalTransactions || 0} customer bills</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Live Inventory Valuation</span>
              <p className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400">
                ₹{Number(data?.summary?.totalValuation || 0).toFixed(2)}
              </p>
              <span className="text-[11px] font-bold text-slate-500">Total retail value on shelves</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Stock Units</span>
              <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                {data?.summary?.totalStockUnits || 0}
              </p>
              <span className="text-[11px] font-bold text-slate-500">Available physical items</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Registered Catalog SKUs</span>
              <p className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400">
                {data?.summary?.totalSKUs || 0}
              </p>
              <span className="text-[11px] font-bold text-slate-500">Active product entries</span>
            </div>
          </div>

          {/* 3 Interactive Pie Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Pie Chart 1: Sales Distribution by Category */}
            <InteractivePieChart
              title="Sales by Category"
              subtitle="Revenue contribution per merchandise category"
              data={data?.pieCharts?.salesByCategory || []}
              unit="₹"
            />

            {/* Pie Chart 2: Payment Tender Methods (UPI vs Cash) */}
            <InteractivePieChart
              title="Payment Tender Split"
              subtitle="UPI / QR Code vs Physical Cash Counter"
              data={data?.pieCharts?.paymentModes || []}
              unit="₹"
            />

            {/* Pie Chart 3: Live Stock Health Status */}
            <InteractivePieChart
              title="Inventory Stock Status"
              subtitle="Healthy Stock vs Low Warning vs Empty SKUs"
              data={data?.pieCharts?.stockStatus || []}
              unit="SKUs"
              isCount={true}
            />

          </div>
        </div>
      )}

      {/* TAB 2: DAILY SALES LEDGER SPREADSHEET */}
      {activeTab === 'daily' && (
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Everyday Sales Ledger</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredDailySales.length} day(s) recorded
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs md:text-sm font-sans">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 uppercase font-black text-[11px] border-b-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue</th>
                  <th className="py-3.5 px-4 text-center">Bills Count</th>
                  <th className="py-3.5 px-4 text-right">Cash Tender</th>
                  <th className="py-3.5 px-4 text-right">UPI Digital QR</th>
                  <th className="py-3.5 px-4 text-right">Avg Bill Value</th>
                  <th className="py-3.5 px-4 text-center">Items Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                {filteredDailySales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500">
                      No daily sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredDailySales.map((row, idx) => (
                    <tr key={row.date || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-black">
                        <div>{row.displayDate}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{row.date}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        ₹{Number(row.totalSales).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-black">
                          {row.billsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                        ₹{Number(row.cashSales).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                        ₹{Number(row.upiSales).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        ₹{Number(row.avgBillValue).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {row.itemsCount} units
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK & RESTOCK HISTORY SPREADSHEET */}
      {activeTab === 'stock' && (
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Warehouse Stock & Restock History Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Tracks current quantities, valuations, profit margins, and exact last restocking timestamps.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredStock.length} SKU item(s)
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs md:text-sm font-sans">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 uppercase font-black text-[11px] border-b-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Product / SKU Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Available Units</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Retail Price</th>
                  <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                  <th className="py-3.5 px-4 text-center">Margin %</th>
                  <th className="py-3.5 px-4 text-left">Last Stocked Date/Time</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-500">
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((p) => {
                    const isOut = p.quantity <= 0
                    const isLow = p.quantity > 0 && p.quantity < 5

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-black">
                          <span className="text-slate-900 dark:text-white">{p.name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            isOut ? 'bg-red-100 dark:bg-red-950/60 text-red-600' :
                            isLow ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' :
                            'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {p.quantity} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                          ₹{Number(p.cost).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-blue-600 dark:text-blue-400">
                          ₹{Number(p.price).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                          ₹{Number(p.totalValuation).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {p.marginPercent}
                        </td>
                        <td className="py-3.5 px-4 text-left font-mono text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{p.lastStockedFormatted}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase font-black ${
                            isOut ? 'bg-red-500 text-white' :
                            isLow ? 'bg-amber-500 text-white' :
                            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALL TRANSACTIONS ITEM SPREADSHEET */}
      {activeTab === 'transactions' && (
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Complete Itemized Sales History</span>
            </h3>
            <button
              onClick={handleExportAllTransactions}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Bills CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs md:text-sm font-sans">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 uppercase font-black text-[11px] border-b-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Invoice ID</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Items Purchased</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Discount</th>
                  <th className="py-3.5 px-4 text-right">GST Tax</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Tender</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono font-black text-blue-600 dark:text-blue-400">
                        {tx.id.substring(0, 8)}...
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap">
                        {tx.formattedDate}
                      </td>
                      <td className="py-3.5 px-4 max-w-[240px] truncate font-medium" title={tx.itemsSummary}>
                        {tx.itemsSummary}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        ₹{Number(tx.subtotal).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-red-500">
                        {Number(tx.discount) > 0 ? `-₹${Number(tx.discount).toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        ₹{Number(tx.tax).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{Number(tx.total).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase ${
                          tx.paymentMethod === 'upi'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedTxnForPrint(tx)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
                          title="Print Thermal Bill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Re-Print Modal */}
      {selectedTxnForPrint && (
        <ReceiptPrintModal
          isOpen={Boolean(selectedTxnForPrint)}
          onClose={() => setSelectedTxnForPrint(null)}
          transaction={selectedTxnForPrint}
          settings={settings}
          autoPrint={false}
        />
      )}

    </div>
  )
}

export default SpreadsheetView
