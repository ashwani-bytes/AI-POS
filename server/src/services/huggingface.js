const Tesseract = require('tesseract.js')

async function ocrImageBuffer(buffer) {
  try {
    console.log('[OCR] Starting Tesseract.js OCR processing...')
    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round((m.progress || 0) * 100)
          if (pct % 25 === 0) console.log(`[OCR] Progress: ${pct}%`)
        }
      },
    })
    console.log('[OCR] Completed. Extracted text length:', data.text.length)
    return { text: data.text }
  } catch (e) {
    console.error('[OCR] Tesseract error:', e.message)
    return { text: '', warning: `OCR failed: ${e.message}` }
  }
}

module.exports = { ocrImageBuffer }
