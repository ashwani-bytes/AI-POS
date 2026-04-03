const express = require('express')
const { db } = require('../config/firebase')
const router = express.Router()

// Fetch user settings
router.get('/', async (req, res) => {
  try {
    const uid = req.user?.uid || 'default'
    const doc = await db().collection('settings').doc(uid).get()
    
    if (!doc.exists) {
      return res.json({})
    }
    res.json(doc.data())
  } catch (error) {
    console.error('Fetch settings error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update user settings
router.post('/', async (req, res) => {
  try {
    const uid = req.user?.uid || 'default'
    // Upsert the specific user's document
    await db().collection('settings').doc(uid).set({
      ...req.body,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Save settings error:', error)
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

module.exports = router
