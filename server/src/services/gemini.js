const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs = require('fs')
const path = require('path')

async function performGeminiOcr(imagePath) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env")

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Log available models to help with debugging 404 errors
    try {
      const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }).listModels();
      console.log('[Gemini] Available models for this key:', result.models.map(m => m.name).join(', '));
    } catch (e) {
      console.warn('[Gemini] Could not list models:', e.message);
    }

    // Use gemini-1.5-flash-latest which is often more reliable than the versioned name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })

    // Read image file and convert to base64 Part object
    const imageBytes = fs.readFileSync(imagePath)
    const ext = path.extname(imagePath).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg'
    
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

    const result = await model.generateContent([prompt, imagePart])
    let text = result.response.text()
    
    // Clean markdown if accidentally returned
    text = text.trim()
    if (text.startsWith('```json')) text = text.replace(/^```json/, '')
    if (text.startsWith('```')) text = text.replace(/^```/, '')
    if (text.endsWith('```')) text = text.replace(/```$/, '')
    text = text.trim()
    
    console.log('[Gemini] Raw Extracted text:', text)
    
    // Forcefully extract the JSON array using Regex if Gemini hallucinates conversational padding
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

    // Ensure category exists for backend compat
    items = items.map(it => ({
      name: it.name || 'Unknown Item',
      quantity: it.quantity || 1,
      price: it.price || 0,
      category: 'Uncategorized'
    }))

    return { 
      success: true, 
      warning: items.length === 0 ? "No valid items could be interpreted from the image." : null, 
      items 
    }
  } catch (error) {
    console.error('[Gemini] OCR Failed:', error.message)
    return { success: false, warning: 'AI parsing failed: ' + error.message, items: [] }
  }
}

module.exports = { performGeminiOcr }
