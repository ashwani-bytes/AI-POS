import React, { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  Banknote, 
  Smartphone, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  AlertTriangle,
  Receipt,
  Layers
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'

const ReportsView = ({ active }) => {
  const { t } = useTheme()
  const [data, setData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pos_report_cache')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(!data)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchReports = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    try {
      const res = await api.get('/api/reports/dashboard')
      if (res.ok) {
        const report = await res.json()
        setData(report)
        setLastUpdated(new Date())
        try {
          sessionStorage.setItem('pos_report_cache', JSON.stringify(report))
        } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch dashboard reports:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    if (active) {
      fetchReports()
    }
  }, [active, fetchReports])

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[var(--muted-foreground)]">Preparing store intelligence...</p>
      </div>
    )
  }

  const { sales, inventory, topProducts, dailyTrends, recentTransactions } = data || {
    sales: {},
    inventory: {},
    topProducts: [],
    dailyTrends: [],
    recentTransactions: []
  }

  const maxDailyRevenue = Math.max(...(dailyTrends?.map(d => d.revenue) || [1]), 100)

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto pb-28">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> REAL-TIME METRICS
            </span>
            <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Store Analytics & Financials</h1>
        </div>

        <button
          onClick={() => fetchReports(true)}
          disabled={refreshing}
          className="self-start sm:self-auto px-5 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-600 text-slate-800 dark:text-white text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Intel'}</span>
        </button>
      </div>

      {/* TODAY'S PERFORMANCE HIGHLIGHTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span>📅</span> Today's Performance (Resets at 00:00)
          </h2>
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Active Register
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Today Gross */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-400/50 dark:border-blue-500/30 shadow-md relative overflow-hidden group hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs md:text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">Gross Revenue Today</span>
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400">₹{Number(sales?.todayRevenue || 0).toFixed(2)}</p>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-2">Combined cash drawer & UPI digital receipts today.</p>
          </div>

          {/* Today Cash */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400/50 dark:border-emerald-500/30 shadow-md relative overflow-hidden group hover:border-emerald-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs md:text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Cash Register Today</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400">₹{Number(sales?.todayCash || 0).toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                {sales?.cashPercentage || 0}% of Today
              </span>
              <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">Physical cash in drawer</span>
            </div>
          </div>

          {/* Today UPI */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-400/50 dark:border-purple-500/30 shadow-md relative overflow-hidden group hover:border-purple-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs md:text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider">UPI Digital Scans Today</span>
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl md:text-4xl font-black text-purple-600 dark:text-purple-400">₹{Number(sales?.todayUpi || 0).toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300">
                {sales?.upiPercentage || 0}% of Today
              </span>
              <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">Direct merchant bank settlement</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-DAY REVENUE BAR CHART & PAYMENT RATIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Chart */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 space-y-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base md:text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Sales Trend (Past 7 Days)</span>
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">Daily revenue and transaction frequency.</p>
            </div>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-xl">
              ₹{dailyTrends?.reduce((sum, d) => sum + d.revenue, 0).toFixed(2) || '0.00'} 7-Day Total
            </span>
          </div>

          {/* SVG / CSS Bar Chart */}
          <div className="pt-6 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 md:gap-4 px-2 border-b-2 border-slate-200 dark:border-slate-700">
              {dailyTrends && dailyTrends.length > 0 ? (
                dailyTrends.map((d, i) => {
                  const pct = Math.max(8, Math.round((d.revenue / maxDailyRevenue) * 100))
                  const isToday = i === dailyTrends.length - 1
                  return (
                    <div key={d.key} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20 border border-slate-700">
                        {d.label}: ₹{d.revenue.toFixed(2)} ({d.orders} bills)
                      </div>
                      
                      <div 
                        style={{ height: `${pct}%` }} 
                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 relative ${
                          isToday 
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25' 
                            : 'bg-slate-300 dark:bg-slate-700 hover:bg-blue-500'
                        }`}
                      >
                        {d.orders > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-black text-slate-800 dark:text-slate-200">
                            {d.orders}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs md:text-sm font-bold mt-1.5 truncate ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {d.label.split(',')[0]}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="w-full flex items-center justify-center text-sm font-semibold text-slate-500">
                  No sales recorded in the past 7 days.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Payment Method Ratio & Stock Health */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 space-y-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-black text-base md:text-lg flex items-center gap-2 mb-1 text-slate-900 dark:text-white">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Today's Payment Split</span>
            </h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-4">Cash vs UPI distribution ratio.</p>

            {/* Split Bar */}
            <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700 p-0.5 border border-slate-300 dark:border-slate-700">
              <div 
                style={{ width: `${sales?.upiPercentage || 0}%` }} 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-l-full transition-all duration-700" 
              />
              <div 
                style={{ width: `${sales?.cashPercentage || 0}%` }} 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-r-full transition-all duration-700" 
              />
            </div>

            <div className="flex justify-between text-xs md:text-sm mt-3.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">UPI: {sales?.upiPercentage || 0}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-900 dark:text-slate-100 font-bold">Cash: {sales?.cashPercentage || 0}%</span>
              </div>
            </div>
          </div>

          {/* Inventory Health Meter */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Catalog Health</span>
              <span className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">
                {inventory?.stockHealthPercentage || 100}% Healthy
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                style={{ width: `${inventory?.stockHealthPercentage || 100}%` }} 
                className="h-full bg-emerald-500 rounded-full" 
              />
            </div>
            <div className="flex justify-between text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>{inventory?.totalProducts || 0} Total SKUs</span>
              <span className={inventory?.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 font-black' : ''}>
                {inventory?.lowStockCount || 0} Low Stock
              </span>
              <span className={inventory?.outOfStockCount > 0 ? 'text-red-600 dark:text-red-400 font-black' : ''}>
                {inventory?.outOfStockCount || 0} Empty
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIFETIME METRICS & INVENTORY VALUATION */}
      <div className="space-y-4">
        <h2 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
          Lifetime Store Health & Economics
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-1.5">
            <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block">Total Lifetime Sales</span>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">₹{Number(sales?.totalRevenue || 0).toFixed(2)}</p>
            <span className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> Across {sales?.transactionCount || 0} bills
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-1.5">
            <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block">Average Order Size</span>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">₹{Number(sales?.averageTransaction || 0).toFixed(2)}</p>
            <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold">Per customer checkout</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-1.5">
            <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block">Inventory Retail Value</span>
            <p className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400">₹{Number(inventory?.totalInventoryValue || 0).toFixed(2)}</p>
            <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold">Total potential sales</span>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-1.5">
            <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider block">Potential Gross Profit</span>
            <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{Number(inventory?.potentialProfit || 0).toFixed(2)}</p>
            <span className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400 font-bold">Margin if fully sold</span>
          </div>
        </div>
      </div>

      {/* TOP SELLING PRODUCTS & RECENT RECEIPTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>Top Revenue Generators</span>
            </h3>
            <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400">Ranked by Sales</span>
          </div>

          <div className="space-y-3">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={p.productId || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs md:text-sm font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40' :
                      idx === 1 ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-800 dark:text-amber-500' :
                      'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <h4 className="font-black text-sm md:text-base text-slate-900 dark:text-white truncate">{p.name}</h4>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold">{p.quantitySold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-sm md:text-base text-emerald-600 dark:text-emerald-400">₹{Number(p.revenue || 0).toFixed(2)}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-bold block uppercase">Revenue</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500 text-center py-8">No transaction data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Transaction Activity */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Recent Completed Checkouts</span>
            </h3>
            <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400">Live POS Activity</span>
          </div>

          <div className="space-y-3">
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs md:text-sm font-black text-blue-600 dark:text-blue-400">
                        {tx.id.substring(0, 8)}...
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        tx.payments?.[0]?.method === 'upi' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {tx.payments?.[0]?.method || 'Cash'}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold">
                      {tx.items?.length || 0} item(s) • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                    ₹{Number(tx.total || 0).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500 text-center py-8">No recent transactions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsView
