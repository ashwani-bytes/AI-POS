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
      ocrResult.text = `Parsed ${items.length} items with ${aiResult.modelUsed || 'Gemini'}`
      console.log('[Gemini] Extracted', items.length, 'items')
    } catch (parseError) {
      console.error('[Gemini] Error parsing OCR image:', parseError.message)
      ocrResult.warning = parseError.message
    }

    // 3b) Map scanned items to database products
    let productsAdded = 0
    const mode = req.body.mode || 'sale'

    // Fetch user's inventory consistently with products route
    let prodQuery = db().collection('products')
    if (uid && uid !== 'dev' && uid !== 'anonymous' && uid !== 'demo-user') {
      prodQuery = prodQuery.where('ownerUid', '==', uid)
    }
    const userProductsSnap = await prodQuery.get()
    const cleanStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const userProducts = userProductsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    for (const item of items) {
      try {
        const itemClean = cleanStr(item.name)
        // Find exact or normalized match
        const matched = userProducts.find(p => {
          const prodClean = cleanStr(p.name)
          return prodClean === itemClean || (itemClean.length > 3 && prodClean.includes(itemClean)) || (prodClean.length > 3 && itemClean.includes(prodClean))
        })

        let cleanPrice = Number(item.price) || 0
        const cleanQty = Number(item.quantity) || 1

        if (matched) {
          // Match found in catalog! Attach the ID and canonical store name
          item.productId = matched.id
          item.name = matched.name

          // CRITICAL: In POS sale mode OR if scanned price is 0, ALWAYS use the store's registered retail price!
          if (cleanPrice <= 0 || mode === 'sale') {
            if (Number(matched.price) > 0) {
              cleanPrice = Number(matched.price)
              item.price = cleanPrice
            }
          }
          
          if (mode === 'restock') {
            const currentQty = Number(matched.quantity) || 0
            await db().collection('products').doc(matched.id).update({
              quantity: currentQty + cleanQty,
              updatedAt: new Date().toISOString(),
            })
            console.log(`[Inventory] Updated stock for "${matched.name}": +${cleanQty}`)
            productsAdded++
          }
        } else {
          // Product doesn't exist in stock.
          item.productId = null
          
          if (mode === 'restock') {
            const { categorizeProduct } = require('../services/langchain')
            const category = categorizeProduct(item.name)
            const newDocRef = await db().collection('products').add({
              name: item.name,
              cost: Number((cleanPrice * 0.7).toFixed(2)),
              price: cleanPrice,
              quantity: cleanQty,
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
