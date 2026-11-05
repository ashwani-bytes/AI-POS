const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs = require('fs')
const path = require('path')

// Priority list of models to try in case of deprecation/quota limit
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-flash-latest'
]

function withTimeout(ms, promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`OCR call timed out after ${ms}ms`)), ms))
  ])
}

async function performGeminiOcr(imagePath) {
  try {
    // Ensure the API key is clean
    const apiKey = (process.env.GEMINI_API_KEY || '').trim()
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env")

    const genAI = new GoogleGenerativeAI(apiKey)

    // Read image file and convert to base64 Part object
    const imageBytes = fs.readFileSync(imagePath)
    const ext = path.extname(imagePath).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'

    const imagePart = {
      inlineData: {
        data: imageBytes.toString('base64'),
        mimeType
      }
    }

    const prompt = `You are a high-speed receipt and invoice parser AI. Extract all individual item rows from this bill image.
It may be a GST tax invoice, retail cash memo, wholesale challan, or handwritten receipt.

For each item row:
1. "name": Full product name (e.g., "Bread crumb 1 kg", "Chilli Flakes 500gm").
2. "quantity": Total units or quantity number (default to 1 if not specified).
3. "price": Single unit retail/selling price or rate.
   - If a "Rate", "Price", or "MRP" column is given, use that number.
   - If only line "Amount" / "Total" is visible, compute: price = total amount / quantity.
   - Extract numeric amounts only (e.g. 130, not "130.00 Rs").

Crucially: Return ONLY a valid JSON array of objects. No markdown backticks, no explanations.
Example output:
[
  {"name": "BREAD CRUMB 1 KG", "quantity": 10, "price": 130},
  {"name": "CHILLI FLAKES 500GM", "quantity": 2, "price": 204.75}
]
`

    let lastError = null
    let text = ''
    let chosenModel = ''

    // Fast failover with 25s timeout per model to prevent multi-minute freezes
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[Gemini] Attempting fast OCR with ${modelName}...`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await withTimeout(25000, model.generateContent([prompt, imagePart]))
        text = result.response.text()
        chosenModel = modelName
        break // Succeeded!
      } catch (err) {
        console.warn(`[Gemini] ${modelName} attempt failed: ${err.message}`)
        lastError = err
      }
    }

    if (!text && lastError) {
      throw lastError
    }

    // Clean markdown if accidentally returned
    text = (text || '').trim()
    if (text.startsWith('```json')) text = text.replace(/^```json/, '')
    if (text.startsWith('```')) text = text.replace(/^```/, '')
    if (text.endsWith('```')) text = text.replace(/```$/, '')
    text = text.trim()

    console.log(`[Gemini] Extracted text using ${chosenModel}:`, text)

    // Forcefully extract the JSON array using Regex if conversational padding exists
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }

    let items = []
    try {
      if (!text || text === '[]') {
        console.warn('[Gemini] Model returned empty or no text.')
      } else {
        items = JSON.parse(text)
      }
    } catch (parseErr) {
      console.warn('[Gemini] Failed to parse JSON. Cleaned Text was:\n', text, '\nError:', parseErr.message)
    }

    // Sanitize and ensure numeric types for frontend safety
    items = items.map(it => {
      let rawQty = it.quantity
      if (typeof rawQty !== 'number') {
        rawQty = parseInt(String(rawQty || 1).replace(/[^0-9]/g, ''), 10)
      }
      if (isNaN(rawQty) || rawQty <= 0) rawQty = 1

      let rawPrice = it.price
      if (typeof rawPrice !== 'number') {
        rawPrice = parseFloat(String(rawPrice || 0).replace(/[^0-9.]/g, ''))
      }
      if (isNaN(rawPrice) || rawPrice <= 0) {
        // Fallback: check if model returned rate, amount or total
        const fallbackAmt = parseFloat(String(it.amount || it.rate || it.total || 0).replace(/[^0-9.]/g, ''))
        if (!isNaN(fallbackAmt) && fallbackAmt > 0) {
          rawPrice = Number((fallbackAmt / rawQty).toFixed(2))
        } else {
          rawPrice = 0
        }
      }

      return {
        name: String(it.name || 'Unknown Item').trim(),
        quantity: rawQty,
        price: Number(rawPrice.toFixed(2)),
        category: it.category || 'Uncategorized'
      }
    })

    return {
      success: true,
      modelUsed: chosenModel,
      warning: items.length === 0 ? "No valid items could be interpreted from the image." : null,
      items
    }
  } catch (error) {
    console.error('[Gemini] OCR Failed:', error.message)
    return { success: false, warning: 'AI parsing failed: ' + error.message, items: [] }
  }
}

module.exports = { performGeminiOcr }
