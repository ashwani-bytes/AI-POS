const { db, admin } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// Create transaction (sale)
router.post('/', async (req, res) => {
  const { items = [], payments = [], customerId = null, discount = 0, taxRate = 0 } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' })
  }

  try {
    let subtotal = 0
    for (const it of items) {
      subtotal += (it.price || 0) * (it.quantity || 1)
    }
    const discountAmt = discount || 0
    const taxable = Math.max(0, subtotal - discountAmt)
    const tax = Math.round(taxable * (taxRate || 0) * 100) / 100
    const total = Math.round((taxable + tax) * 100) / 100

    const txData = {
      items, payments, customerId,
      discount: discountAmt, taxRate,
      subtotal, tax, total,
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
        await prodRef.update({
          quantity: admin.firestore.FieldValue.increment(-Math.abs(Number(it.quantity) || 0)),
          updatedAt: new Date().toISOString(),
        })
      } catch (stockErr) {
        console.warn('[Transactions] Stock update failed for', it.productId, ':', stockErr.message)
      }
    }

    const snap = await txRef.get()
    res.json({ id: txRef.id, ...snap.data() })
  } catch (e) {
    console.error('[Transactions] Error:', e.message)
    res.status(500).json({ error: 'Failed to create transaction' })
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
    items.sort((a, b) => {
      const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0
      const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0
      return timeB - timeA
    })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions' })
  }
})

module.exports = router
