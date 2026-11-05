import React, { useState, useEffect } from 'react'
import { 
  Printer, 
  Check, 
  HelpCircle, 
  Usb, 
  Bluetooth, 
  Wifi, 
  Zap, 
  FileText, 
  Store,
  QrCode,
  Percent,
  Sliders
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Toast from './Toast'
import { api } from '../lib/api'
import ReceiptPrintModal from './ReceiptPrintModal'

const SettingsView = () => {
  const { t } = useTheme()
  
  const [settings, setSettings] = useState({
    storeName: '',
    storeAddress: '',
    phone: '',
    email: '',
    gstin: '',
    upiId: '',
    taxRate: 18,
    receiptHeader: '',
    receiptFooter: '',
    printerPaperSize: '80mm',
    autoPrintOnCheckout: true
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ type: 'info', message: '' })
  const [showTestPrintModal, setShowTestPrintModal] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [activeGuideTab, setActiveGuideTab] = useState('usb')

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(prev => prev.message === message ? { type: 'info', message: '' } : prev)
    }, 5000)
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            setSettings(prev => ({
              ...prev,
              ...data,
              taxRate: data.taxRate !== undefined && data.taxRate !== null ? Number(data.taxRate) : prev.taxRate,
              printerPaperSize: data.printerPaperSize || '80mm',
              autoPrintOnCheckout: data.autoPrintOnCheckout !== undefined ? Boolean(data.autoPrintOnCheckout) : true
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load settings', error)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...settings,
        taxRate: Number(settings.taxRate) || 0
      }
      const res = await api.post('/api/settings', payload)
      if (res.ok) {
        showToast('success', 'Store and bill printer settings saved successfully!')
      } else {
        showToast('error', 'Failed to save settings')
      }
    } catch (error) {
      showToast('error', 'Network error saving settings')
    } finally {
      setSaving(false)
    }
  }

  // Sample transaction for printer test
  const sampleTestTransaction = {
    id: `TEST-${Date.now().toString().slice(-6)}`,
    items: [
      { name: 'Fresh Whole Milk 1L', quantity: 2, price: 68.00 },
      { name: 'Artisan Bread 400g', quantity: 1, price: 45.00 },
      { name: 'Dark Roast Coffee 250g', quantity: 1, price: 290.00 }
    ],
    subtotal: 471.00,
    discount: 21.00,
    taxRate: (Number(settings.taxRate) || 18) / 100,
    tax: 450 * ((Number(settings.taxRate) || 18) / 100),
    total: 450 + (450 * ((Number(settings.taxRate) || 18) / 100)),
    payments: [{ method: 'cash', amount: 531.00 }],
    paymentMethod: 'cash',
    createdAt: new Date().toISOString()
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${t.bg} ${t.text} min-h-screen custom-scrollbar overflow-x-hidden min-w-0`}>
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 min-w-0">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-300 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Store & Printer Settings</h1>
            <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">
              Configure store details, thermal bill printer connection, and GST tax invoice layout.
            </p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 font-black text-white text-sm md:text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-95"
          >
            {saving ? 'Saving...' : 'SAVE ALL SETTINGS'}
          </button>
        </div>

        <div className="space-y-6">

          {/* 1. THERMAL BILL PRINTER SETUP CARD */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-l-8 border-l-emerald-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Thermal Bill Printer Machine</h2>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold">
                    Connect USB, Bluetooth, or Wi-Fi POS receipt printers (Epson, TVS, NGX, POS-58, POS-80).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="px-3.5 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition"
                >
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>{showGuide ? 'Hide Guide' : 'Connection Guide'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTestPrintModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Test Print Bill</span>
                </button>
              </div>
            </div>

            {/* Connection Guide Drawer */}
            {showGuide && (
              <div className="mb-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/30 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm md:text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    <span>Step-by-Step Printer Connection Guide</span>
                  </h3>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('mobile')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                      activeGuideTab === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bluetooth className="w-3.5 h-3.5" /> Mobile / Android Tablet
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('ipad')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                      activeGuideTab === 'ipad' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" /> iPad / iPhone (iOS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('usb')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                      activeGuideTab === 'usb' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Usb className="w-3.5 h-3.5" /> Laptop / PC (USB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGuideTab('kiosk')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                      activeGuideTab === 'kiosk' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Silent Kiosk Mode (0-Click)
                  </button>
                </div>

                {/* Tab Details */}
                <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  {activeGuideTab === 'mobile' && (
                    <div className="space-y-2">
                      <p><b>1. Bluetooth Thermal Printers:</b> Turn on your 58mm or 80mm wireless printer. Open phone/tablet <b>Bluetooth Settings &rarr; Pair Device</b>. Enter PIN (<code className="px-1 bg-slate-200 dark:bg-slate-800 rounded">0000</code> or <code className="px-1 bg-slate-200 dark:bg-slate-800 rounded">1234</code>).</p>
                      <p><b>2. USB OTG Adapter Cable:</b> You can plug any USB thermal printer directly into your Android phone or tablet using a small USB-C to USB-A (OTG) adapter.</p>
                      <p><b>3. Direct Print:</b> Tap <b>Test Print Bill</b> above &rarr; Select your paired printer from the Android print dialog &rarr; Set Roll size to 58mm or 80mm.</p>
                    </div>
                  )}
                  {activeGuideTab === 'ipad' && (
                    <div className="space-y-2">
                      <p><b>1. AirPrint Thermal Printers:</b> If your printer supports AirPrint / Wi-Fi (e.g. Epson TM-T88, Star Micronics), connect it to store Wi-Fi. Safari on iPad/iPhone will detect it automatically without needing any driver!</p>
                      <p><b>2. Shared Network Printer:</b> If the printer is plugged into your billing PC via USB, enable <b>Share this printer</b> in Windows. Any iPad on the same Wi-Fi will see it and print seamlessly.</p>
                      <p><b>3. Print:</b> Tap <b>Print Bill</b> &rarr; Choose AirPrint printer &rarr; Set Margins: None &rarr; Print.</p>
                    </div>
                  )}
                  {activeGuideTab === 'usb' && (
                    <div className="space-y-2">
                      <p><b>1. Connect USB Cable:</b> Plug your thermal printer (e.g. TVS RP 3200, Epson TM-T82, Everycom, POS-58, POS-80) into your PC's USB port.</p>
                      <p><b>2. Install Windows Driver:</b> Insert the CD or download the manufacturer's driver. In Windows <b>Settings &rarr; Printers & Scanners</b>, your printer will show as "POS-80" or your model name.</p>
                      <p><b>3. Test Print:</b> Click <b>"Test Print Bill"</b> above. In the browser print dialog, select your thermal printer, set Margins to <b>None</b>, and uncheck <b>Headers and footers</b>.</p>
                    </div>
                  )}
                  {activeGuideTab === 'kiosk' && (
                    <div className="space-y-2">
                      <p className="text-purple-600 dark:text-purple-400 font-bold">⚡ How to Enable 0-Click Auto-Printing (Kiosk Mode):</p>
                      <p>You can launch Google Chrome or Edge with the <code>--kiosk-printing</code> flag so every bill prints instantly without showing any popup window:</p>
                      <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl">
                        chrome.exe --kiosk --kiosk-printing https://ai-pos-one.vercel.app
                      </div>
                      <p className="text-xs text-slate-500">Upon clicking "Proceed to Pay" or when QR payment arrives, your thermal receipt machine will physically cut the paper roll within 0.5s!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Printer Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Paper Roll Width Selector */}
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">
                  Thermal Paper Roll Width
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, printerPaperSize: '80mm' }))}
                    className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                      settings.printerPaperSize === '80mm'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm md:text-base">80mm (3-inch)</span>
                      {settings.printerPaperSize === '80mm' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] opacity-80 font-bold">Standard Store POS (Epson, TVS, NGX, POS-80)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, printerPaperSize: '58mm' }))}
                    className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                      settings.printerPaperSize === '58mm'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm md:text-base">58mm (2-inch)</span>
                      {settings.printerPaperSize === '58mm' && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-[11px] opacity-80 font-bold">Compact / Handheld Bluetooth (POS-58)</span>
                  </button>
                </div>
              </div>

              {/* Auto Print Checkbox */}
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">
                  Checkout Printing Behavior
                </label>
                <label className="flex items-start gap-3.5 p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:border-slate-400 transition">
                  <input
                    type="checkbox"
                    name="autoPrintOnCheckout"
                    checked={settings.autoPrintOnCheckout}
                    onChange={handleChange}
                    className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      Auto-trigger Bill Print on Checkout
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold block mt-0.5">
                      Automatically sends bill to thermal printer when payment is completed.
                    </span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* 2. STORE IDENTITY CARD */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-l-8 border-l-blue-600">
            <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Store Identity & Location</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Store Name / Brand</label>
                <input
                  type="text"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  placeholder="HOT N' HAZY"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Store Address</label>
                  <input
                    type="text"
                    name="storeAddress"
                    value={settings.storeAddress}
                    onChange={handleChange}
                    placeholder="SEC -4, Near La Pinoz, Mohali"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Store GSTIN / Tax ID</label>
                  <input
                    type="text"
                    name="gstin"
                    value={settings.gstin}
                    onChange={handleChange}
                    placeholder="03ABCDE1234F1Z5"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold uppercase shadow-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Official Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Support Email</label>
                  <input
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="contact@hotnhazy.com"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. UPI PAYMENTS CARD */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-l-8 border-l-purple-600">
            <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Dynamic UPI Payment Integration</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Store Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  name="upiId"
                  value={settings.upiId}
                  onChange={handleChange}
                  placeholder="merchant@okicici or 9876543210@paytm"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-purple-500/50 bg-purple-50/20 dark:bg-purple-950/20 text-slate-900 dark:text-white placeholder-purple-700/50 focus:border-purple-600 outline-none text-base font-black shadow-sm transition"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Used to generate dynamic QR codes with pre-filled billing amounts on receipts and checkout screens.</p>
              </div>
            </div>
          </div>

          {/* 4. GST RATE & RECEIPT CUSTOMIZATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-t-8 border-t-indigo-600">
              <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Checkout & GST Rate</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    name="taxRate"
                    value={settings.taxRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none text-base font-black shadow-sm transition"
                  />
                  <p className="text-xs text-slate-500 mt-1 font-semibold">Will be split evenly into CGST (50%) and SGST (50%) on printed invoices.</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-t-8 border-t-amber-600">
              <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Receipt Greetings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Invoice Header Subtitle</label>
                  <input
                    type="text"
                    name="receiptHeader"
                    value={settings.receiptHeader}
                    onChange={handleChange}
                    placeholder="Quality & Service Guaranteed"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Invoice Footer Farewell</label>
                  <input
                    type="text"
                    name="receiptFooter"
                    value={settings.receiptFooter}
                    onChange={handleChange}
                    placeholder="Thank you for shopping with us! Visit again."
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Test Print Modal */}
      <ReceiptPrintModal
        isOpen={showTestPrintModal}
        onClose={() => setShowTestPrintModal(false)}
        transaction={sampleTestTransaction}
        settings={settings}
        autoPrint={false}
      />
    </div>
  )
}

export default SettingsView
