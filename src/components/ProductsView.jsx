import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Search, Camera, AlertTriangle, Package, Layers, CheckCircle2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'
import { compressImage } from '../lib/image'

const CATEGORIES = [
  'All',
  'Dairy',
  'Snacks',
  'Beverages',
  'Produce',
  'Bakery',
  'Pantry',
  'Personal Care',
  'Stationery',
  'Uncategorized'
]

const ProductsView = () => {
  const { t } = useTheme()
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    price: '',
    quantity: '',
    category: 'Uncategorized'
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState({ type: 'info', message: '' })

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(prev => prev.message === message ? { type: 'info', message: '' } : prev)
    }, 5000)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      } else {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data?.error || `HTTP ${response.status}`
        showToast('error', `Failed to load products: ${errorMsg}`)
      }
    } catch (error) {
      showToast('error', 'Failed to fetch products from backend.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('warning', 'Product name is required')
      return
    }

    const path = editingProduct
      ? `/api/products/${editingProduct.id}`
      : '/api/products'

    setSaving(true)
    try {
      const body = {
        name: formData.name.trim(),
        cost: Number(formData.cost) || 0,
        price: Number(formData.price) || 0,
        quantity: Number(formData.quantity) || 0,
        category: formData.category ? formData.category.trim() : 'Uncategorized'
      }

      const response = editingProduct
        ? await api.put(path, body)
        : await api.post(path, body)

      if (response.ok) {
        await fetchProducts()
        setShowModal(false)
        resetForm()
        showToast('success', editingProduct ? 'Product updated' : 'Product created')
      } else {
        const data = await response.json().catch(() => ({}))
        showToast('error', data?.error || 'Save failed')
      }
    } catch (error) {
      showToast('error', 'Connection error saving product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product permanently?')) return

    try {
      const response = await api.delete(`/api/products/${id}`)
      if (response.ok) {
        await fetchProducts()
        setSelectedProducts(prev => prev.filter(pId => pId !== id))
        showToast('success', 'Product deleted')
      } else {
        showToast('error', 'Failed to delete product')
      }
    } catch (error) {
      showToast('error', 'Failed to delete product')
    }
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      cost: product.cost !== null && product.cost !== undefined ? String(product.cost) : '',
      price: product.price !== null && product.price !== undefined ? String(product.price) : '',
      quantity: product.quantity !== null && product.quantity !== undefined ? String(product.quantity) : '',
      category: product.category || 'Uncategorized'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      cost: '',
      price: '',
      quantity: '',
      category: 'Uncategorized'
    })
  }

  const handleToggleSelectProduct = (id, checked) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, id])
    } else {
      setSelectedProducts(prev => prev.filter(productId => productId !== id))
    }
  }

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    if (!confirm(`Delete ${selectedProducts.length} selected products?`)) return

    setSaving(true)
    try {
      const deletePromises = selectedProducts.map(id => api.delete(`/api/products/${id}`))
      const responses = await Promise.all(deletePromises)
      if (responses.every(r => r.ok)) {
        showToast('success', `Deleted ${selectedProducts.length} products`)
      } else {
        showToast('warning', 'Some products could not be deleted')
      }
      setSelectedProducts([])
      await fetchProducts()
    } catch (error) {
      showToast('error', 'Bulk delete encountered an issue')
      await fetchProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const rawFile = e.target.files?.[0]
    if (!rawFile) return

    setUploading(true)
    try {
      const file = await compressImage(rawFile)
      const formData = new FormData()
      formData.append('mode', 'restock')
      formData.append('image', file)

      const response = await api.postFormData('/api/upload', formData)
      const data = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        showToast('error', `OCR failed: ${data?.error || response.statusText}`)
        return
      }
      if (data.warning) showToast('warning', data.warning)

      if (data.items && data.items.length > 0) {
        const invMsg = data.productsAdded ? `Restocked ${data.productsAdded} product(s).` : 'Scanned items processed.'
        showToast('success', `Bill parsed! ${invMsg}`)
        await fetchProducts()
      } else if (!data.warning) {
        showToast('info', 'No items detected from the bill')
      }
    } catch (error) {
      showToast('error', 'Failed to process image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || 
        (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  const outOfStockProducts = products.filter(p => Number(p.quantity || 0) <= 0)
  const lowStockProducts = products.filter(p => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) < 5)
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-7xl mx-auto pb-28">
      <LoadingBar active={saving} label={saving ? (editingProduct ? 'Updating product...' : 'Creating product...') : ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />

      {/* Catalog KPI Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md space-y-1.5 transition-all">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Catalog Items</span>
          <p className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400">{products.length}</p>
          <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-semibold block">Total registered SKU items</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md space-y-1.5 transition-all">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Total Inventory Units</span>
          <p className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400">{totalStockUnits}</p>
          <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-semibold block">Available across all shelves</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md space-y-1.5 transition-all">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Low Stock Warnings</span>
          <p className="text-3xl md:text-4xl font-black text-amber-600 dark:text-amber-400">{lowStockProducts.length}</p>
          <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-semibold block">Under 5 units remaining</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md space-y-1.5 transition-all">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">Critically Sold Out</span>
          <p className="text-3xl md:text-4xl font-black text-red-600 dark:text-red-400">{outOfStockProducts.length}</p>
          <span className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-semibold block">Needs vendor purchase order</span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Inventory Catalog</h1>
          <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">Manage retail pricing, supply cost, and live warehouse inventory.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none px-5 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-sm md:text-base font-bold transition shadow-sm active:scale-95">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{uploading ? 'Parsing...' : 'Restock Via Bill Scan'}</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
          </label>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-sm md:text-base font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="p-4 md:p-5 rounded-2xl border-2 border-amber-400 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-amber-900 dark:text-amber-300">Inventory Alert</h3>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mt-0.5">
                {outOfStockProducts.length} item(s) are completely empty, and {lowStockProducts.length} item(s) are running critically low.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
            <span className="text-amber-900 dark:text-amber-300 font-bold">Items:</span>
            <span className="text-amber-900 dark:text-amber-200 truncate max-w-sm font-medium">
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 4).map(p => p.name).join(', ')}...
            </span>
          </div>
        </div>
      )}

      {/* Search & Category Filter Pills */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition text-base font-semibold shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Select All & Bulk Actions */}
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-slate-900 dark:text-slate-200 select-none">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
            onChange={(e) => handleToggleSelectAll(e.target.checked)}
          />
          <span className="text-sm font-bold">{selectedProducts.length > 0 ? `${selectedProducts.length} items selected` : 'Select All'}</span>
        </label>

        {selectedProducts.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected ({selectedProducts.length})</span>
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product) => {
          const isSelected = selectedProducts.includes(product.id)
          const stockNum = Number(product.quantity || 0)
          const isOutOfStock = stockNum <= 0
          return (
            <div 
              key={product.id} 
              className={`p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between shadow-md hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' 
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 shrink-0"
                      checked={isSelected}
                      onChange={(e) => handleToggleSelectProduct(product.id, e.target.checked)}
                    />
                    <h3 className="font-black text-base md:text-lg truncate leading-snug text-slate-900 dark:text-white">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEditModal(product)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition" title="Edit Product">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition" title="Delete Product">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 truncate max-w-[140px]">
                    {product.category || 'General'}
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    isOutOfStock 
                      ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30' 
                      : stockNum < 5 
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isOutOfStock ? 'Sold Out' : `${stockNum} units`}
                  </span>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between items-center text-xs md:text-sm font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Cost Price</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{Number(product.cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-900 dark:text-slate-200 text-xs md:text-sm font-black uppercase">Retail Price</span>
                  <span className="font-black text-xl md:text-2xl text-blue-600 dark:text-blue-400">₹{Number(product.price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Product Title</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amul Butter 500g"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Dairy, Snacks, Beverages..."
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-black"
                  />
                </div>
                <div>
                  <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-black"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold transition text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-500/25 disabled:opacity-50 text-base"
                >
                  {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsView
