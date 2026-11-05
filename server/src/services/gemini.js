const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs = require('fs')
const path = require('path')

// Priority list of models to try in case of deprecation/quota limit
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash'
]

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

    const prompt = `You are a highly capable OCR receipt and invoice parsing AI. Extract the items directly from this bill.
It might be a formal tabular GST invoice, a Tally printout, or a handwritten receipt.

For tabular invoices:
- The "name" of the item is usually under "Particulars", "Description", or "Item Name".
- The "quantity" is usually under "Qty", "PCS", "Pieces", or "Quantity".
- The "price" is usually under "Rate", "Price", or "MRP".

Crucially: Extract every single purchased item from the main table, skipping the GST/Header/Footer rows.

Return ONLY a strictly valid JSON array of objects representing the items. Do NOT wrap it in markdown blockquotes. Return exactly just the raw JSON array string.
Each object MUST have exactly these keys:
- "name": String (the full name of the item)
- "quantity": Number
- "price": Number

Example Output:
[
  {"name": "BREAD CRUMB 1 KG", "quantity": 10, "price": 123.81},
  {"name": "Lays (Classic Salted)", "quantity": 50, "price": 20}
]
`

    let lastError = null
    let text = ''
    let chosenModel = ''

    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[Gemini] Attempting OCR with ${modelName}...`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent([prompt, imagePart])
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
      if (isNaN(rawPrice) || rawPrice < 0) rawPrice = 0

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
