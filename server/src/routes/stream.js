const express = require('express')
const { db } = require('../config/firebase')

const router = express.Router()

// Allowed collections for streaming
const ALLOWED = new Set(['products', 'customers', 'vendors', 'transactions', 'uploads'])

function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
}

function send(res, event, data) {
  try {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  } catch (e) {
    // Connection may have closed
  }
}

// GET /api/stream/:collection - real-time local store -> SSE stream
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params
    if (!ALLOWED.has(collection)) {
      return res.status(400).json({ error: 'Unsupported collection for streaming' })
    }

    sseHeaders(res)

    let query = db().collection(collection)
    
    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        send(res, 'snapshot', { collection, docs, count: docs.length, ts: Date.now() })
      },
      (err) => {
        send(res, 'error', { message: err.message })
      }
    )

    // Keep the connection alive with ping messages
    const ping = setInterval(() => send(res, 'ping', { ts: Date.now() }), 25000)

    req.on('close', () => {
      clearInterval(ping)
      if (unsubscribe) unsubscribe()
      try { res.end() } catch (_) {}
    })
  } catch (e) {
    console.error('SSE stream error:', e)
    try { res.writeHead(500) } catch (_) {}
    send(res, 'error', { message: 'Stream failed' })
  }
})

module.exports = router
