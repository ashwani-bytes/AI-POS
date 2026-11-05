import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
import { compressImage } from '../lib/image'
import ThermalReceipt from './ThermalReceipt'
import ReceiptPrintModal from './ReceiptPrintModal'
import { playPaymentSuccessSound } from '../lib/sound'

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
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [lastTransaction, setLastTransaction] = useState(null)

  useEffect(() => {
    if (showCheckoutModal) {
      setTxnRef(`TXN${Date.now().toString().slice(-6)}`)
    }
  }, [showCheckoutModal])

  // Live UPI Payment Auto-Detection: Polls every 1.5s for customer QR payment
  useEffect(() => {
    if (!showCheckoutModal || paymentMethod !== 'upi' || !txnRef || checkingOut) return

    let isSubscribed = true
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/payments/status/${txnRef}`)
        if (res.ok) {
          const data = await res.json()
          if (data?.status === 'confirmed' && isSubscribed) {
            clearInterval(pollInterval)
            playPaymentSuccessSound()
            showToast('success', 'UPI Payment Confirmed! Printing bill...')
            finalizeTransaction()
          }
        }
      } catch (err) {
        // Continue polling
      }
    }, 1500)

    return () => {
      isSubscribed = false
      clearInterval(pollInterval)
    }
  }, [showCheckoutModal, paymentMethod, txnRef, checkingOut])

  async function handleSimulateUpiPayment() {
    const { total } = getTotals()
    try {
      await api.post('/api/payments/confirm', {
        txnRef,
        amount: total,
        note: 'Cashier Confirmed UPI Payment'
      })
      playPaymentSuccessSound()
      showToast('success', 'UPI Payment Confirmed! Printing bill...')
      finalizeTransaction()
    } catch (e) {
      showToast('error', 'Failed to confirm payment')
    }
  }

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

  function updateItemPrice(cartItemId, newPrice) {
    const parsed = newPrice === '' ? 0 : parseFloat(newPrice)
    setCart(cart.map(item =>
      item.cartItemId === cartItemId ? { ...item, price: isNaN(parsed) ? 0 : Math.max(0, parsed) } : item
    ))
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
    const rawFile = e.target.files?.[0]
    if (!rawFile) return

    setUploading(true)
    try {
      // 1) Fast client-side image compression: reduces 10MB to ~400KB in 50ms
      const file = await compressImage(rawFile)

      const formData = new FormData()
      formData.append('mode', 'sale')
      formData.append('image', file)

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
        const cleanStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

        const newItems = data.items.map(item => {
          let resolvedPrice = Number(item.price) || 0
          const itemClean = cleanStr(item.name)

          // Auto-resolve against loaded store catalog if scanned price is 0 or unassigned
          const catalogProd = products.find(p => {
            if (item.productId && p.id === item.productId) return true
            const prodClean = cleanStr(p.name)
            return prodClean === itemClean || (itemClean.length > 3 && prodClean.includes(itemClean)) || (prodClean.length > 3 && itemClean.includes(prodClean))
          })

          if (catalogProd) {
            if (resolvedPrice <= 0 && Number(catalogProd.price) > 0) {
              resolvedPrice = Number(catalogProd.price)
            }
          }

          return {
            cartItemId: `${Date.now()}_${Math.random()}`,
            productId: item.productId || catalogProd?.id || null,
            name: catalogProd?.name || item.name || 'Scanned Item',
            price: resolvedPrice,
            quantity: Number(item.quantity) || 1
          }
        })

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
    const zeroPriceItems = cart.filter(i => (Number(i.price) || 0) <= 0)
    if (zeroPriceItems.length > 0) {
      showToast('warning', `Please enter a rate for: ${zeroPriceItems.map(i => i.name).slice(0, 2).join(', ')}${zeroPriceItems.length > 2 ? '...' : ''}`)
      return
    }
    await fetchGeneralSettings()
    setShowCheckoutModal(true)
  }

  async function finalizeTransaction() {
    const { total, discountAmt, subtotal, tax } = getTotals()
    setCheckingOut(true)
    try {
      const response = await api.post('/api/transactions', {
        items: cart,
        discount: discountAmt,
        taxRate,
        payments: [{ method: paymentMethod, amount: total }]
      })
      if (response.ok) {
        const createdTxn = await response.json().catch(() => null)
        const txnRecord = createdTxn || {
          id: txnRef,
          items: [...cart],
          discount: discountAmt,
          taxRate,
          tax,
          subtotal,
          total,
          payments: [{ method: paymentMethod, amount: total }],
          paymentMethod,
          createdAt: new Date().toISOString()
        }

        // Set last transaction and open thermal print modal
        setLastTransaction(txnRecord)
        setShowCheckoutModal(false)
        setShowPrintModal(true)
        setCart([])
        setDiscount(0)
        fetchProducts()
        showToast('success', 'Sale completed & thermal bill generated!')
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
        <div className={`flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto custom-scrollbar flex flex-col min-w-0 ${mobileTab !== 'products' && 'hidden lg:flex'}`}>
          {/* Top Search & OCR Scan Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by title or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition text-sm sm:text-base font-semibold shadow-sm"
              />
            </div>

            <label className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 shrink-0 font-black text-sm sm:text-base active:scale-95">
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
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
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

          {/* Products Grid - 2 columns on iPad/Tablets so cards have generous breathing room! */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 pb-24 lg:pb-6">
            {filteredProducts.map((product) => {
              const stockNum = Number(product.quantity || 0)
              const isOutOfStock = stockNum <= 0
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-2xl hover:border-blue-600 transition-all duration-200 text-left shadow-sm hover:shadow-lg group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-0.5 rounded-md truncate max-w-[100px] sm:max-w-[130px]">
                        {product.category || 'General'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                        isOutOfStock 
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30' 
                          : stockNum < 5 
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isOutOfStock ? 'Empty' : `${stockNum} left`}
                      </span>
                    </div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 break-words">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 gap-2">
                    <p className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0">
                      ₹{Number(product.price || 0).toFixed(2)}
                    </p>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Enhanced Modern Cart Panel - Scaled for iPad / Tablet */}
        <div className={`w-full lg:w-[340px] xl:w-[380px] 2xl:w-[420px] bg-white dark:bg-slate-900 border-l-2 border-slate-300 dark:border-slate-800 p-4 sm:p-5 lg:p-6 flex flex-col h-full shadow-2xl shrink-0 min-w-0 ${mobileTab !== 'cart' && 'hidden lg:flex'}`}>
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
              cart.map((item) => {
                const isZeroPrice = (Number(item.price) || 0) <= 0
                return (
                  <div 
                    key={item.cartItemId} 
                    className={`p-4 rounded-2xl space-y-2.5 transition-all border ${
                      isZeroPrice 
                        ? 'bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-800 ring-1 ring-red-400' 
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-base leading-snug truncate block text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        {isZeroPrice && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-black bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                            ⚠️ Enter Price / Rate
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-500 hover:text-red-500 transition shrink-0 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-blue-600 font-black text-base transition"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-black text-slate-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-blue-600 font-black text-base transition"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="font-black text-base text-slate-900 dark:text-white">
                          ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">@ ₹</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.00"
                            value={item.price === 0 ? '' : item.price}
                            onChange={(e) => updateItemPrice(item.cartItemId, e.target.value)}
                            className={`w-20 px-1.5 py-0.5 text-xs font-black rounded border transition text-right outline-none ${
                              isZeroPrice
                                ? 'bg-white dark:bg-slate-900 border-red-500 text-red-600 dark:text-red-400 placeholder:text-red-400 shadow-sm'
                                : 'bg-transparent hover:bg-white dark:hover:bg-slate-900 border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500'
                            }`}
                            title="Unit price (editable)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
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
      {showCheckoutModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
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
                <ThermalReceipt
                  transaction={{
                    id: txnRef,
                    items: cart,
                    subtotal,
                    discount: discountAmt,
                    tax,
                    taxRate,
                    total,
                    paymentMethod,
                    createdAt: new Date().toISOString()
                  }}
                  settings={generalSettings}
                  paperSize={generalSettings?.printerPaperSize || '80mm'}
                />
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
                  <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-800 flex flex-col items-center animate-fade-in space-y-3.5 shadow-sm">
                    {/* Live Auto-Print Listening Banner */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Listening for QR Payment... Auto-Print ON</span>
                    </div>

                    <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Pre-filled UPI QR (Scan to Pay)</span>
                    {generalSettings?.upiId ? (
                      <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-300">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            `upi://pay?pa=${generalSettings.upiId.trim()}&pn=${encodeURIComponent(generalSettings?.storeName || 'Store')}&am=${total.toFixed(2)}&cu=INR&tn=Bill ${txnRef}&tr=${txnRef}`
                          )}`} 
                          alt="QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-red-600">Configure your UPI ID in Store Settings to enable QR.</p>
                    )}

                    <div className="text-center">
                      <p className="font-black text-3xl text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Reference: {txnRef}</p>
                    </div>

                    {/* Instant Cashier Trigger Button for Testing & Verification */}
                    <button
                      type="button"
                      onClick={handleSimulateUpiPayment}
                      disabled={checkingOut}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <span>⚡ Cashier: Confirm QR Payment Received (Auto-Print)</span>
                    </button>
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
        </div>,
        document.body
      )}

      {/* Dedicated Thermal Bill Print Modal */}
      <ReceiptPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        transaction={lastTransaction}
        settings={generalSettings}
        autoPrint={generalSettings?.autoPrintOnCheckout !== false}
        onNewSale={() => {
          setShowPrintModal(false)
          setLastTransaction(null)
        }}
      />
    </>
  )
}

export default POSView
