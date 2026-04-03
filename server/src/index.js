require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const path = require('path')

const { ensureFirebaseInitialized } = require('./config/firebase')
const auth = require('./middleware/auth')

const productsRouter = require('./routes/products')
const customersRouter = require('./routes/customers')
const vendorsRouter = require('./routes/vendors')
const transactionsRouter = require('./routes/transactions')
const uploadRouter = require('./routes/upload')
const reportsRouter = require('./routes/reports')
const streamRouter = require('./routes/stream')
const authRouter = require('./routes/auth')
const settingsRouter = require('./routes/settings')

const app = express()

// Initialize local store
ensureFirebaseInitialized()

// Security & performance middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(compression())
const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 })
app.use(limiter)

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://ai-pos-one.vercel.app"
];

// Add CORS_ORIGIN from .env (comma-separated)
if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

// Add FRONTEND_URL from environment if available
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Parsers & logging
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, '..', 'uploads')
app.use('/uploads', express.static(uploadsDir))

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'firebase' }))
app.get('/api/health/db', async (req, res) => {
  try {
    const { db } = require('./config/firebase')
    await db().collection('products').limit(1).get()
    res.json({ status: 'ok', projectId: process.env.FIREBASE_PROJECT_ID || 'unknown' })
  } catch (e) {
    console.error('DB health error:', e)
    res.status(500).json({ status: 'error', details: e?.message })
  }
})

// Auth session endpoints (unprotected)
app.use('/api/auth', authRouter)

// Protected APIs
app.use('/api/products', auth, productsRouter)
app.use('/api/customers', auth, customersRouter)
app.use('/api/vendors', auth, vendorsRouter)
app.use('/api/transactions', auth, transactionsRouter)
app.use('/api/upload', auth, uploadRouter)
app.use('/api/reports', auth, reportsRouter)
app.use('/api/stream', auth, streamRouter)
app.use('/api/settings', auth, settingsRouter)

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`✅ AI POS server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try one of the following:`)
    console.error(`  1. Stop the process using port ${PORT}`)
    console.error(`  2. Set a different PORT in your .env file`)
    process.exit(1)
  } else {
    throw err
  }
})
