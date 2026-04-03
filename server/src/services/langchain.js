// Simple keyword-based product categorizer (no OpenAI/LangChain needed)

const CATEGORY_KEYWORDS = {
  Dairy: ['milk', 'cheese', 'butter', 'yogurt', 'curd', 'paneer', 'cream', 'ghee', 'whey'],
  Snacks: ['chips', 'lays', 'kurkure', 'biscuit', 'cookie', 'cracker', 'popcorn', 'nachos', 'wafer', 'snack', 'namkeen', 'peanut', 'cashew', 'almond', 'nuts'],
  Beverages: ['cola', 'pepsi', 'coke', 'sprite', 'fanta', 'juice', 'water', 'soda', 'tea', 'coffee', 'drink', 'energy', 'redbull', 'monster', 'beer', 'wine', 'lassi', 'shake'],
  'Personal Care': ['soap', 'shampoo', 'toothpaste', 'toothbrush', 'lotion', 'cream', 'deodorant', 'razor', 'tissue', 'sanitizer', 'face wash', 'body wash', 'perfume', 'comb'],
  Household: ['detergent', 'cleaner', 'mop', 'broom', 'brush', 'bucket', 'bleach', 'towel', 'sponge', 'trash bag', 'garbage', 'bulb', 'battery', 'candle', 'matchbox'],
  Electronics: ['charger', 'cable', 'earphone', 'headphone', 'speaker', 'usb', 'adapter', 'mouse', 'keyboard', 'phone', 'tablet', 'laptop', 'camera', 'watch', 'clock'],
  Produce: ['apple', 'banana', 'orange', 'mango', 'grape', 'onion', 'tomato', 'potato', 'carrot', 'spinach', 'cucumber', 'lemon', 'ginger', 'garlic', 'chili', 'capsicum', 'brinjal', 'cabbage', 'cauliflower', 'fruit', 'vegetable'],
  Bakery: ['bread', 'cake', 'pastry', 'muffin', 'donut', 'croissant', 'bun', 'roll', 'pie', 'pizza', 'naan', 'roti', 'pav'],
  Pantry: ['rice', 'flour', 'sugar', 'salt', 'oil', 'spice', 'masala', 'dal', 'lentil', 'pasta', 'noodle', 'sauce', 'ketchup', 'vinegar', 'pickle', 'jam', 'honey', 'cereal', 'oats', 'atta', 'maida', 'besan'],
  Pharmacy: ['medicine', 'tablet', 'syrup', 'bandage', 'cotton', 'thermometer', 'vitamin', 'painkiller', 'antibiotic', 'ointment', 'drops', 'capsule'],
  Stationery: ['pen', 'pencil', 'eraser', 'notebook', 'paper', 'stapler', 'tape', 'glue', 'marker', 'highlighter', 'ruler', 'scissors', 'folder', 'envelope'],
}

function isLLMConfigured() {
  return true // Always available since it's local
}

function categorizeProduct(name) {
  if (!name) return 'Uncategorized'
  const lower = name.toLowerCase()
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category
      }
    }
  }
  return 'Other'
}

function summarizeSales(text) {
  // Simple local summary based on the data
  if (!text || text.trim().length === 0) return 'No sales data available to summarize.'
  
  const lines = text.split('\n').filter(l => l.trim())
  const summary = [
    `• Total of ${lines.length} data points analyzed.`,
    `• Sales activity detected across the recorded period.`,
    `• Review individual transactions for detailed insights.`,
  ]
  return summary.join('\n')
}

module.exports = { isLLMConfigured, categorizeProduct, summarizeSales }
