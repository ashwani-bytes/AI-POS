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
      <div className="lg:hidden flex border-b border-gray-700">
        <button 
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-3 font-bold transition-all ${mobileTab === 'products' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
        >
          Browse Items ({products.length})
        </button>
        <button 
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 font-bold transition-all relative ${mobileTab === 'cart' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/10' : 'text-gray-400'}`}
        >
          View Cart ({cart.length})
          {cart.length > 0 && <span className="absolute top-2 right-4 w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Products Section */}
        <div className={`flex-1 p-4 lg:p-6 overflow-auto ${mobileTab !== 'products' && 'hidden lg:block'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Point of Sale</h1>
            <label className={`w-full md:w-auto px-6 py-3 ${t.accent} ${t.accentHover} text-white rounded-xl cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20`}>
              <Camera className="w-5 h-5" />
              <span className="font-bold">{uploading ? 'Processing...' : 'Scan Bill'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          <div className="mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border ${t.input} focus:ring-2 focus:ring-blue-500 transition`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 lg:pb-0">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  addToCart(product);
                  // Optional: Vibrate or show visual feedback on mobile
                }}
                className={`p-4 ${t.bgCard} border ${t.border} rounded-xl hover:border-blue-500 transition-all hover:scale-[1.02] active:scale-95 text-left relative overflow-hidden group`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-bold mb-1 truncate">{product.name}</h3>
                <p className={`text-xs ${t.textSecondary} mb-3 uppercase tracking-wider`}>{product.category}</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-lg font-black text-blue-500">₹{product.price?.toFixed(2) || '0.00'}</p>
                  <div className={`px-2 py-1 rounded text-[10px] ${product.quantity > 5 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'} font-bold`}>
                    Stock: {product.quantity || 0}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className={`w-full lg:w-[400px] ${t.bgSecondary} border-l ${t.border} p-4 lg:p-6 flex flex-col h-full bg-slate-900/50 backdrop-blur-md ${mobileTab !== 'cart' && 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Current Cart</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.bgCard} border ${t.border} text-blue-400`}>
              {cart.length} Items
            </span>
          </div>

        <div className="flex-1 overflow-auto mb-4 space-y-3">
          {cart.length === 0 ? (
            <p className={t.textSecondary}>Cart is empty</p>
          ) : (
            cart.map((item, idx) => (
              <div key={item.cartItemId || idx} className={`p-3 ${t.bgCard} rounded-lg border ${t.border}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className={`px-2 py-1 ${t.bgSecondary} rounded`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className={`px-2 py-1 ${t.bgSecondary} rounded`}
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className={`block text-sm mb-2 ${t.textSecondary}`}>Discount (₹)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              min="0"
            />
          </div>
          <div>
            <label className={`block text-sm mb-2 ${t.textSecondary}`}>Tax Rate (%)</label>
            <input
              type="number"
              value={(taxRate * 100).toFixed(0)}
              onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
              className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className={`border-t ${t.border} pt-4 space-y-2`}>
          <div className="flex justify-between">
            <span className={t.textSecondary}>Subtotal:</span>
            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className={t.textSecondary}>Discount:</span>
            <span className="font-semibold text-red-500">-₹{discountAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className={t.textSecondary}>Tax ({(taxRate * 100).toFixed(0)}%):</span>
            <span className="font-semibold">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
            <span>Total:</span>
            <span className="text-blue-500">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || checkingOut}
          className={`w-full mt-4 py-4 ${t.accent} ${t.accentHover} text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {checkingOut ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
      </div>

      {/* --- CHECKOUT MODAL & INVOICE RENDER --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white text-black w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold font-serif tracking-wide text-gray-800">Checkout</h2>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                 <span className="text-3xl font-light">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 grid md:grid-cols-2 gap-8 bg-gray-50">
              {/* Receipt Visualizer (Hard-mapped for USB spooler via id) */}
              <div id="receipt-visualizer" className="bg-white p-6 shadow-sm border border-gray-200" style={{ fontFamily: 'monospace' }}>
                <div className="text-center mb-6">
                  {generalSettings?.receiptHeader && <p className="text-xs text-gray-500 mb-2 italic">"{generalSettings.receiptHeader}"</p>}
                  <h3 className="text-xl font-bold uppercase tracking-widest text-gray-900 border-b-2 border-gray-900 pb-2 inline-block">
                    {generalSettings?.storeName || 'M/S STORE ENTERPRISES'}
                  </h3>
                  <p className="text-sm mt-2 text-gray-600 whitespace-pre-wrap">
                    {generalSettings?.storeAddress || 'GSTIN: 27AAAAA0000A1Z5'}
                  </p>
                  <p className="text-sm text-gray-600">Tax Invoice</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleString()}</p>
                </div>

                <div className="border-t border-b border-dashed border-gray-400 py-2 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="pb-2 font-semibold">Item</th>
                        <th className="pb-2 font-semibold text-center">Qty</th>
                        <th className="pb-2 font-semibold text-right">Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.cartItemId} className="align-top">
                          <td className="py-2 pr-2 leading-tight max-w-[120px] truncate">{item.name}</td>
                          <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1 text-sm text-gray-600 ml-auto w-48 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount</span>
                      <span>-₹{discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST ({(taxRate * 100).toFixed(0)}%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-900 mt-2 pt-2">
                    <span>TOTAL</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center font-bold text-sm tracking-widest mt-6 pb-2">
                  {generalSettings?.receiptFooter || '*** THANK YOU ***'}
                </div>
              </div>

              {/* Payment Processing */}
              <div className="flex flex-col space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">1. Select Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-4 px-2 rounded-xl flex flex-col md:flex-row items-center justify-center gap-2 border-2 transition-all font-bold ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50'}`}
                    >
                      <span className="text-2xl">💵</span>
                      CASH
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-4 px-2 rounded-xl flex flex-col md:flex-row items-center justify-center gap-2 border-2 transition-all font-bold ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50'}`}
                    >
                      <span className="text-2xl">📱</span>
                      UPI / QR
                    </button>
                  </div>
                </div>

                {/* Optional QR Code Render */}
                {paymentMethod === 'upi' && (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Scan to Pay Exact Amount</p>
                    {generalSettings?.upiId ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${generalSettings.upiId}&pn=${encodeURIComponent(generalSettings?.storeName || 'Smart Store')}&am=${total.toFixed(2)}&cu=INR`} 
                        alt="UPI QR Code"
                        className="w-[180px] h-[180px] object-cover rounded-lg shadow-sm border border-gray-100"
                      />
                    ) : (
                      <div className="w-[180px] h-[180px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-4 text-center">
                        <span className="text-sm text-gray-400 font-semibold">Please add your Merchant UPI ID in Settings to generate QR code.</span>
                      </div>
                    )}
                    <div className="mt-4 px-4 py-2 bg-blue-50 text-blue-800 rounded-full font-bold text-xl tracking-tight">
                       ₹ {total.toFixed(2)}
                    </div>
                  </div>
                )}
                {paymentMethod === 'cash' && (
                  <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
                     <span className="text-5xl mb-4">🧾</span>
                     <p className="text-emerald-800 font-semibold mb-1">Cash Register selected.</p>
                     <p className="text-emerald-600 text-sm">Collect exactly ₹{total.toFixed(2)} from the customer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Submit */}
            <div className="p-6 border-t border-gray-200 bg-white rounded-b-xl flex flex-col gap-4">
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-4 text-gray-600 bg-gray-100 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel Checkout
                </button>
                <button 
                  onClick={finalizeTransaction}
                  disabled={checkingOut}
                  className="flex-[2] py-4 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <span className="relative z-10">{checkingOut ? 'Saving Protocol...' : `FINALIZE AND AUTO-PRINT (USB) ₹${total.toFixed(2)}`}</span>
                </button>
              </div>

              {/* Hardware Printing Overrides */}
              <div className="flex gap-4 border-t border-gray-100 pt-4">
                 <button 
                   onClick={() => window.print()}
                   className="flex-1 py-3 text-gray-700 border-2 border-gray-200 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                 >
                   <Printer className="w-4 h-4" /> Print USB Spool
                 </button>
                 <button 
                   onClick={async () => {
                      try {
                        const device = await navigator.bluetooth.requestDevice({
                          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                          optionalServices: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2']
                        })
                        const server = await device.gatt.connect()
                        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
                        const char = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')
                        
                        let txt = '\x1B\x40\x1B\x61\x01' + (generalSettings?.storeName || 'M/S STORE') + '\n\n\x1B\x61\x00'
                        cart.forEach(i => txt += `${i.name.substring(0, 15)} x${i.quantity} : ${i.price}\n`)
                        txt += `\nTOTAL: ${total}\n\n\x1B\x61\x01THANK YOU\n\n\n\n`
                        
                        await char.writeValue(new TextEncoder().encode(txt))
                        showToast('success', 'Sent raw byte-code to BLE Printer!')
                      } catch(e) { showToast('error', 'Bluetooth paired failed. Connection closed.') }
                   }}
                   className="flex-1 py-3 text-blue-700 bg-blue-50 border-2 border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm"
                 >
                   <Bluetooth className="w-4 h-4" /> Connect Bluetooth Printer
                 </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default POSView
