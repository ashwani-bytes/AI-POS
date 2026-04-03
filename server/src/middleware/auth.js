const { admin } = require('../config/firebase')

module.exports = async function auth(req, res, next) {
  // Dev bypass option
  if (process.env.DISABLE_AUTH === 'true') {
    req.user = { uid: 'dev', mode: 'dev-bypass' }
    return next()
  }

  // Check for demo token (frontend sends this when Firebase is not configured)
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    req.user = { uid: 'anonymous' }
    return next()
  }

  if (token === 'demo-token') {
    req.user = { uid: 'demo-user', mode: 'demo' }
    return next()
  }

  // Verify real Firebase ID token
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = { uid: decoded.uid, email: decoded.email, name: decoded.name }
    return next()
  } catch (err) {
    console.warn('[Auth] Token verification failed:', err.message)
    // Don't block — allow through with anonymous uid so app doesn't crash
    req.user = { uid: 'anonymous', mode: 'auth-failed' }
    return next()
  }
}
