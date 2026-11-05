const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

const getTime = (val) => {
  if (!val) return 0
  if (val._seconds) return val._seconds * 1000
  if (val.seconds) return val.seconds * 1000
  return new Date(val).getTime() || 0
}

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' })
    const doc = await db().collection('customers').add({
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUid: req.user?.uid || null,
    })
    const snap = await doc.get()
    res.json({ id: doc.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: `Create customer failed: ${e.message}`, details: e.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const uid = req.user?.uid
    let query = db().collection('customers')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      query = query.where('ownerUid', '==', uid)
    }
    const q = await query.limit(400).get()
    const items = q.docs.map(d => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: `List customers failed: ${e.message}`, details: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const ref = db().collection('customers').doc(req.params.id)
    const snapBefore = await ref.get()
    if (!snapBefore.exists) return res.status(404).json({ error: 'Customer not found' })

    const { name, phone, email, address } = req.body
    const updateData = {
      updatedAt: new Date().toISOString()
    }
    if (name !== undefined) updateData.name = name.trim()
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null
    if (email !== undefined) updateData.email = email ? email.trim() : null
    if (address !== undefined) updateData.address = address ? address.trim() : null

    await ref.update(updateData)
    const snap = await ref.get()
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update customer', details: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db().collection('customers').doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete customer', details: e.message })
  }
})

module.exports = router
