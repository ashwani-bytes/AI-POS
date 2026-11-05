const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// Fast In-Memory Cache (30 second TTL)
const cache = new Map()
const CACHE_TTL_MS = 30 * 1000

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.time > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return item.data
}

function setCache(key, data) {
  cache.set(key, { time: Date.now(), data })
}

function invalidateReportsCache(uid) {
  if (uid) {
    cache.delete(`report_${uid}`)
  } else {
    cache.clear()
  }
}

const getTime = (val) => {
  if (!val) return 0
  if (val._seconds) return val._seconds * 1000
  if (val.seconds) return val.seconds * 1000
  return new Date(val).getTime() || 0
}

// Compute full dashboard analytics in a single optimized pass
async function computeDashboardReport(uid) {
  const cacheKey = `report_${uid || 'all'}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  // 1. Fetch transactions & products in parallel
  let txQuery = db().collection('transactions').where('type', '==', 'sale')
  let prodQuery = db().collection('products')

  if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
    txQuery = txQuery.where('ownerUid', '==', uid)
    prodQuery = prodQuery.where('ownerUid', '==', uid)
  }

  const [txSnapshot, prodSnapshot] = await Promise.all([
    txQuery.limit(500).get(),
    prodQuery.limit(500).get()
  ])

  const transactions = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  const products = prodSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))

  // Sort transactions by date descending
  transactions.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))

  // 2. Compute Sales & Payment Metrics
  let totalRevenue = 0
  let totalTax = 0
  let totalDiscount = 0
  const transactionCount = transactions.length

  let todayCash = 0
  let todayUpi = 0
  let todayRevenue = 0

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const startOfTodayMs = now.getTime()

  // Past 7 days map
  const dailyMap = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    dailyMap[key] = { key, label, revenue: 0, orders: 0 }
  }

  // Top products stats
  const productStats = {}

  transactions.forEach(tx => {
    const rev = Number(tx.total) || 0
    totalRevenue += rev
    totalTax += Number(tx.tax) || 0
    totalDiscount += Number(tx.discount) || 0

    const txMs = getTime(tx.createdAt)
    const txDateKey = new Date(txMs).toISOString().split('T')[0]

    if (dailyMap[txDateKey]) {
      dailyMap[txDateKey].revenue += rev
      dailyMap[txDateKey].orders += 1
    }

    if (txMs >= startOfTodayMs) {
      todayRevenue += rev
      if (tx.payments && tx.payments.length > 0) {
        const method = tx.payments[0].method
        const amt = Number(tx.payments[0].amount) || rev
        if (method === 'cash') todayCash += amt
        if (method === 'upi') todayUpi += amt
      }
    }

    // Top products aggregation
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach(item => {
        const k = item.productId || item.name
        if (!k) return
        if (!productStats[k]) {
          productStats[k] = {
            productId: item.productId,
            name: item.name || 'Unnamed Product',
            quantitySold: 0,
            revenue: 0
          }
        }
        const qty = Number(item.quantity) || 0
        const price = Number(item.price) || 0
        productStats[k].quantitySold += qty
        productStats[k].revenue += price * qty
      })
    }
  })

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map(p => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100
    }))

  const totalCollectedToday = todayCash + todayUpi || todayRevenue || 1
  const cashPercentage = Math.round((todayCash / totalCollectedToday) * 100) || 0
  const upiPercentage = Math.round((todayUpi / totalCollectedToday) * 100) || 0

  // 3. Compute Inventory Metrics
  let totalValue = 0
  let totalCost = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  products.forEach(p => {
    const qty = Number(p.quantity) || 0
    const price = Number(p.price) || 0
    const cost = Number(p.cost) || 0
    totalValue += qty * price
    totalCost += qty * cost

    if (qty <= 0) outOfStockCount++
    else if (qty < 10) lowStockCount++
  })

  const totalProducts = products.length
  const healthyStockCount = Math.max(0, totalProducts - lowStockCount - outOfStockCount)
  const stockHealthPercentage = totalProducts > 0 ? Math.round((healthyStockCount / totalProducts) * 100) : 100

  const report = {
    sales: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      transactionCount,
      averageTransaction: transactionCount > 0 ? Math.round((totalRevenue / transactionCount) * 100) / 100 : 0,
      todayCash: Math.round(todayCash * 100) / 100,
      todayUpi: Math.round(todayUpi * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      cashPercentage,
      upiPercentage,
    },
    inventory: {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
      stockHealthPercentage,
      totalInventoryValue: Math.round(totalValue * 100) / 100,
      totalInventoryCost: Math.round(totalCost * 100) / 100,
      potentialProfit: Math.round((totalValue - totalCost) * 100) / 100
    },
    topProducts,
    dailyTrends: Object.values(dailyMap),
    recentTransactions: transactions.slice(0, 5)
  }

  setCache(cacheKey, report)
  return report
}

// GET /api/reports/dashboard - Master Unified Analytics API
router.get('/dashboard', async (req, res) => {
  try {
    const uid = req.user?.uid
    const data = await computeDashboardReport(uid)
    res.json(data)
  } catch (error) {
    console.error('Dashboard report error:', error)
    res.status(500).json({ error: 'Failed to generate dashboard report', details: error.message })
  }
})

// GET /api/reports/sales - Backward compatible
router.get('/sales', async (req, res) => {
  try {
    const uid = req.user?.uid
    const data = await computeDashboardReport(uid)
    res.json({
      summary: data.sales,
      recentTransactions: data.recentTransactions
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sales report' })
  }
})

// GET /api/reports/inventory - Backward compatible
router.get('/inventory', async (req, res) => {
  try {
    const uid = req.user?.uid
    const data = await computeDashboardReport(uid)
    res.json({
      summary: data.inventory
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate inventory report' })
  }
})

// GET /api/reports/top-products - Backward compatible
router.get('/top-products', async (req, res) => {
  try {
    const uid = req.user?.uid
    const data = await computeDashboardReport(uid)
    res.json({ topProducts: data.topProducts })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate top products report' })
  }
})

// GET /api/reports/spreadsheet - Live Sales, Stock & Restock Ledger with Pie Chart Analytics
router.get('/spreadsheet', async (req, res) => {
  try {
    const uid = req.user?.uid
    const data = await computeSpreadsheetData(uid)
    res.json(data)
  } catch (error) {
    console.error('Spreadsheet report error:', error)
    res.status(500).json({ error: 'Failed to generate spreadsheet report', details: error.message })
  }
})

async function computeSpreadsheetData(uid) {
  let txQuery = db().collection('transactions').where('type', '==', 'sale')
  let prodQuery = db().collection('products')

  if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
    txQuery = txQuery.where('ownerUid', '==', uid)
    prodQuery = prodQuery.where('ownerUid', '==', uid)
  }

  const [txSnapshot, prodSnapshot] = await Promise.all([
    txQuery.limit(1000).get(),
    prodQuery.limit(1000).get()
  ])

  const transactions = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  const products = prodSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))

  transactions.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))

  // 1. Group daily sales
  const dailyGroups = {}
  const categorySales = {}
  let totalCash = 0
  let totalUpi = 0
  let grandSales = 0

  transactions.forEach(tx => {
    const rev = Number(tx.total) || 0
    grandSales += rev
    const txMs = getTime(tx.createdAt)
    const d = new Date(txMs)
    const dateKey = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'Unknown'
    const displayDate = !isNaN(d.getTime()) 
      ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
      : 'Unknown'

    if (!dailyGroups[dateKey]) {
      dailyGroups[dateKey] = {
        date: dateKey,
        displayDate,
        totalSales: 0,
        billsCount: 0,
        cashSales: 0,
        upiSales: 0,
        itemsCount: 0
      }
    }

    dailyGroups[dateKey].totalSales += rev
    dailyGroups[dateKey].billsCount += 1

    const method = tx.payments?.[0]?.method || tx.paymentMethod || 'cash'
    if (method === 'cash') {
      dailyGroups[dateKey].cashSales += rev
      totalCash += rev
    } else {
      dailyGroups[dateKey].upiSales += rev
      totalUpi += rev
    }

    if (Array.isArray(tx.items)) {
      tx.items.forEach(it => {
        const qty = Number(it.quantity) || 1
        dailyGroups[dateKey].itemsCount += qty

        const matchedProd = products.find(p => p.id === it.productId || p.name === it.name)
        const cat = matchedProd?.category || it.category || 'General'
        categorySales[cat] = (categorySales[cat] || 0) + ((Number(it.price) || 0) * qty)
      })
    }
  })

  const dailySales = Object.values(dailyGroups)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(d => ({
      ...d,
      totalSales: Math.round(d.totalSales * 100) / 100,
      cashSales: Math.round(d.cashSales * 100) / 100,
      upiSales: Math.round(d.upiSales * 100) / 100,
      avgBillValue: d.billsCount > 0 ? Math.round((d.totalSales / d.billsCount) * 100) / 100 : 0
    }))

  // 2. Format detailed itemized transactions
  const allTransactions = transactions.map(tx => {
    const txMs = getTime(tx.createdAt)
    const d = new Date(txMs)
    const formattedDate = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'N/A'

    const itemsSummary = Array.isArray(tx.items)
      ? tx.items.map(i => `${i.name || 'Item'} (x${i.quantity || 1})`).join(', ')
      : 'N/A'

    return {
      id: tx.id,
      date: tx.createdAt,
      formattedDate,
      itemCount: tx.items?.length || 0,
      itemsSummary,
      subtotal: Number(tx.subtotal) || Number(tx.total) || 0,
      discount: Number(tx.discount) || 0,
      tax: Number(tx.tax) || 0,
      total: Number(tx.total) || 0,
      paymentMethod: tx.payments?.[0]?.method || tx.paymentMethod || 'cash',
      items: tx.items || []
    }
  })

  // 3. Format inventory stock & restock history
  let inStockCount = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  const inventoryStock = products.map(p => {
    const qty = Number(p.quantity) || 0
    const price = Number(p.price) || 0
    const cost = Number(p.cost) || 0
    const totalValuation = Math.round(qty * price * 100) / 100
    const totalCostValue = Math.round(qty * cost * 100) / 100
    const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0

    let status = 'In Stock'
    if (qty <= 0) {
      status = 'Out of Stock'
      outOfStockCount++
    } else if (qty < 5) {
      status = 'Critical Low'
      lowStockCount++
    } else if (qty < 10) {
      status = 'Low Stock'
      lowStockCount++
    } else {
      inStockCount++
    }

    const rawStocked = p.lastStockedAt || p.updatedAt || p.createdAt || null
    let lastStockedFormatted = 'Initial Setup'
    if (rawStocked) {
      const stockDate = new Date(getTime(rawStocked))
      if (!isNaN(stockDate.getTime())) {
        lastStockedFormatted = stockDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + stockDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }
    }

    return {
      id: p.id,
      name: p.name || 'Unknown SKU',
      category: p.category || 'Uncategorized',
      quantity: qty,
      cost,
      price,
      totalValuation,
      totalCostValue,
      marginPercent: `${margin}%`,
      lastStockedAt: rawStocked,
      lastStockedFormatted,
      status
    }
  })

  // 4. Pie charts data
  const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#14b8a6']
  
  const totalCatSales = Object.values(categorySales).reduce((a, b) => a + b, 0) || 1
  const salesByCategory = Object.entries(categorySales).map(([label, val], idx) => ({
    label,
    value: Math.round(val * 100) / 100,
    percentage: Math.round((val / totalCatSales) * 100),
    color: PALETTE[idx % PALETTE.length]
  })).sort((a, b) => b.value - a.value)

  const totalPay = totalCash + totalUpi || 1
  const paymentModes = [
    { label: 'UPI / Digital QR', value: Math.round(totalUpi * 100) / 100, percentage: Math.round((totalUpi / totalPay) * 100), color: '#8b5cf6' },
    { label: 'Cash Counter', value: Math.round(totalCash * 100) / 100, percentage: Math.round((totalCash / totalPay) * 100), color: '#10b981' }
  ]

  const totalItems = products.length || 1
  const stockStatus = [
    { label: 'In Stock', value: inStockCount, percentage: Math.round((inStockCount / totalItems) * 100), color: '#10b981' },
    { label: 'Low Stock', value: lowStockCount, percentage: Math.round((lowStockCount / totalItems) * 100), color: '#f59e0b' },
    { label: 'Out of Stock', value: outOfStockCount, percentage: Math.round((outOfStockCount / totalItems) * 100), color: '#ef4444' }
  ]

  return {
    summary: {
      grandSales: Math.round(grandSales * 100) / 100,
      totalTransactions: transactions.length,
      totalStockUnits: products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0),
      totalValuation: inventoryStock.reduce((acc, p) => acc + p.totalValuation, 0),
      totalSKUs: products.length
    },
    dailySales,
    allTransactions,
    inventoryStock,
    pieCharts: {
      salesByCategory,
      paymentModes,
      stockStatus
    }
  }
}

module.exports = router
module.exports.invalidateReportsCache = invalidateReportsCache
