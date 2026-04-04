require('dotenv').config();
const { performGeminiOcr } = require('./src/services/gemini');
const path = require('path');
const fs = require('fs');

async function test() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);
  const imageFile = files.find(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp'));

  if (!imageFile) {
    console.log('No images found to test in ' + uploadsDir);
    return;
  }

  const imagePath = path.join(uploadsDir, imageFile);
  console.log('Testing Gemini OCR with file:', imagePath);

  try {
    const result = await performGeminiOcr(imagePath);
    console.log('OCR Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

test();
