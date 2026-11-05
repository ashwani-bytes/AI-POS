const { db, admin } = require('../config/firebase')
const { invalidateReportsCache } = require('./reports')
const express = require('express')
const router = express.Router()

const getTime = (val) => {
  if (!val) return 0
  if (val._seconds) return val._seconds * 1000
  if (val.seconds) return val.seconds * 1000
  return new Date(val).getTime() || 0
}

// Create transaction (sale)
router.post('/', async (req, res) => {
  const { items = [], payments = [], customerId = null, discount = 0, taxRate = 0 } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' })
  }

  try {
    let subtotal = 0
    for (const it of items) {
      const price = Number(it.price) || 0
      const qty = Number(it.quantity) || 1
      subtotal += price * qty
    }
    const discountAmt = Math.max(0, Math.min(subtotal, Number(discount) || 0))
    const taxable = Math.max(0, subtotal - discountAmt)
    const rate = Number(taxRate) || 0
    const tax = Math.round(taxable * rate * 100) / 100
    const total = Math.round((taxable + tax) * 100) / 100

    const txData = {
      items, payments, customerId,
      discount: discountAmt, taxRate: rate,
      subtotal: Math.round(subtotal * 100) / 100,
      tax, total,
      createdAt: new Date().toISOString(),
      ownerUid: req.user?.uid || null,
      type: 'sale',
    }

    const txRef = await db().collection('transactions').add(txData)

    // Update stock
    for (const it of items) {
      if (!it.productId || !it.quantity) continue
      try {
        const prodRef = db().collection('products').doc(it.productId)
        const qtyToDeduct = Math.abs(Number(it.quantity) || 0)
        await prodRef.update({
          quantity: admin.firestore.FieldValue.increment(-qtyToDeduct),
          updatedAt: new Date().toISOString(),
        })
      } catch (stockErr) {
        console.warn('[Transactions] Stock update failed for', it.productId, ':', stockErr.message)
      }
    }

    invalidateReportsCache(req.user?.uid)
    const snap = await txRef.get()
    res.json({ id: txRef.id, ...snap.data() })
  } catch (e) {
    console.error('[Transactions] Error:', e.message)
    res.status(500).json({ error: 'Failed to create transaction', details: e.message })
  }
})

// List transactions
router.get('/', async (req, res) => {
  try {
    const uid = req.user?.uid
    let query = db().collection('transactions')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      query = query.where('ownerUid', '==', uid)
    }
    const q = await query.limit(400).get()
    const items = q.docs.map(d => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions', details: e.message })
  }
})

module.exports = router
