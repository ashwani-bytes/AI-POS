const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, cost, price, quantity, category } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    
    const doc = await db().collection('products').add({
      name,
      cost: cost ?? null,
      price: price ?? null,
      quantity: quantity ?? 0,
      category: category || 'Uncategorized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUid: req.user?.uid || null,
    })
    const snap = await doc.get()
    console.log('[Products] Created product:', doc.id, 'for user:', req.user?.uid)
    res.json({ id: doc.id, ...snap.data() })
  } catch (e) {
    console.error('[Products] Create error:', e.message)
    res.status(500).json({ error: 'Failed to create product', details: e.message })
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
    items.sort((a, b) => {
      const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0
      const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0
      return timeB - timeA
    })
    res.json(items)
  } catch (e) {
    console.error('[Products] List error:', e.message)
    res.status(500).json({ error: 'Failed to list products', details: e.message })
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
    await ref.update({ ...req.body, updatedAt: new Date().toISOString() })
    const snap = await ref.get()
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await db().collection('products').doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

module.exports = router
