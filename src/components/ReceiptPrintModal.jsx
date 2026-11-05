import React, { useState, useEffect } from 'react'
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
  RotateCcw
} from 'lucide-react'
import ThermalReceipt from './ThermalReceipt'

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

  // Update paper size if settings change
  useEffect(() => {
    if (settings?.printerPaperSize) {
      setPaperSize(settings.printerPaperSize)
    }
  }, [settings?.printerPaperSize])

  // Trigger print
  const handlePrint = () => {
    setHasPrinted(true)
    // Small timeout ensures the print DOM container is fully reflowed
    setTimeout(() => {
      window.print()
    }, 150)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
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
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black">Thermal Bill Printer</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                Tax Invoice #{transaction.id ? String(transaction.id).slice(-8).toUpperCase() : 'RECEIPT'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition"
              title="How to connect thermal printer machine"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Printer Setup Guide</span>
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
        <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
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
            <div className="w-full max-h-[58vh] overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border-2 border-slate-300 dark:border-slate-800 flex justify-center custom-scrollbar shadow-inner">
              <ThermalReceipt 
                transaction={transaction} 
                settings={settings} 
                paperSize={paperSize} 
                isPrintOnly={false} 
              />
            </div>
          </div>

          {/* Right Column: Controls & Connection Instructions */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
            
            {showGuide ? (
              /* Inline Setup Guide Drawer */
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-blue-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm md:text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Printer className="w-4 h-4" />
                    <span>How to Connect Your Bill Printer</span>
                  </h3>
                  <button 
                    onClick={() => setShowGuide(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                  >
                    Close Guide
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <button
                    onClick={() => setActiveGuideTab('usb')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                      activeGuideTab === 'usb' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Usb className="w-3.5 h-3.5" /> USB
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('bluetooth')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                      activeGuideTab === 'bluetooth' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Bluetooth className="w-3.5 h-3.5" /> Bluetooth
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('wifi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                      activeGuideTab === 'wifi' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" /> LAN / Wi-Fi
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('kiosk')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                      activeGuideTab === 'kiosk' ? 'bg-purple-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Instant Kiosk
                  </button>
                </div>

                {/* Tab Content */}
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 leading-relaxed">
                  {activeGuideTab === 'usb' && (
                    <ol className="list-decimal list-inside space-y-1.5 font-semibold">
                      <li>Plug your thermal printer into your PC or POS terminal using the USB cable.</li>
                      <li>Turn on the printer and install the manufacturer driver (e.g. TVS, Epson, Everycom, POS-58, POS-80).</li>
                      <li>In Windows <b>Printers & Scanners</b>, set it as Default or select it when printing.</li>
                      <li>In Chrome/Edge print dialog, set <b>Margins: None</b> and uncheck <b>Headers and footers</b>.</li>
                    </ol>
                  )}
                  {activeGuideTab === 'bluetooth' && (
                    <ol className="list-decimal list-inside space-y-1.5 font-semibold">
                      <li>Power on your handheld 58mm/80mm Bluetooth printer.</li>
                      <li>On your PC, phone, or tablet, open <b>Bluetooth Settings</b> & click <b>Add Device</b>.</li>
                      <li>Pair with your printer (Default PIN is usually <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">0000</code> or <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">1234</code>).</li>
                      <li>Once paired, it will appear as an available printer in the print dialog.</li>
                    </ol>
                  )}
                  {activeGuideTab === 'wifi' && (
                    <ol className="list-decimal list-inside space-y-1.5 font-semibold">
                      <li>Connect the printer to your billing router via Ethernet LAN cable or Wi-Fi.</li>
                      <li>In Windows, go to <b>Printers & Scanners &rarr; Add device manually &rarr; Add using TCP/IP address</b>.</li>
                      <li>Enter your printer's IP address (e.g. <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">192.168.1.100</code>).</li>
                      <li>All POS billing counters on the local network can now print to this machine!</li>
                    </ol>
                  )}
                  {activeGuideTab === 'kiosk' && (
                    <div className="space-y-1.5 font-semibold">
                      <p className="text-purple-700 dark:text-purple-300 font-black">
                        ⚡ Silent Instant Printing (0 clicks needed!)
                      </p>
                      <p>You can run Google Chrome with silent printing so bills print instantly upon checkout with no dialog popup:</p>
                      <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                        chrome.exe --kiosk --kiosk-printing https://ai-pos-one.vercel.app
                      </div>
                      <p className="text-[11px] text-slate-500">Receipts will print out directly to the paper roll in 0.5s!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Quick Print Overview */
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                    <Check className="w-5 h-5" />
                    <span>Transaction Recorded Successfully</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    Total Amount: <span className="font-black text-emerald-700 dark:text-emerald-400">₹{Number(transaction.total || 0).toFixed(2)}</span> ({transaction.items?.length || 0} item lines). Ready to dispatch to your thermal paper machine.
                  </p>
                </div>

                {/* Best Practice Tip Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Recommended Printer Settings:
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 font-medium list-disc list-inside">
                    <li>Destination: Select your <b>POS-58</b>, <b>POS-80</b>, or thermal printer model</li>
                    <li>Paper Size: <b>{paperSize === '58mm' ? '58mm (2-inch roll)' : '80mm (3-inch roll)'}</b></li>
                    <li>Margins: <b>None</b> (or Minimum)</li>
                    <li>Options: Uncheck <b>Headers and footers</b></li>
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
}

export default ReceiptPrintModal
