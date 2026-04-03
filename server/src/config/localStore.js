const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'db.json')

// In-memory data
let store = {
  products: [],
  customers: [],
  vendors: [],
  transactions: [],
  uploads: [],
  meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 }
}

// Snapshot listeners per collection
const listeners = {}

// Load data from disk
function loadFromDisk() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      // Merge with defaults so new collections are always present
      store = { ...store, ...parsed }
      console.log('[LocalStore] Loaded data from', DB_PATH)
    } else {
      saveToDisk()
      console.log('[LocalStore] Created new database at', DB_PATH)
    }
  } catch (e) {
    console.error('[LocalStore] Failed to load DB:', e.message)
    saveToDisk()
  }
}

// Save data to disk
function saveToDisk() {
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    store.meta.updatedAt = new Date().toISOString()
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8')
  } catch (e) {
    console.error('[LocalStore] Failed to save DB:', e.message)
  }
}

// Notify listeners for a collection
function notifyListeners(collectionName) {
  const cbs = listeners[collectionName]
  if (!cbs || cbs.length === 0) return
  const docs = (store[collectionName] || []).map(doc => ({
    id: doc.id,
    data: () => ({ ...doc, id: undefined }),
    ...doc,
  }))
  const snapshot = {
    docs: docs.map(d => ({
      id: d.id,
      data: () => {
        const copy = { ...d }
        delete copy.id
        delete copy.data
        return copy
      },
      exists: true,
    })),
  }
  for (const cb of cbs) {
    try { cb(snapshot) } catch (e) { console.error('[LocalStore] Listener error:', e.message) }
  }
}

// ─── Query Builder ───────────────────────────────────────────────
class QueryBuilder {
  constructor(collectionName) {
    this._col = collectionName
    this._filters = []
    this._orderField = null
    this._orderDir = 'asc'
    this._limitN = null
  }

  where(field, op, value) {
    const q = this._clone()
    q._filters.push({ field, op, value })
    return q
  }

  orderBy(field, dir = 'asc') {
    const q = this._clone()
    q._orderField = field
    q._orderDir = dir
    return q
  }

  limit(n) {
    const q = this._clone()
    q._limitN = n
    return q
  }

  async get() {
    let items = [...(store[this._col] || [])]

    // Apply filters
    for (const f of this._filters) {
      items = items.filter(item => {
        const val = item[f.field]
        switch (f.op) {
          case '==': return val === f.value
          case '!=': return val !== f.value
          case '>': return val > f.value
          case '>=': return val >= f.value
          case '<': return val < f.value
          case '<=': return val <= f.value
          default: return true
        }
      })
    }

    // Apply ordering
    if (this._orderField) {
      const dir = this._orderDir === 'desc' ? -1 : 1
      items.sort((a, b) => {
        const av = a[this._orderField]
        const bv = b[this._orderField]
        if (av == null && bv == null) return 0
        if (av == null) return dir
        if (bv == null) return -dir
        if (av < bv) return -dir
        if (av > bv) return dir
        return 0
      })
    }

    // Apply limit
    if (this._limitN && this._limitN > 0) {
      items = items.slice(0, this._limitN)
    }

    return {
      docs: items.map(item => ({
        id: item.id,
        exists: true,
        data: () => {
          const copy = { ...item }
          delete copy.id
          return copy
        },
      })),
      empty: items.length === 0,
      size: items.length,
    }
  }

  onSnapshot(callback, errorCallback) {
    // Initial snapshot
    this.get().then(snap => {
      try { callback(snap) } catch (e) { if (errorCallback) errorCallback(e) }
    })

    // Register listener
    if (!listeners[this._col]) listeners[this._col] = []
    const wrapped = () => {
      this.get().then(snap => {
        try { callback(snap) } catch (e) { if (errorCallback) errorCallback(e) }
      })
    }
    listeners[this._col].push(wrapped)

    // Return unsubscribe
    return () => {
      const idx = listeners[this._col]?.indexOf(wrapped)
      if (idx >= 0) listeners[this._col].splice(idx, 1)
    }
  }

  _clone() {
    const q = new QueryBuilder(this._col)
    q._filters = [...this._filters]
    q._orderField = this._orderField
    q._orderDir = this._orderDir
    q._limitN = this._limitN
    return q
  }
}

// ─── Document reference ──────────────────────────────────────────
class DocRef {
  constructor(collectionName, docId) {
    this._col = collectionName
    this.id = docId
  }

  async get() {
    const items = store[this._col] || []
    const item = items.find(i => i.id === this.id)
    if (!item) {
      return { id: this.id, exists: false, data: () => undefined }
    }
    return {
      id: item.id,
      exists: true,
      data: () => {
        const copy = { ...item }
        delete copy.id
        return copy
      },
    }
  }

  async set(data) {
    if (!store[this._col]) store[this._col] = []
    const existing = store[this._col].findIndex(i => i.id === this.id)
    if (existing >= 0) {
      store[this._col][existing] = { id: this.id, ...data }
    } else {
      store[this._col].push({ id: this.id, ...data })
    }
    saveToDisk()
    notifyListeners(this._col)
  }

  async update(data) {
    if (!store[this._col]) store[this._col] = []
    const existing = store[this._col].findIndex(i => i.id === this.id)
    if (existing >= 0) {
      store[this._col][existing] = { ...store[this._col][existing], ...data }
      saveToDisk()
      notifyListeners(this._col)
    } else {
      throw new Error(`Document ${this.id} not found in ${this._col}`)
    }
  }

  async delete() {
    if (!store[this._col]) return
    store[this._col] = store[this._col].filter(i => i.id !== this.id)
    saveToDisk()
    notifyListeners(this._col)
  }
}

// ─── Collection reference ────────────────────────────────────────
class CollectionRef extends QueryBuilder {
  constructor(collectionName) {
    super(collectionName)
  }

  doc(id) {
    const docId = id || uuidv4()
    return new DocRef(this._col, docId)
  }

  async add(data) {
    const id = uuidv4()
    if (!store[this._col]) store[this._col] = []
    store[this._col].push({ id, ...data })
    saveToDisk()
    notifyListeners(this._col)
    return new DocRef(this._col, id)
  }
}

// ─── Database facade (mimics admin.firestore()) ──────────────────
class LocalDatabase {
  collection(name) {
    return new CollectionRef(name)
  }
}

// ─── Batch (mimics Firestore batch) ──────────────────────────────
class LocalBatch {
  constructor() {
    this._ops = []
  }

  set(docRef, data) {
    this._ops.push({ type: 'set', ref: docRef, data })
  }

  update(docRef, data) {
    this._ops.push({ type: 'update', ref: docRef, data })
  }

  delete(docRef) {
    this._ops.push({ type: 'delete', ref: docRef })
  }

  async commit() {
    for (const op of this._ops) {
      switch (op.type) {
        case 'set': await op.ref.set(op.data); break
        case 'update': await op.ref.update(op.data); break
        case 'delete': await op.ref.delete(); break
      }
    }
  }
}

// ─── Initialize ──────────────────────────────────────────────────
loadFromDisk()

const localDb = new LocalDatabase()

module.exports = { localDb, LocalBatch, store }
