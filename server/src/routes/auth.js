const express = require('express')
const router = express.Router()

// POST /api/auth/sessionLogin - just succeed in local mode
router.post('/sessionLogin', async (req, res) => {
  res.json({ ok: true })
})

// GET /api/auth/debugLogin - just succeed in local mode
router.get('/debugLogin', async (req, res) => {
  res.json({ ok: true })
})

// Protected: who am I
router.get('/me', async (req, res) => {
  res.json({ user: { uid: 'dev', mode: 'local-dev' } })
})

// POST /api/auth/sessionLogout -> just succeed
router.post('/sessionLogout', async (req, res) => {
  res.json({ ok: true })
})

module.exports = router
