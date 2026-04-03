import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Camera, Search, Printer, Bluetooth } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'

// --- PURE CALCULATION UTILITY ---
function calculateTotalsManual(cartData, discount, taxRate) {
  const s = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const d = discount || 0
  const tx = Math.max(0, s - d) * taxRate
  const tt = Math.max(0, s - d) + tx
  return { subtotal: s, discountAmt: d, tax: tx, total: tt }
}

const POSView = () => {
  const { t } = useTheme()
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cart')
      const parsed = saved ? JSON.parse(saved) : []
      return parsed.map(item => ({ ...item, cartItemId: item.cartItemId || Date.now() + Math.random() }))
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart))
  }, [cart])

  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0.18)
  const [uploading, setUploading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [generalSettings, setGeneralSettings] = useState(null)
  const [toast, setToast] = useState({ type: 'info', message: '' })
  const [mobileTab, setMobileTab] = useState('products') // 'products' or 'cart'
  const [txnRef, setTxnRef] = useState('')

  useEffect(() => {
    if (showCheckoutModal) {
      setTxnRef(`TXN${Date.now()}`)
    }
  }, [showCheckoutModal])

  function showToast(type, message) {
    setToast({ type, message })
    setTimeout(() => {
      setToast(prev => prev.message === message ? { type: 'info', message: '' } : prev)
    }, 30000)
  }

  // Wrapper for convenient use
  const getTotals = (cartData = cart) => calculateTotalsManual(cartData, discount, taxRate)

  // --- HOISTED LOGIC FUNCTIONS ---
  async function fetchGeneralSettings() {
    try {
      const res = await api.get('/api/settings')
      if (res.ok) {
        setGeneralSettings(await res.json())
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
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  function addToCart(product) {
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        cartItemId: Date.now() + Math.random(),
        productId: product.id,
        name: product.name,
        price: product.price || 0,
        quantity: 1
      }])
    }
  }

  function updateQuantity(cartItemId, quantity) {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
    } else {
      setCart(cart.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ))
    }
  }

  function removeFromCart(cartItemId) {
    setCart(cart.filter(item => item.cartItemId !== cartItemId))
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
        showToast('error', `Failed to process image: ${errorMsg}`)
        return
      }

      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          setCart(prev => [...prev, {
            cartItemId: Date.now() + Math.random(),
            productId: item.productId || null,
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity || 1
          }])
        })
        showToast('success', `Added ${data.items.length} scanned item(s) to cart!`)
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
        showToast('success', 'Transaction logged successfully!')
        setTimeout(() => {
          window.print()
          setCart([])
          setDiscount(0)
          setShowCheckoutModal(false)
          fetchProducts()
        }, 300)
      }
    } catch (error) {
      showToast('error', 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    fetchProducts()
    fetchGeneralSettings()
  }, [])

  const { subtotal, discountAmt, tax, total } = getTotals()

  return (
    <>
      <LoadingBar active={uploading || checkingOut} label={(uploading && 'Processing image...') || (checkingOut && 'Completing sale...') || ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-white dark:bg-slate-900 border-b dark:border-slate-800 relative z-20">
        <button 
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-3 font-semibold transition-all ${mobileTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Products
        </button>
        <button 
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 font-semibold transition-all ${mobileTab === 'cart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
        >
          Cart ({cart.length})
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 dark:bg-slate-900">
        {/* Products Section */}
        <div className={`flex-1 p-4 lg:p-6 overflow-auto ${mobileTab !== 'products' && 'hidden lg:block'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Marketplace</h1>
              <p className="text-slate-500 text-sm">Select items for the order</p>
            </div>
            <label className={`w-full md:w-auto px-6 py-2.5 ${t.accent} ${t.accentHover} text-white rounded-lg cursor-pointer flex items-center justify-center space-x-2 transition-all shadow-sm`}>
              <Camera className="w-4 h-4" />
              <span className="font-semibold">{uploading ? 'Analyzing...' : 'Scan Bill'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="mb-6">
            <div className="relative group">
              <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-0">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 transition-all text-left shadow-sm group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${product.quantity > 5 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    Stock: {product.quantity || 0}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white truncate">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">{product.category}</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{product.price?.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className={`w-full lg:w-96 bg-white dark:bg-slate-800 border-l dark:border-slate-700 p-4 lg:p-6 flex flex-col h-full shadow-xl ${mobileTab !== 'cart' && 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Current Cart</h2>
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 text-xs font-bold">
              {cart.length} ITEMS
            </div>
          </div>

          <div className="flex-1 overflow-auto mb-6 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-slate-400 text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.cartItemId} className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm text-slate-800 dark:text-white">{item.name}</h3>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-500">-</button>
                      <span className="px-3 text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-500">+</button>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discount (₹)</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GST (%)</label>
                <input type="number" value={(taxRate * 100).toFixed(0)} onChange={(e) => setTaxRate(Number(e.target.value) / 100)} className="w-full bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded text-sm font-bold" />
              </div>
            </div>
            <div className="pt-3 border-t dark:border-slate-700 space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-red-500">
                <span>Discount</span>
                <span>-₹{discountAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2">
                <span>Total</span>
                <span className="text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className={`w-full py-3 ${t.accent} ${t.accentHover} text-white rounded-lg font-bold shadow-lg disabled:opacity-50 transition-all`}
          >
            {checkingOut ? 'Processing...' : 'Checkout Now'}
          </button>
        </div>
      </div>

      {/* --- CHECKOUT MODAL --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
              <h2 className="text-xl font-bold">Finalize Transaction</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl font-light">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 grid lg:grid-cols-2 gap-8">
              {/* Receipt Visualizer */}
              <div className="bg-gray-100 dark:bg-slate-900/50 p-4 rounded-xl">
                <div id="receipt-visualizer" className="bg-white p-6 shadow-sm text-gray-800" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold uppercase">{generalSettings?.storeName || 'AI POS STORE'}</h3>
                    <p className="whitespace-pre-wrap">{generalSettings?.storeAddress}</p>
                    <div className="mt-2 border-y py-1 font-bold">TAX INVOICE</div>
                  </div>

                  <table className="w-full mb-4">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-1">ITEM</th>
                        <th className="text-center">QTY</th>
                        <th className="text-right">AMT</th>
                      </tr>
                    </thead>
                    <tbody className="border-b">
                      {cart.map(item => (
                        <tr key={item.cartItemId}>
                          <td className="py-1">{item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="space-y-1 w-full max-w-[200px] ml-auto">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{discountAmt.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>GST:</span><span>{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1 mt-1 text-base">
                      <span>TOTAL:</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] mt-8 pt-4 border-t border-dashed">
                    {generalSettings?.receiptFooter || 'Thank you for shopping!'}
                  </div>
                </div>
              </div>

              {/* Payment Processing */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Payment Method</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-slate-100 dark:border-slate-700 hover:border-green-200'}`}
                    >
                      <div className="text-2xl">💵</div>
                      <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-green-600' : 'text-slate-400'}`}>Cash</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('upi')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-700 hover:border-blue-200'}`}
                    >
                      <div className="text-2xl">📱</div>
                      <span className={`text-sm font-bold ${paymentMethod === 'upi' ? 'text-blue-600' : 'text-slate-400'}`}>UPI QR</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 flex flex-col items-center animate-fade-in">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Scan using any UPI App</p>
                    {generalSettings?.upiId ? (
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                            `upi://pay?pa=${generalSettings.upiId}&pn=${encodeURIComponent(generalSettings?.storeName || 'Store')}&am=${total.toFixed(2)}&cu=INR&tn=Bill%20${txnRef}&tr=${txnRef}`
                          )}`} 
                          alt="QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-red-500">UPI ID not configured in settings.</p>
                    )}
                    <p className="mt-4 font-bold text-xl text-blue-600">₹{total.toFixed(2)}</p>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="p-8 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 text-center animate-fade-in">
                    <p className="text-green-600 dark:text-green-400 font-bold mb-1">Collect Cash Payment</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Amount: ₹{total.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t dark:border-slate-700 flex gap-4">
              <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-3 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                Cancel
              </button>
              <button 
                onClick={finalizeTransaction}
                disabled={checkingOut}
                className={`flex-[2] py-3 ${t.accent} ${t.accentHover} text-white font-bold rounded-lg shadow-lg transition-all`}
              >
                {checkingOut ? 'Saving...' : `Pay & Print ₹${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default POSView
