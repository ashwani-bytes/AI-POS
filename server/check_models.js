require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: listModels is usually on the genAI object or requires a specific call
    // In @google/generative-ai, there isn't a direct listModels but we can try common ones
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'];
    
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        // Try a tiny prompt
        const res = await model.generateContent("hi");
        console.log(`Model ${m} is AVAILABLE. Response: ${res.response.text()}`);
      } catch (err) {
        console.log(`Model ${m} is NOT available. Error: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

listModels();
