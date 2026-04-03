const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// GET /api/reports/sales - Sales summary report
router.get('/sales', async (req, res) => {
  try {
    const uid = req.user?.uid
    let query = db().collection('transactions').where('type', '==', 'sale')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      query = query.where('ownerUid', '==', uid)
    }
    const snapshot = await query.limit(1000).get()
    const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    const getTime = (val) => {
      if (!val) return 0
      if (val._seconds) return val._seconds * 1000
      if (val.seconds) return val.seconds * 1000
      return new Date(val).getTime() || 0
    }

    transactions.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))

    // Calculate totals
    let totalRevenue = 0
    let totalTax = 0
    let totalDiscount = 0
    let transactionCount = transactions.length

    let todayCash = 0
    let todayUpi = 0
    let todayRevenue = 0

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const startOfTodayMs = now.getTime()

    transactions.forEach(tx => {
      totalRevenue += tx.total || 0
      totalTax += tx.tax || 0
      totalDiscount += tx.discount || 0

      // Calculate Daily Counters based on severe 00:00 cutoff
      const txMs = getTime(tx.createdAt)
      if (txMs >= startOfTodayMs) {
        todayRevenue += tx.total || 0
        if (tx.payments && tx.payments.length > 0) {
          const method = tx.payments[0].method
          const amt = tx.payments[0].amount || tx.total || 0
          if (method === 'cash') todayCash += amt
          if (method === 'upi') todayUpi += amt
        }
      }
    })

    res.json({
      transactions,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        transactionCount,
        averageTransaction: transactionCount > 0 ? Math.round((totalRevenue / transactionCount) * 100) / 100 : 0,
        todayCash: Math.round(todayCash * 100) / 100,
        todayUpi: Math.round(todayUpi * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100
      }
    })
  } catch (error) {
    console.error('Sales report error:', error)
    res.status(500).json({ error: 'Failed to generate sales report' })
  }
})

// GET /api/reports/inventory - Inventory report
router.get('/inventory', async (req, res) => {
  try {
    const uid = req.user?.uid
    let query = db().collection('products')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      query = query.where('ownerUid', '==', uid)
    }
    const snapshot = await query.get()
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    products.sort((a, b) => (a.quantity || 0) - (b.quantity || 0))

    const lowStock = products.filter(p => (p.quantity || 0) < 10)
    const outOfStock = products.filter(p => (p.quantity || 0) === 0)
    
    let totalValue = 0
    let totalCost = 0
    
    products.forEach(p => {
      const qty = p.quantity || 0
      totalValue += qty * (p.price || 0)
      totalCost += qty * (p.cost || 0)
    })

    res.json({
      products,
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalInventoryValue: Math.round(totalValue * 100) / 100,
        totalInventoryCost: Math.round(totalCost * 100) / 100,
        potentialProfit: Math.round((totalValue - totalCost) * 100) / 100
      },
      lowStock,
      outOfStock
    })
  } catch (error) {
    console.error('Inventory report error:', error)
    res.status(500).json({ error: 'Failed to generate inventory report' })
  }
})

// GET /api/reports/top-products - Top selling products
router.get('/top-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const uid = req.user?.uid
    let query = db().collection('transactions').where('type', '==', 'sale')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      query = query.where('ownerUid', '==', uid)
    }
    const snapshot = await query.limit(500).get()
    
    const productStats = {}
    
    snapshot.docs.forEach(doc => {
      const tx = doc.data()
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          const key = item.productId || item.name
          if (!key) return
          
          if (!productStats[key]) {
            productStats[key] = {
              productId: item.productId,
              name: item.name,
              quantitySold: 0,
              revenue: 0
            }
          }
          
          productStats[key].quantitySold += item.quantity || 0
          productStats[key].revenue += (item.price || 0) * (item.quantity || 0)
        })
      }
    })

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100
      }))

    res.json({ topProducts })
  } catch (error) {
    console.error('Top products report error:', error)
    res.status(500).json({ error: 'Failed to generate top products report' })
  }
})

module.exports = router
