const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { performGeminiOcr } = require('../services/gemini')
const { db } = require('../config/firebase')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// GET /api/upload - list recent uploads for the user
router.get('/', async (req, res) => {
  try {
    const snap = await db().collection('uploads').orderBy('createdAt', 'desc').limit(100).get()
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (e) {
    console.error('[Upload] List error:', e.message)
    res.status(500).json({ error: 'Failed to list uploads', details: e.message })
  }
})

// POST /api/upload - Accept image, run OCR, store locally, save metadata, return parsed items
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const uid = req.user?.uid || null
    const buffer = req.file.buffer

    // 1) Save file locally FIRST so Gemini can read it from disk
    let filePath, downloadURL
    try {
      const fileId = uuidv4()
      const ext = path.extname(req.file.originalname || '.png')
      const safeName = `${Date.now()}_${fileId}${ext}`
      filePath = path.join(UPLOADS_DIR, safeName)
      fs.writeFileSync(filePath, buffer)
      // Build a URL the frontend can use to display the image
      downloadURL = `/uploads/${safeName}`
      console.log('[Storage] File saved locally:', filePath)
    } catch (storageError) {
      console.error('[Storage] Error saving file:', storageError.message)
      throw new Error(`Storage save failed: ${storageError.message}`)
    }

    // 2) Parse OCR to items using Gemini Vision
    let items = []
    let ocrResult = { warning: null, text: '' }
    try {
      console.log('[Gemini] Starting vision parsing...')
      const aiResult = await performGeminiOcr(filePath)
      items = aiResult.items || []
      ocrResult.warning = aiResult.warning
      ocrResult.text = "Parsed directly to JSON by Gemini"
      console.log('[Gemini] Extracted', items.length, 'items')
    } catch (parseError) {
      console.error('[Gemini] Error parsing OCR image:', parseError.message)
      ocrResult.warning = parseError.message
    }

    // 3b) Map scanned items to database products
    let productsAdded = 0
    const mode = req.body.mode || 'sale'

    // Securely pre-fetch the user's inventory to map names without triggering indexing errors
    const userProductsSnap = await db().collection('products').where('ownerUid', '==', uid).get()
    const productLookup = {}
    userProductsSnap.docs.forEach(d => {
      productLookup[d.data().name.toLowerCase()] = { id: d.id, ...d.data() }
    })

    for (const item of items) {
      try {
        const matchName = item.name.toLowerCase()
        const matched = productLookup[matchName]

        if (matched) {
          // Exact match found in store! Attach the ID so POS Checkouts deduct real stock.
          item.productId = matched.id
          
          if (mode === 'restock') {
            const currentQty = matched.quantity || 0
            await db().collection('products').doc(matched.id).update({
              quantity: currentQty + (item.quantity || 1),
              updatedAt: new Date().toISOString(),
            })
            console.log(`[Inventory] Updated stock for "${item.name}": +${item.quantity || 1}`)
            productsAdded++
          }
        } else {
          // Product doesn't exist in stock. Null ID means it acts as a custom POS entry.
          item.productId = null
          
          if (mode === 'restock') {
            const { categorizeProduct } = require('../services/langchain')
            const category = categorizeProduct(item.name)
            const newDocRef = await db().collection('products').add({
              name: item.name,
              cost: item.price ? Math.round(item.price * 0.7) : null,
              price: item.price || null,
              quantity: item.quantity || 1,
              category,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ownerUid: uid,
            })
            item.productId = newDocRef.id
            console.log(`[Inventory] Added new product "${item.name}" (${category})`)
            productsAdded++
          }
        }
      } catch (prodErr) {
        console.warn('[Inventory] Failed to process product:', item.name, prodErr.message)
      }
    }

    // 4) Save record to local store
    try {
      const docData = {
        ownerUid: uid,
        path: filePath,
        downloadURL,
        contentType: req.file.mimetype || null,
        size: req.file.size || null,
        ocrText: ocrResult.text || '',
        items,
        createdAt: new Date().toISOString(),
      }
      const docRef = await db().collection('uploads').add(docData)

      res.json({
        id: docRef.id,
        ...docData,
        productsAdded,
        warning: ocrResult.warning || null,
        success: true,
      })
    } catch (dbError) {
      console.error('[DB] Error saving document:', dbError.message)
      throw new Error(`DB save failed: ${dbError.message}`)
    }
  } catch (error) {
    console.error('[Upload] Complete error:', error.message)
    res.status(500).json({
      error: 'Failed to process image',
      details: error.message,
    })
  }
})

module.exports = router
