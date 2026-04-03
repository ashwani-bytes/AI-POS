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
      <div className="lg:hidden flex glass-surface border-b border-white/10 relative z-20">
        <button 
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-4 font-black tracking-tighter uppercase transition-all duration-500 relative ${mobileTab === 'products' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          Browse Items
          {mobileTab === 'products' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
        </button>
        <button 
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-4 font-black tracking-tighter uppercase transition-all duration-500 relative ${mobileTab === 'cart' ? 'text-blue-400' : 'text-slate-500'}`}
        >
          View Cart ({cart.length})
          {mobileTab === 'cart' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
          {cart.length > 0 && <span className="absolute top-2 right-4 w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950">
        {/* Products Section */}
        <div className={`flex-1 p-4 lg:p-8 overflow-auto relative ${mobileTab !== 'products' && 'hidden lg:block'}`}>
          {/* Decorative Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative z-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Marketplace</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Select items for the new order</p>
            </div>
            <label className={`w-full md:w-auto px-8 py-4 ${t.accent} ${t.accentHover} text-white rounded-2xl cursor-pointer flex items-center justify-center space-x-3 elastic-hover hover:scale-105 active:scale-95 transition-all`}>
              <Camera className="w-5 h-5" />
              <span className="font-black uppercase tracking-tighter">{uploading ? 'Analyzing...' : 'Scan Bill'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="mb-8 relative z-10">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-4 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Find a product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-2xl glass-card focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 font-bold`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 lg:pb-0 relative z-10">
            {filteredProducts.map((product, idx) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`p-5 glass-card rounded-3xl elastic-hover text-left relative overflow-hidden group animate-reveal opacity-0`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500`}>
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${product.quantity > 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    Qty: {product.quantity || 0}
                  </div>
                </div>
                <h3 className="font-black text-lg mb-1 truncate text-white">{product.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">{product.category}</p>
                <p className="text-2xl font-black text-blue-400 tabular-nums">₹{product.price?.toFixed(2) || '0.00'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className={`w-full lg:w-[450px] glass-surface p-4 lg:p-8 flex flex-col h-full relative z-20 ${mobileTab !== 'cart' && 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-white">Your Cart</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Review items before checkout</p>
            </div>
            <div className="px-4 py-2 glass-card rounded-2xl text-blue-400 font-black tabular-nums border-blue-500/20">
              {cart.length} ITEMS
            </div>
          </div>

        <div className="flex-1 overflow-auto mb-6 space-y-4 pr-2 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 glass-card rounded-3xl border-dashed">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The cart is currently empty</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.cartItemId || idx} className="p-4 glass-card rounded-2xl border-white/5 hover:border-blue-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-white group-hover:text-blue-400 transition-colors">{item.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center p-1 glass-card rounded-xl border-white/5">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-black text-white px-2">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-black text-white text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-2xl">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full bg-transparent text-white font-black text-xl outline-none"
                min="0"
              />
            </div>
            <div className="glass-card p-4 rounded-2xl">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={(taxRate * 100).toFixed(0)}
                onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
                className="w-full bg-transparent text-white font-black text-xl outline-none"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border-white/10 space-y-3 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Subtotal</span>
            <span className="text-white font-black">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>Discount Applied</span>
            <span className="text-rose-400 font-black">-₹{discountAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
            <span>GST ({(taxRate * 100).toFixed(0)}%)</span>
            <span className="text-white font-black">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-3xl font-black pt-4 border-t border-white/5">
            <span className="text-white tracking-tighter">Total</span>
            <span className="text-blue-400 tabular-nums shadow-blue-500/20">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || checkingOut}
          className={`w-full py-5 ${t.accent} ${t.accentHover} text-white rounded-3xl font-black text-xl uppercase tracking-tighter shadow-2xl disabled:opacity-30 elastic-hover active:scale-95 transition-all mb-4`}
        >
          {checkingOut ? 'Processing...' : 'Complete Session'}
        </button>
      </div>
      </div>

      {/* --- CHECKOUT MODAL & INVOICE RENDER --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-fade-in" onClick={() => setShowCheckoutModal(false)} />
          <div className="glass-card w-full max-w-4xl rounded-[40px] shadow-3xl flex flex-col max-h-[90vh] relative z-10 border-white/20 animate-reveal overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-8 border-b border-white/5 glass-surface">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-white">Finalize Sale</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Select payment method below</p>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)} 
                className="w-12 h-12 flex items-center justify-center glass-card rounded-2xl text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-2xl font-light">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-10 grid lg:grid-cols-2 gap-10">
              {/* Receipt Visualizer */}
              <div className="glass-card p-8 rounded-3xl border-white/5 bg-white/5 relative group">
                <div id="receipt-visualizer" className="bg-white p-8 rounded-xl shadow-inner text-slate-900" style={{ fontFamily: 'monospace' }}>
                  <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">
                      {generalSettings?.storeName || 'AI POS PRO'}
                    </h3>
                    <p className="text-[10px] mt-2 whitespace-pre-wrap font-bold text-slate-600">
                      {generalSettings?.storeAddress || 'DIGITAL ENTERPRISE VERSION'}
                    </p>
                    <p className="text-xs font-black mt-2 bg-slate-900 text-white inline-block px-2 py-1">TAX INVOICE</p>
                  </div>

                  <table className="w-full text-xs border-collapse mb-8">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="pb-2 text-left font-black">ITEM</th>
                        <th className="pb-2 text-center font-black">QTY</th>
                        <th className="pb-2 text-right font-black">AMT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map(item => (
                        <tr key={item.cartItemId}>
                          <td className="py-3 font-bold truncate max-w-[140px]">{item.name}</td>
                          <td className="py-3 text-center font-bold">{item.quantity}</td>
                          <td className="py-3 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="space-y-2 text-xs font-bold ml-auto w-48 border-t-2 border-slate-900 pt-4">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmt > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>DISCOUNT</span>
                        <span>-₹{discountAmt.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST ({(taxRate * 100).toFixed(0)}%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black mt-4 border-t-2 border-slate-900 pt-2">
                      <span>TOTAL</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-center font-black text-[10px] tracking-widest mt-10 pt-4 border-t border-dashed border-slate-300">
                    {generalSettings?.receiptFooter || 'PROCESSED VIA AI POS SYSTEM'}
                  </div>
                </div>
              </div>

              {/* Payment Processing */}
              <div className="flex flex-col space-y-8">
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Payment Category</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={`group p-6 glass-card rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 hover:border-emerald-500/50'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl transition-all duration-500 ${paymentMethod === 'cash' ? 'bg-emerald-500 text-white scale-110 rotate-12' : 'bg-slate-800 text-slate-500 group-hover:scale-110'}`}>💵</div>
                      <span className={`font-black uppercase tracking-tighter ${paymentMethod === 'cash' ? 'text-emerald-400' : 'text-slate-500'}`}>Cash</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('upi')}
                      className={`group p-6 glass-card rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-blue-500/50'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl transition-all duration-500 ${paymentMethod === 'upi' ? 'bg-blue-500 text-white scale-110 -rotate-12' : 'bg-slate-800 text-slate-500 group-hover:scale-110'}`}>📱</div>
                      <span className={`font-black uppercase tracking-tighter ${paymentMethod === 'upi' ? 'text-blue-400' : 'text-slate-500'}`}>UPI QR</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="glass-card rounded-[40px] p-8 flex flex-col items-center justify-center animate-reveal border-blue-500/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Scanning Channel Open</p>
                    {generalSettings?.upiId ? (
                      <div className={`relative group p-4 glass-card rounded-3xl bg-white border-none shadow-2xl`}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            `upi://pay?pa=${generalSettings.upiId}&pn=${generalSettings?.storeName || 'Smart Store'}&am=${total.toFixed(2)}&cu=INR&tn=Bill%20from%20${encodeURIComponent(generalSettings?.storeName || 'Store')}&tr=${txnRef}`
                          )}`} 
                          alt="UPI QR Code"
                          className="w-[200px] h-[200px] object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="glass-card p-10 rounded-3xl border-dashed border-slate-700 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Please configure Merchant UPI ID in settings to activate auto-QR.</p>
                      </div>
                    )}
                    <div className="mt-8 px-8 py-4 glass-card rounded-2xl text-blue-400 font-black text-3xl tabular-nums shadow-blue-500/20 border-blue-500/20">
                       ₹ {total.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-4 tabular-nums font-bold tracking-widest">TRACE_ID: {txnRef}</p>
                  </div>
                )}
                
                {paymentMethod === 'cash' && (
                  <div className="glass-card rounded-[40px] p-10 flex flex-col items-center justify-center text-center animate-reveal border-emerald-500/20">
                     <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-5xl mb-6 animate-pulse">💰</div>
                     <h4 className="text-emerald-400 font-black text-xl tracking-tighter mb-2 italic">Awaiting Cash Collection</h4>
                     <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-[200px]">Collect exactly ₹{total.toFixed(2)} from the customer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 glass-surface flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-5 glass-card text-slate-400 hover:text-white font-black uppercase tracking-tighter rounded-2xl elastic-hover transition-all"
              >
                Abort Session
              </button>
              <button 
                onClick={finalizeTransaction}
                disabled={checkingOut}
                className={`flex-[2] py-5 ${t.accent} ${t.accentHover} text-white font-black uppercase tracking-tighter rounded-2xl shadow-3xl elastic-hover active:scale-95 transition-all flex items-center justify-center gap-3`}
              >
                {checkingOut ? 'Syncing Ledger...' : `Authorize & Print ₹${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default POSView
