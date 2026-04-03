function parseLine(line) {
  const cleaned = line.trim().replace(/\s{2,}/g, ' ')
  if (!cleaned) return null

  // 1. Ignore common header/footer lines and noise
  const lower = cleaned.toLowerCase()
  const noiseWords = [
    'kacha bill', 'rough', 'estimate', 'date:', 'time:', 'ref. no',
    's.n.', 'item name', 'unit price', 'stock (qty)', 'total (', 'total value',
    'subtotal', 'tax', 'cgst', 'sgst', 'gst', 'cash', 'change',
    'thank', 'visit again', 'notes:', 'ph:', 'email:', 'invoice', 'bill no',
    'check expiry', 'restock'
  ]
  if (noiseWords.some(w => lower.includes(w))) {
    return null
  }

  // 2. Extract specific matches (like "x2", "2 pcs", "Rs 50")
  const qtyMatch = cleaned.match(/\b(x\s?\d+|\d+\s?(pcs|pc|qty))\b/i)
  const priceMatch = cleaned.match(/(\d+[.,]?\d*)\s*(INR|Rs|₹)$/i)
  
  // 3. Look for leading numbers (like "1. ", "2) ")
  const leadingNumMatch = cleaned.match(/^(\d+[\.\)]\s*)/)
  
  let quantity = 1
  if (qtyMatch) {
    const q = qtyMatch[0].match(/\d+/)
    if (q) quantity = parseInt(q[0], 10)
  }

  let price = null
  if (priceMatch) {
    price = parseFloat(priceMatch[1].replace(',', ''))
  }

  // 4. Isolate the item name
  let name = cleaned
  if (qtyMatch) name = name.replace(qtyMatch[0], '')
  if (priceMatch) name = name.replace(priceMatch[0], '')
  if (leadingNumMatch) name = name.replace(leadingNumMatch[0], '')
  
  // Remove standalone numbers at the end (like '20 50 1000') to isolate the name
  const trailingNumsMatch = name.match(/[\s\d.,]+$/)
  if (trailingNumsMatch) {
    const nums = trailingNumsMatch[0].trim().split(/\s+/)
    // Heuristic: if we see multiple numbers at the end, it might be Price, Qty, Total
    if (nums.length >= 2 && !price && quantity === 1) {
      price = parseFloat(nums[0])
      quantity = parseInt(nums[1], 10) || 1
    } else if (nums.length >= 1 && !price) {
      price = parseFloat(nums[0])
    }
    name = name.replace(trailingNumsMatch[0], '')
  }

  name = name.replace(/[-–—]+/g, '').trim()

  // 5. Final validation: ignore lines that are too short or just special chars
  if (name.length < 3) return null
  if (/^[^a-zA-Z]+$/.test(name)) return null

  return { name: name || 'Item', quantity: quantity || 1, price: price || 0 }
}

function parseOcrTextToItems(text) {
  const lines = text.split(/\r?\n|\s{2,}/)
  const items = []
  for (const l of lines) {
    const it = parseLine(l)
    if (it && it.name) {
      items.push({ ...it, category: 'Uncategorized' })
    }
  }
  
  // Basic dedupe by name
  const merged = []
  for (const it of items) {
    const idx = merged.findIndex(m => m.name.toLowerCase() === it.name.toLowerCase())
    if (idx >= 0) {
      merged[idx].quantity += it.quantity || 0
      if (it.price && !merged[idx].price) merged[idx].price = it.price
    } else {
      merged.push(it)
    }
  }
  return merged.slice(0, 50)
}

module.exports = { parseOcrTextToItems }