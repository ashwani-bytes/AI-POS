import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
  Printer, 
  X, 
  Check, 
  HelpCircle, 
  Sliders, 
  ArrowRight, 
  Usb, 
  Wifi, 
  Bluetooth, 
  Zap,
  RotateCcw,
  Smartphone,
  Tablet,
  Laptop
} from 'lucide-react'
import ThermalReceipt from './ThermalReceipt'
import { getDeviceInfo, connectBluetoothPrinter } from '../lib/thermalPrinter'

const ReceiptPrintModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  settings, 
  onNewSale,
  autoPrint = false 
}) => {
  const [paperSize, setPaperSize] = useState(() => settings?.printerPaperSize || '80mm')
  const [showGuide, setShowGuide] = useState(false)
  const [activeGuideTab, setActiveGuideTab] = useState('usb')
  const [hasPrinted, setHasPrinted] = useState(false)
  const [pairingBluetooth, setPairingBluetooth] = useState(false)
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState('')

  const deviceInfo = useMemo(() => getDeviceInfo(), [])

  // Auto-switch guide tab to match the cashier's current device
  useEffect(() => {
    if (deviceInfo.isIPad || deviceInfo.isIOS) {
      setActiveGuideTab('ipad')
    } else if (deviceInfo.isMobile || deviceInfo.isTablet) {
      setActiveGuideTab('mobile')
    } else {
      setActiveGuideTab('usb')
    }
  }, [deviceInfo])

  // Update paper size if settings change
  useEffect(() => {
    if (settings?.printerPaperSize) {
      setPaperSize(settings.printerPaperSize)
    }
  }, [settings?.printerPaperSize])

  // Trigger print
  const handlePrint = () => {
    setHasPrinted(true)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Handle direct Web Bluetooth pairing for mobile/laptop Chrome
  const handlePairBluetooth = async () => {
    setPairingBluetooth(true)
    try {
      const res = await connectBluetoothPrinter()
      setBluetoothDeviceName(res.deviceName)
      alert(`Connected successfully to ${res.deviceName}! You can now print bills.`)
    } catch (err) {
      console.warn('Bluetooth pairing:', err.message)
    } finally {
      setPairingBluetooth(false)
    }
  }

  // Auto-print effect on mount if requested
  useEffect(() => {
    if (isOpen && autoPrint && !hasPrinted) {
      const timer = setTimeout(() => {
        handlePrint()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoPrint])

  // Keyboard shortcut Ctrl+P while modal is open
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        handlePrint()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen || !transaction) return null

  const modalJSX = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Hidden container dedicated for window.print() */}
      <div id="pos-print-area" className={paperSize === '58mm' ? 'paper-58mm' : 'paper-80mm'} aria-hidden="true">
        <ThermalReceipt 
          transaction={transaction} 
          settings={settings} 
          paperSize={paperSize} 
          isPrintOnly={true} 
        />
      </div>

      {/* Screen Interactive Modal Card */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-black">Thermal Bill Printer</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  Invoice #{transaction.id ? String(transaction.id).slice(-8).toUpperCase() : 'RECEIPT'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {deviceInfo.isIPad ? <Tablet className="w-3 h-3" /> : deviceInfo.isMobile ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                  <span>{deviceInfo.deviceType}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition"
              title="How to connect thermal printer machine"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Connect Printer</span>
            </button>

            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Left Column: Realistic Paper Receipt Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Live Receipt Preview
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPaperSize('80mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    paperSize === '80mm'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  80mm (3")
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('58mm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    paperSize === '58mm'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                  }`}
                >
                  58mm (2")
                </button>
              </div>
            </div>

            {/* Scrollable Receipt Preview Container */}
            <div className="w-full max-h-[55vh] overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-800 flex justify-center custom-scrollbar shadow-inner">
              <ThermalReceipt 
                transaction={transaction} 
                settings={settings} 
                paperSize={paperSize} 
                isPrintOnly={false} 
              />
            </div>
          </div>

          {/* Right Column: Controls & Multi-Device Instructions */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
            
            {showGuide ? (
              /* Inline Multi-Device Setup Guide Drawer */
              <div className="p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-blue-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs md:text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Printer className="w-4 h-4" />
                    <span>Connecting Printer to {deviceInfo.deviceType}</span>
                  </h3>
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                  >
                    Close
                  </button>
                </div>

                {/* Device-Specific Tabs */}
                <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveGuideTab('mobile')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition shrink-0 ${
                      activeGuideTab === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile / Android
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('ipad')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition shrink-0 ${
                      activeGuideTab === 'ipad' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" /> iPad / iPhone
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('usb')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition shrink-0 ${
                      activeGuideTab === 'usb' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" /> Laptop / PC
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('kiosk')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition shrink-0 ${
                      activeGuideTab === 'kiosk' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Silent Kiosk
                  </button>
                </div>

                {/* Tab Content */}
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                  {activeGuideTab === 'mobile' && (
                    <div className="space-y-1.5 font-semibold">
                      <p><b>1. Bluetooth Thermal Printers:</b> Turn on your portable printer. Open phone/tablet <b>Bluetooth Settings → Pair Device</b>. Enter PIN (<code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">0000</code> or <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">1234</code>).</p>
                      <p><b>2. USB OTG Cable:</b> You can plug any USB thermal printer directly into your Android phone/tablet using a USB-C OTG adapter.</p>
                      <p><b>3. Direct Print:</b> Tap <b>Print Bill</b> below, choose your printer from the Android print dialog, and set Paper Size to Roll (58mm or 80mm).</p>
                    </div>
                  )}

                  {activeGuideTab === 'ipad' && (
                    <div className="space-y-1.5 font-semibold">
                      <p><b>1. AirPrint Thermal Printers:</b> If your printer supports AirPrint / Wi-Fi (e.g. Epson TM-T88, Star Micronics), connect it to store Wi-Fi. Safari on iPad/iPhone will detect it automatically!</p>
                      <p><b>2. Shared Network Printer:</b> If the printer is plugged into your billing PC via USB, enable <b>Share this printer</b> in Windows. Your iPad on the same Wi-Fi will see it immediately!</p>
                      <p><b>3. Print:</b> Tap <b>Print Bill</b> &rarr; Select printer &rarr; Set Margins: None &rarr; Print.</p>
                    </div>
                  )}

                  {activeGuideTab === 'usb' && (
                    <div className="space-y-1.5 font-semibold">
                      <p><b>1. USB Plug & Play:</b> Connect your thermal printer via USB cable to your laptop or PC.</p>
                      <p><b>2. Windows Driver:</b> In Windows <b>Printers & Scanners</b>, it will appear as <b>POS-80</b> or your brand name (TVS, Epson, NGX, POS-58).</p>
                      <p><b>3. Print Settings:</b> In Chrome/Edge print dialog, set <b>Margins: None</b> and uncheck <b>Headers & footers</b>.</p>
                    </div>
                  )}

                  {activeGuideTab === 'kiosk' && (
                    <div className="space-y-1.5 font-semibold">
                      <p className="text-purple-600 dark:text-purple-400 font-black">
                        ⚡ 0-Click Instant Printing (Auto-Cut)
                      </p>
                      <p>Run Google Chrome with silent printing enabled:</p>
                      <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                        chrome.exe --kiosk-printing https://ai-pos-one.vercel.app
                      </div>
                      <p className="text-[11px] text-slate-500">Upon checkout or QR payment, the thermal machine automatically prints with zero dialogs!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Quick Print Overview */
              <div className="space-y-4">
                <div className="p-4 md:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                    <Check className="w-5 h-5" />
                    <span>Transaction Recorded Successfully</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    Total Amount: <span className="font-black text-emerald-700 dark:text-emerald-400">₹{Number(transaction.total || 0).toFixed(2)}</span> ({transaction.items?.length || 0} item lines). Ready to dispatch to your thermal paper machine.
                  </p>
                </div>

                {/* Direct Bluetooth pairing button if available */}
                {deviceInfo.supportsBluetooth && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {bluetoothDeviceName ? `Paired: ${bluetoothDeviceName}` : 'Wireless Bluetooth Printer'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePairBluetooth}
                      disabled={pairingBluetooth}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black transition active:scale-95 disabled:opacity-50"
                    >
                      {pairingBluetooth ? 'Pairing...' : bluetoothDeviceName ? 'Re-pair' : 'Pair Bluetooth'}
                    </button>
                  </div>
                )}

                {/* Best Practice Tip Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Recommended Printer Settings ({deviceInfo.deviceType}):
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-medium list-disc list-inside">
                    <li>Printer: Select your <b>POS-58</b>, <b>POS-80</b>, or thermal model</li>
                    <li>Paper Size: <b>{paperSize === '58mm' ? '58mm (2-inch roll)' : '80mm (3-inch roll)'}</b></li>
                    <li>Margins: <b>None</b> (or Minimum)</li>
                    <li>Uncheck <b>Headers and footers</b></li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-base md:text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 transition-all"
              >
                <Printer className="w-6 h-6" />
                <span>Print Bill on Machine</span>
                <span className="text-xs font-bold opacity-80 bg-blue-700/60 px-2 py-0.5 rounded-lg hidden sm:inline">
                  Ctrl + P
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-3 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 font-black text-xs md:text-sm text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-Print Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNewSale) onNewSale()
                    onClose()
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-md"
                >
                  <span>New Customer Sale</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )

  return createPortal(modalJSX, document.body)
}

export default ReceiptPrintModal
