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

module.exports = router
module.exports.invalidateReportsCache = invalidateReportsCache
