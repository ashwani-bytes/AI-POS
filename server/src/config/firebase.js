const admin = require('firebase-admin')

let initialized = false

function ensureFirebaseInitialized() {
  if (initialized) return
  if (admin.apps.length > 0) {
    initialized = true
    return
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (projectId && clientEmail && privateKey) {
    // 🛡️ Robust parsing for Render/Environment variables
    // 1. Strip surrounding quotes if they exist
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '')
    
    // 2. Handle both literal newlines and escaped \n strings
    privateKey = privateKey.replace(/\\n/g, '\n')
    
    // 3. Ensure headers exist (optional but defensive)
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
       console.warn('[Firebase] Private Key might be missing headers!')
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: `${projectId}.firebasestorage.app`,
    })
    console.log('[Firebase] Initialized with service account credentials')
    console.log('[Firebase] Project ID:', projectId)
  } else {
    // Fallback: try Application Default Credentials
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      })
      console.log('[Firebase] Initialized with application default credentials')
    } catch (e) {
      console.error('[Firebase] No credentials found! Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env')
      throw e
    }
  }

  initialized = true
}

function db() {
  ensureFirebaseInitialized()
  return admin.firestore()
}

function bucket() {
  ensureFirebaseInitialized()
  return admin.storage().bucket()
}

module.exports = { admin, ensureFirebaseInitialized, db, bucket }
