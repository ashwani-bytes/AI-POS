require('dotenv').config()
const { performGeminiOcr } = require('./src/services/gemini')
const fs = require('fs')

async function test() {
  const images = fs.readdirSync('..').filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
  if (images.length === 0) {
    console.log("No images found to test.")
    return
  }
  const target = '../' + images[0]
  console.log("Testing with image:", target)
  const result = await performGeminiOcr(target)
  console.log(JSON.stringify(result, null, 2))
}
test()
