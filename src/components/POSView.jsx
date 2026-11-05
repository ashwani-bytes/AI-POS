import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Trash2, 
  Camera, 
  Search, 
  Printer, 
  Tag, 
  Check, 
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Banknote,
  RotateCcw
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'

function calculateTotalsManual(cartData, discount, taxRate) {
  const s = cartData.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0)
  const d = Math.max(0, Math.min(s, Number(discount) || 0))
  const tx = Math.max(0, s - d) * (Number(taxRate) || 0)
  const tt = Math.max(0, s - d) + tx
  return {
    subtotal: Math.round(s * 100) / 100,
    discountAmt: Math.round(d * 100) / 100,
    tax: Math.round(tx * 100) / 100,
    total: Math.round(tt * 100) / 100
  }
}

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
  'General'
]

const POSView = () => {
  const { t } = useTheme()
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cart')
      const parsed = saved ? JSON.parse(saved) : []
      return parsed.map(item => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        cartItemId: item.cartItemId || `${Date.now()}_${Math.random()}`
      }))
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart))
  }, [cart])

  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0.18)
  const [uploading, setUploading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [generalSettings, setGeneralSettings] = useState(null)
  const [toast, setToast] = useState({ type: 'info', message: '' })
  const [mobileTab, setMobileTab] = useState('products')
  const [txnRef, setTxnRef] = useState('')

  useEffect(() => {
    if (showCheckoutModal) {
      setTxnRef(`TXN${Date.now().toString().slice(-6)}`)
    }
  }, [showCheckoutModal])

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => {
      setToast(prev => prev.message === message ? { type: 'info', message: '' } : prev)
    }, 5000)
  }

  const getTotals = (cartData = cart) => calculateTotalsManual(cartData, discount, taxRate)

  async function fetchGeneralSettings() {
    try {
      const res = await api.get('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setGeneralSettings(data)
        if (data.taxRate !== undefined && data.taxRate !== null && data.taxRate !== '') {
          setTaxRate(Number(data.taxRate) / 100)
        }
      }
    } catch (error) {
      console.error('Failed to fetch general settings', error)
    }
  }

  async function fetchProducts() {
    try {
      const response = await api.get('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  function addToCart(product) {
    const existing = cart.find(item => item.productId && item.productId === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        cartItemId: `${Date.now()}_${Math.random()}`,
        productId: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: 1
      }])
    }
  }

  function updateQuantity(cartItemId, quantity) {
    const num = Number(quantity)
    if (num <= 0) {
      removeFromCart(cartItemId)
    } else {
      setCart(cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: num } : item
      ))
    }
  }

  function removeFromCart(cartItemId) {
    setCart(cart.filter(item => item.cartItemId !== cartItemId))
  }

  function clearCart() {
    if (cart.length === 0) return
    if (confirm('Clear entire cart?')) {
      setCart([])
      setDiscount(0)
    }
  }

  function applyDiscountPreset(val, isPercentage = false) {
    const s = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0)
    if (isPercentage) {
      setDiscount(Math.round((s * (val / 100)) * 100) / 100)
    } else {
      setDiscount(Math.min(s, val))
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('mode', 'sale')
    formData.append('image', file)

    try {
      const response = await api.postFormData('/api/upload', formData)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}`
        showToast('error', `OCR Error: ${errorMsg}`)
        return
      }

      if (data.warning) {
        showToast('warning', data.warning)
      }

      if (data.items && data.items.length > 0) {
        const newItems = data.items.map(item => ({
          cartItemId: `${Date.now()}_${Math.random()}`,
          productId: item.productId || null,
          name: item.name || 'Scanned Item',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        }))
        setCart(prev => [...prev, ...newItems])
        showToast('success', `Added ${data.items.length} items from scanned bill!`)
      } else if (!data.warning) {
        showToast('info', 'No items interpreted from bill')
      }
    } catch (error) {
      showToast('error', 'Failed to process image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      showToast('warning', 'Cart is empty')
      return
    }
    await fetchGeneralSettings()
    setShowCheckoutModal(true)
  }

  async function finalizeTransaction() {
    const { total, discountAmt } = getTotals()
    setCheckingOut(true)
    try {
      const response = await api.post('/api/transactions', {
        items: cart,
        discount: discountAmt,
        taxRate,
        payments: [{ method: paymentMethod, amount: total }]
      })
      if (response.ok) {
        showToast('success', 'Sale completed & receipt generated!')
        setTimeout(() => {
          window.print()
          setCart([])
          setDiscount(0)
          setShowCheckoutModal(false)
          fetchProducts()
        }, 300)
      } else {
        const errData = await response.json().catch(() => ({}))
        const errorMsg = errData?.error || `Checkout failed (HTTP ${response.status})`
        showToast('error', errorMsg)
      }
    } catch (error) {
      showToast('error', 'Checkout failed: Connection error')
    } finally {
      setCheckingOut(false)
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

  useEffect(() => {
    fetchProducts()
    fetchGeneralSettings()
  }, [])

  const { subtotal, discountAmt, tax, total } = getTotals()

  return (
    <>
      <LoadingBar active={uploading || checkingOut} label={(uploading && 'AI Parsing Bill Receipt...') || (checkingOut && 'Logging Transaction & Updating Stock...') || ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-20">
        <button 
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-3.5 text-xs font-extrabold uppercase tracking-wider transition-all ${mobileTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Catalog ({filteredProducts.length})
        </button>
        <button 
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3.5 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'cart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart ({cart.length}) - ₹{total.toFixed(2)}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        {/* Catalog Section */}
        <div className={`flex-1 p-5 lg:p-7 overflow-y-auto custom-scrollbar flex flex-col ${mobileTab !== 'products' && 'hidden lg:flex'}`}>
          {/* Top Search & OCR Scan Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by title or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition text-base font-semibold shadow-sm"
              />
            </div>

            <label className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl cursor-pointer flex items-center justify-center gap-2.5 transition-all shadow-md shadow-blue-500/25 shrink-0 font-bold text-base active:scale-95">
              <Camera className="w-5 h-5" />
              <span>{uploading ? 'Analyzing...' : 'AI Bill Scan'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 custom-scrollbar mb-4 shrink-0">
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

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 lg:pb-6">
            {filteredProducts.map((product) => {
              const stockNum = Number(product.quantity || 0)
              const isOutOfStock = stockNum <= 0
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-2xl hover:border-blue-600 transition-all duration-200 text-left shadow-md hover:shadow-lg group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-md truncate max-w-[130px]">
                        {product.category || 'General'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        isOutOfStock 
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30' 
                          : stockNum < 5 
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isOutOfStock ? 'Empty' : `${stockNum} left`}
                      </span>
                    </div>
                    <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">
                      ₹{Number(product.price || 0).toFixed(2)}
                    </p>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Enhanced Modern Cart Panel */}
        <div className={`w-full lg:w-[420px] bg-white dark:bg-slate-900 border-l-2 border-slate-300 dark:border-slate-800 p-5 lg:p-6 flex flex-col h-full shadow-2xl shrink-0 ${mobileTab !== 'cart' && 'hidden lg:flex'}`}>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">Register Cart</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
              {cart.length > 0 && (
                <button onClick={clearCart} className="p-1.5 text-slate-500 hover:text-red-500 transition" title="Clear Cart">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-3.5 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                <ShoppingBag className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-2.5" />
                <p className="text-slate-800 dark:text-slate-200 text-base font-bold">Cart is currently empty</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tap products or scan a bill to start checkout.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartItemId} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5 transition-all">
                  <div className="flex justify-between items-start gap-2.5">
                    <span className="font-black text-base leading-snug line-clamp-1 text-slate-900 dark:text-white">{item.name}</span>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-500 hover:text-red-500 transition shrink-0 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-sm">
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-blue-600 font-black text-base">-</button>
                      <span className="px-3 text-sm font-black text-slate-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-blue-600 font-black text-base">+</button>
                    </div>
                    <span className="font-black text-base text-slate-900 dark:text-white">
                      ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Discount Presets & Calculations */}
          <div className="space-y-3.5 pt-4 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 -mx-5 -mb-5 p-5 rounded-b-2xl">
            {/* Quick Discount Chips */}
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
                Quick Discount Chips
              </span>
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button onClick={() => applyDiscountPreset(0)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600 shadow-sm">
                  None
                </button>
                <button onClick={() => applyDiscountPreset(5, true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600 shadow-sm">
                  5%
                </button>
                <button onClick={() => applyDiscountPreset(10, true)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600 shadow-sm">
                  10%
                </button>
                <button onClick={() => applyDiscountPreset(50)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600 shadow-sm">
                  ₹50
                </button>
                <button onClick={() => applyDiscountPreset(100)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-600 shadow-sm">
                  ₹100
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-sm md:text-base">
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold">
                <span>Discount</span>
                <span className="font-bold">-₹{discountAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>GST ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-3 border-t-2 border-slate-200 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white">Total Payable</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-black text-base tracking-wide uppercase shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all active:scale-95"
            >
              {checkingOut ? 'Finalizing...' : `Proceed to Pay ₹${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* --- CHECKOUT MODAL --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Checkout & Invoice Settlement</h2>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid lg:grid-cols-2 gap-8 custom-scrollbar">
              {/* Thermal Invoice Visualizer */}
              <div className="bg-slate-100 dark:bg-slate-950 p-5 rounded-2xl flex flex-col items-center border-2 border-slate-300 dark:border-slate-800">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-3">Live Thermal Receipt Preview</span>
                <div id="receipt-visualizer" className="bg-white p-6 shadow-md text-gray-900 w-full max-w-[340px] rounded-xl border-2 border-gray-300" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-black uppercase tracking-wider">{generalSettings?.storeName || 'AI POS STORE'}</h3>
                    <p className="whitespace-pre-wrap text-xs text-gray-700 mt-1 font-semibold">{generalSettings?.storeAddress}</p>
                    {generalSettings?.phone && <p className="text-xs text-gray-700 font-semibold">Tel: {generalSettings.phone}</p>}
                    <div className="mt-2.5 border-y-2 border-gray-400 py-1.5 font-black text-xs">TAX INVOICE - {txnRef}</div>
                  </div>

                  <table className="w-full mb-4 text-xs">
                    <thead className="border-b-2 border-gray-400">
                      <tr>
                        <th className="text-left py-1 font-black">ITEM</th>
                        <th className="text-center font-black">QTY</th>
                        <th className="text-right font-black">AMT</th>
                      </tr>
                    </thead>
                    <tbody className="border-b-2 border-gray-400">
                      {cart.map(item => (
                        <tr key={item.cartItemId}>
                          <td className="py-1 truncate max-w-[130px] font-bold">{item.name}</td>
                          <td className="text-center font-black">{item.quantity}</td>
                          <td className="text-right font-black">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="space-y-1.5 w-full max-w-[210px] ml-auto text-xs">
                    <div className="flex justify-between font-medium"><span>Subtotal:</span><span className="font-bold">₹{subtotal.toFixed(2)}</span></div>
                    {discountAmt > 0 && <div className="flex justify-between text-red-600 font-bold"><span>Discount:</span><span className="font-black">-₹{discountAmt.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-medium"><span>GST ({(taxRate * 100).toFixed(0)}%):</span><span className="font-bold">₹{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black border-t-2 border-gray-400 pt-1.5 mt-1 text-sm">
                      <span>TOTAL:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center text-xs mt-6 pt-3 border-t-2 border-dashed border-gray-400 text-gray-700 font-bold">
                    {generalSettings?.receiptFooter || 'Thank you for shopping with us!'}
                  </div>
                </div>
              </div>

              {/* Payment Processing & Dynamic QR */}
              <div className="space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-3">Choose Payment Mode</h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-500/15' : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'}`}
                    >
                      <Banknote className={`w-8 h-8 ${paymentMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className={`text-sm md:text-base font-black ${paymentMethod === 'cash' ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>Cash Register</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'upi' ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/15' : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'}`}
                    >
                      <Smartphone className={`w-8 h-8 ${paymentMethod === 'upi' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-sm md:text-base font-black ${paymentMethod === 'upi' ? 'text-blue-800 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>Dynamic UPI QR</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-800 flex flex-col items-center animate-fade-in space-y-3.5 shadow-sm">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Pre-filled UPI QR (Scan to Pay)</span>
                    {generalSettings?.upiId ? (
                      <div className="p-3.5 bg-white rounded-2xl shadow-md border-2 border-slate-300">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            `upi://pay?pa=${generalSettings.upiId.trim()}&pn=${encodeURIComponent(generalSettings?.storeName || 'Store')}&am=${total.toFixed(2)}&cu=INR&tn=Bill ${txnRef}&tr=${txnRef}`
                          )}`} 
                          alt="QR Code"
                          className="w-44 h-44"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-red-600">Configure your UPI ID in Store Settings to enable QR.</p>
                    )}
                    <div className="text-center">
                      <p className="font-black text-3xl text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Reference: {txnRef}</p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-7 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-2 border-emerald-300 dark:border-emerald-500/30 text-center animate-fade-in">
                    <p className="text-emerald-800 dark:text-emerald-300 font-black text-base md:text-lg">Collect Cash From Customer</p>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">₹{total.toFixed(2)}</p>
                    <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-semibold mt-2">Cash drawer total will update automatically upon confirmation.</p>
                  </div>
                )}

                <div className="flex gap-3.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-3.5 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-base border-2 border-slate-300 dark:border-slate-700">
                    Cancel
                  </button>
                  <button 
                    onClick={finalizeTransaction}
                    disabled={checkingOut}
                    className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
                  >
                    {checkingOut ? 'Recording...' : `Confirm & Print Bill (₹${total.toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default POSView
