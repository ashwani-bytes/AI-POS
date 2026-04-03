import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Camera, AlertTriangle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'

const ProductsView = () => {
  const { t } = useTheme()
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
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
    }, 30000)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data?.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Failed to fetch products:', { status: response.status, data })
        showToast('error', `Failed to load products: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      const errorMsg = error.message || 'Failed to fetch products. Please check if the server is running.'
      showToast('error', errorMsg)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const path = editingProduct
      ? `/api/products/${editingProduct.id}`
      : '/api/products'

    setSaving(true)
    try {
      const body = {
        name: formData.name,
        cost: Number(formData.cost) || 0,
        price: Number(formData.price) || 0,
        quantity: Number(formData.quantity) || 0,
        category: formData.category
      }

      const response = editingProduct
        ? await api.put(path, body)
        : await api.post(path, body)

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        fetchProducts()
        setShowModal(false)
        resetForm()
        showToast('success', editingProduct ? 'Product updated' : 'Product created')
      } else {
        // Show detailed error message
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`
        console.error('Save product error:', { status: response.status, data, response })
        showToast('error', errorMsg)
      }
    } catch (error) {
      console.error('Save failed:', error)
      const errorMsg = error.message || 'Failed to save product. Please check your connection and try again.'
      showToast('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return

    try {
      const response = await api.delete(`/api/products/${id}`)

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        fetchProducts()
        showToast('success', 'Product deleted')
      } else {
        const msg = data?.error || 'Failed to delete product'
        showToast('error', msg)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      showToast('error', 'Failed to delete product')
    }
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      cost: product.cost || '',
      price: product.price || '',
      quantity: product.quantity || '',
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
      const allFilteredIds = filteredProducts.map(p => p.id)
      setSelectedProducts(allFilteredIds)
    } else {
      setSelectedProducts([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    if (!confirm(`Are you sure you want to completely delete ${selectedProducts.length} items?`)) return

    setSaving(true)
    try {
      const deletePromises = selectedProducts.map(id => api.delete(`/api/products/${id}`))
      await Promise.all(deletePromises)
      
      showToast('success', `Successfully deleted ${selectedProducts.length} products.`)
      setSelectedProducts([])
      fetchProducts()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      showToast('error', 'Failed to delete some items. Try refreshing.')
      fetchProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('mode', 'restock')
    formData.append('image', file)

    try {
      const response = await api.postFormData('/api/upload', formData)
      const data = await response.json().catch(() => ({}))
      
      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}`
        showToast('error', `Failed to process image: ${errorMsg}`)
        return
      }
      if (data.warning) showToast('warning', data.warning)

      if (data.items && data.items.length > 0) {
        const invMsg = data.productsAdded ? `Added ${data.productsAdded} product(s) to inventory.` : 'Items checked, but inventory was not magically updated.'
        showToast('success', `Bill scanned successfully! ${invMsg}`)
        fetchProducts()
      } else {
        showToast('info', 'No items detected from the uploaded bill')
      }
    } catch (error) {
      showToast('error', 'Failed to process image. Please check your connection.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const outOfStockProducts = products.filter(p => Number(p.quantity) <= 0)
  const lowStockProducts = products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) < 5)

  return (
    <div className="p-6">
      <LoadingBar active={saving} label={saving ? (editingProduct ? 'Updating product...' : 'Creating product...') : ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex space-x-3">
          <label className={`px-4 py-2 ${t.bgCard} border ${t.border} hover:border-blue-500 rounded-lg cursor-pointer flex items-center space-x-2`}>
            <Camera className="w-5 h-5" />
            <span>{uploading ? 'Processing...' : 'Scan Bill'}</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
          </label>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className={`px-4 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg flex items-center space-x-2`}
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* --- INVENTORY ALERT DASHBOARD --- */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="mb-8 p-5 rounded-xl border border-red-500/30 bg-red-500/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
          <div className="flex items-center space-x-2 text-red-500 mb-2">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <h2 className="text-xl font-bold uppercase tracking-wide">Critical Stock Alert</h2>
          </div>
          <p className="text-sm text-red-400 mb-5 font-semibold">Please contact your supplier immediately to restock the following items:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {outOfStockProducts.length > 0 && (
              <div className="bg-red-900/10 p-4 rounded-lg">
                <h3 className="font-bold text-red-500 mb-3 flex items-center gap-1 border-b border-red-500/20 pb-2">CRITICALLY EMPTY</h3>
                <ul className="text-sm space-y-2">
                  {outOfStockProducts.map(p => (
                    <li key={p.id} className="flex justify-between text-red-400 font-medium">
                      <span>• {p.name}</span>
                      <span className="bg-red-500/20 px-2 py-0.5 rounded font-mono font-bold text-red-500 shadow-sm">SOLD OUT</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="bg-yellow-900/10 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-500 mb-3 flex items-center gap-1 border-b border-yellow-500/20 pb-2">LOW STOCK (GOING SOON)</h3>
                <ul className="text-sm space-y-2">
                  {lowStockProducts.map(p => (
                    <li key={p.id} className="flex justify-between text-yellow-500 font-medium">
                      <span>• {p.name}</span>
                      <span className="bg-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold text-yellow-500 shadow-sm">{p.quantity} LEFT</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${t.input}`}
          />
        </div>
      </div>

      {/* Select All & Bulk Actions */}
      <div className="mb-4 flex items-center justify-between px-2">
        <label className="flex items-center space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
            onChange={(e) => handleToggleSelectAll(e.target.checked)}
          />
          <span className="font-semibold">
            {selectedProducts.length > 0 
              ? `${selectedProducts.length} item(s) selected`
              : 'Select All'}
          </span>
        </label>
        
        {selectedProducts.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete Selected</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`p-4 ${t.bgCard} border ${selectedProducts.includes(product.id) ? 'border-red-400 dark:border-red-500' : t.border} ${selectedProducts.includes(product.id) ? 'bg-red-50 dark:bg-red-900/10' : ''} rounded-lg transition-colors`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedProducts.includes(product.id)}
                  onChange={(e) => handleToggleSelectProduct(product.id, e.target.checked)}
                />
                <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
              </div>
              <div className="flex space-x-2 shrink-0">
                <button
                  onClick={() => openEditModal(product)}
                  className="text-blue-500 hover:text-blue-400"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className={`text-sm ${t.textSecondary} mb-3`}>{product.category}</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className={t.textSecondary}>Cost:</span>
                <span className="font-semibold">₹{product.cost?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className={t.textSecondary}>Price:</span>
                <span className="font-bold text-blue-500">₹{product.price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className={t.textSecondary}>Stock:</span>
                <span className={`font-semibold ${product.quantity < 10 ? 'text-red-500' : ''}`}>
                  {product.quantity || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${t.bgSecondary} rounded-lg p-6 w-full max-w-md`}>
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-2 ${t.textSecondary}`}>Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${t.textSecondary}`}>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className={`flex-1 py-2 ${t.bgCard} border ${t.border} rounded-lg hover:border-gray-500`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg disabled:opacity-60`}
                >
                  {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
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
