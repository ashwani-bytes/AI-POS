const { db } = require('../config/firebase')
const { invalidateReportsCache } = require('./reports')
const express = require('express')
const router = express.Router()

const getTime = (val) => {
  if (!val) return 0
  if (val._seconds) return val._seconds * 1000
  if (val.seconds) return val.seconds * 1000
  return new Date(val).getTime() || 0
}

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, cost, price, quantity, category } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' })
    
    const doc = await db().collection('products').add({
      name: name.trim(),
      cost: cost !== null && cost !== undefined && cost !== '' ? Number(cost) : null,
      price: price !== null && price !== undefined && price !== '' ? Number(price) : null,
      quantity: Number(quantity) || 0,
      category: category ? category.trim() : 'Uncategorized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStockedAt: new Date().toISOString(),
      ownerUid: req.user?.uid || null,
    })
    const snap = await doc.get()
    invalidateReportsCache(req.user?.uid)
    console.log('[Products] Created product:', doc.id, 'for user:', req.user?.uid)
    res.json({ id: doc.id, ...snap.data() })
  } catch (e) {
    console.error('[Products] Create error:', e.message)
    res.status(500).json({ error: `Create product failed: ${e.message}`, details: e.message })
  }
})

// List products (filtered by user)
router.get('/', async (req, res) => {
  try {
    const uid = req.user?.uid
    let query = db().collection('products')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      query = query.where('ownerUid', '==', uid)
    }
    const q = await query.limit(400).get()
    const items = q.docs.map(d => ({ id: d.id, ...d.data() }))
    // Sort in memory to avoid Firebase Composite Index requirement
    items.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
    res.json(items)
  } catch (e) {
    console.error('[Products] List error:', e.message)
    res.status(500).json({ error: `List products failed: ${e.message}`, details: e.message })
  }
})

// Get one
router.get('/:id', async (req, res) => {
  try {
    const ref = db().collection('products').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Not found' })
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to get product' })
  }
})

// Update
router.put('/:id', async (req, res) => {
  try {
    const ref = db().collection('products').doc(req.params.id)
    const snapBefore = await ref.get()
    if (!snapBefore.exists) return res.status(404).json({ error: 'Product not found' })

    const updateData = { ...req.body, updatedAt: new Date().toISOString() }
    if (updateData.price !== undefined && updateData.price !== null && updateData.price !== '') {
      updateData.price = Number(updateData.price)
    }
    if (updateData.cost !== undefined && updateData.cost !== null && updateData.cost !== '') {
      updateData.cost = Number(updateData.cost)
    }
    if (updateData.quantity !== undefined && updateData.quantity !== null && updateData.quantity !== '') {
      updateData.quantity = Number(updateData.quantity)
      updateData.lastStockedAt = new Date().toISOString()
    }
    if (updateData.name) {
      updateData.name = updateData.name.trim()
    }
    if (updateData.category) {
      updateData.category = updateData.category.trim()
    }

    await ref.update(updateData)
    invalidateReportsCache(req.user?.uid)
    const snap = await ref.get()
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product', details: e.message })
  }
})

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await db().collection('products').doc(req.params.id).delete()
    invalidateReportsCache(req.user?.uid)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product', details: e.message })
  }
})

module.exports = router
