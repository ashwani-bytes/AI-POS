import React, { useState } from 'react'
import { 
  Camera, 
  Printer, 
  QrCode, 
  FileSpreadsheet, 
  Tablet, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Zap,
  Clock,
  ShieldCheck
} from 'lucide-react'

const SHOWCASE_TABS = [
  {
    id: 'ai-scan',
    title: 'Gemini Vision AI Scanner',
    shortTitle: 'AI Bill Scan',
    icon: Camera,
    color: 'blue',
    badge: '0.8s Camera Parsing',
    heading: 'Turn crumpled delivery challans into instant stock in 1 click',
    description: 'Stop typing item names and quantities by hand. Snap a phone camera photo of any vendor invoice or handwritten receipt. Our 20x client-side image compression shrinks 10MB snapshots in 50ms, and Gemini Vision AI extracts items, attaches retail prices, and restocks inventory automatically.',
    bulletPoints: [
      '20x HTML5 Canvas image compression for sub-second uploads',
      'Auto-matches catalog retail price if bill only has cost rate',
      'Categorizes items into Dairy, Bakery, Pantry, Snacks automatically',
      'Strict 25s timeout guards to prevent multi-minute waiting freezes'
    ],
    mockupType: 'scanner'
  },
  {
    id: 'thermal-printer',
    title: 'Thermal Bill Printer Machine',
    shortTitle: 'Thermal Printer',
    icon: Printer,
    color: 'emerald',
    badge: '80mm & 58mm Rolls',
    heading: 'Professional zero-margin receipts on any POS thermal printer',
    description: 'Connect standard 80mm (3-inch) or compact 58mm (2-inch) thermal printer machines. Clean ESC/POS formatted layout with store branding, GSTIN tax breakdown, tabular item alignment, dynamic QR code, and bottom paper tear clearance.',
    bulletPoints: [
      'Zero-margin @page print CSS: no website URLs, page numbers, or wasted paper',
      'Works via USB, Bluetooth, iPad AirPrint, and Network LAN/Wi-Fi',
      'Silent Kiosk Mode (--kiosk-printing) for instant 0.5s auto-cut bills',
      'One-click "Test Print Bill" in Store Settings to test alignment'
    ],
    mockupType: 'printer'
  },
  {
    id: 'upi-autoprint',
    title: 'Dynamic UPI QR & Auto-Print',
    shortTitle: 'UPI Auto-Print',
    icon: QrCode,
    color: 'purple',
    badge: '0-Click Instant Printing',
    heading: 'Customer pays via QR code, and your printer spits out the receipt',
    description: 'Generate dynamic UPI QR codes with pre-filled bill amounts for Google Pay, PhonePe, and Paytm. Our real-time listener checks payment confirmation every 1.5 seconds. The second payment is received, a retail payment chime rings, and the thermal printer automatically prints the bill!',
    bulletPoints: [
      'Pre-filled UPI link prevents customer typing errors on amount',
      'Web Audio payment success chime rings automatically',
      'Zero clicks needed from the cashier to finalize and print',
      'Customer e-bill link with 1-tap "Pay via UPI App" on mobile'
    ],
    mockupType: 'upi'
  },
  {
    id: 'spreadsheet',
    title: 'Sales & Stock Spreadsheet Hub',
    shortTitle: 'Live Spreadsheet',
    icon: FileSpreadsheet,
    color: 'indigo',
    badge: 'Excel & Google Sheets',
    heading: 'Everyday sales ledger, restock history, and visual pie charts',
    description: 'A complete in-app spreadsheet hub inside Analytics & Reports. Review daily sales, exact restocking dates and times, inventory valuations, and profit margins. Interactive SVG pie charts visualize revenue by category, payment methods, and live stock health with 1-click CSV exports.',
    bulletPoints: [
      'Daily Sales Ledger with revenue, orders, cash, and UPI breakdowns',
      'Stock Ledger tracking EXACT last stocked date & time for every SKU',
      'Interactive SVG Donut & Pie Charts with hover tooltips and legends',
      '1-Click CSV export ready for Microsoft Excel & Google Sheets'
    ],
    mockupType: 'spreadsheet'
  },
  {
    id: 'multi-device',
    title: 'Universal Multi-Device POS',
    shortTitle: 'Every Device',
    icon: Tablet,
    color: 'amber',
    badge: 'Mobile, iPad & Laptop',
    heading: 'Run your checkout counter on whatever device you have',
    description: 'Fully responsive cloud architecture designed for touchscreen tablets, iPads, Android smartphones, and billing laptops. Tailors printer settings automatically whether using Bluetooth on Android, AirPrint on iPadOS, or USB Kiosk mode on Windows.',
    bulletPoints: [
      'Apple iPad & iPhone support via AirPrint Wi-Fi thermal printers',
      'Android Tablet & Mobile support via Bluetooth & USB-OTG cables',
      'Windows & Mac laptop support with USB plug-and-play drivers',
      'Cloud synchronized: multiple counters share the same catalog'
    ],
    mockupType: 'devices'
  }
]

const InteractiveShowcase = ({ onGetStarted }) => {
  const [activeTabId, setActiveTabId] = useState('ai-scan')
  const currentTab = SHOWCASE_TABS.find(t => t.id === activeTabId) || SHOWCASE_TABS[0]

  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (SHOWCASE_TABS.some(t => t.id === hash)) {
        setActiveTabId(hash)
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  return (
    <section id="showcase" className="relative py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 transition-colors">
      {/* Invisible anchor targets for navbar navigation */}
      <div id="thermal-printer" className="sr-only" />
      <div id="spreadsheet" className="sr-only" />
      <div id="upi-auto-print" className="sr-only" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            Interactive Feature Tour
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Built for Real Indian Retail Counters
          </h2>
          <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
            Click through our 5 core pillars to see how AI POS eliminates manual paperwork and accelerates your daily billing.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 custom-scrollbar mb-10">
          {SHOWCASE_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTabId === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all duration-300 shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                <span>{tab.shortTitle}</span>
              </button>
            )
          })}
        </div>

        {/* Showcase Content Container */}
        <div className="p-6 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentTab.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {currentTab.heading}
              </h3>

              <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentTab.description}
              </p>

              {/* Bullet Points */}
              <div className="space-y-3 pt-2">
                {currentTab.bulletPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Visual Demo Box */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-slate-950 border-2 border-slate-800 text-white font-mono shadow-2xl relative overflow-hidden group">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-bold text-slate-300 uppercase tracking-wider">
                      {currentTab.shortTitle} Engine
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Live Simulation</span>
                </div>

                {/* Tab-Specific Visual Simulation */}
                {currentTab.id === 'ai-scan' && (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 space-y-1">
                      <span className="text-blue-400 font-bold block">[ 📷 Camera Image Uploaded ]</span>
                      <p className="text-slate-300">Raw Photo: 12.4 MB &rarr; Compressed: 340 KB (48ms)</p>
                    </div>
                    <div className="space-y-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>Bread crumb 1 kg</span>
                        <span className="text-emerald-400">+20 units (₹130.00)</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>Chilli Flakes 500gm</span>
                        <span className="text-emerald-400">+10 units (₹204.75)</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>Afghani Marinade 500gm</span>
                        <span className="text-emerald-400">+15 units (₹180.00)</span>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-center font-bold">
                      ✅ 45 Units Added to Warehouse Stock in 0.8s
                    </div>
                  </div>
                )}

                {currentTab.id === 'thermal-printer' && (
                  <div className="space-y-2 text-xs">
                    <div className="p-4 bg-white text-slate-900 rounded-xl shadow font-mono space-y-1 text-center">
                      <p className="font-black text-sm uppercase">HOT N' HAZY STORE</p>
                      <p className="text-[10px] text-slate-600">GSTIN: 03ABCDE1234F1Z5</p>
                      <div className="border-t border-b border-dashed border-slate-400 py-1 my-1 text-left">
                        <div className="flex justify-between">
                          <span>Bread crumb 1 kg x2</span>
                          <span>₹260.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chilli Flakes x1</span>
                          <span>₹204.75</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-1">
                        <span>TOTAL:</span>
                        <span>₹464.75</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">--- THERMAL AUTO-CUT ---</p>
                    </div>
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-center font-bold">
                      🖨️ Zero Margin Roll (80mm / 58mm)
                    </div>
                  </div>
                )}

                {currentTab.id === 'upi-autoprint' && (
                  <div className="space-y-3 text-xs text-center">
                    <div className="p-4 bg-white text-slate-900 rounded-xl flex flex-col items-center space-y-1">
                      <div className="w-20 h-20 bg-slate-900 rounded-lg text-white text-[10px] flex items-center justify-center">
                        [ DYNAMIC QR ]
                      </div>
                      <span className="font-black text-sm text-blue-600">₹913.91</span>
                      <span className="text-[10px] text-slate-500">Scan via GPay / PhonePe</span>
                    </div>
                    <div className="p-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg font-bold">
                      🔔 Soundbox Chime &rarr; Auto-Prints Paper Receipt
                    </div>
                  </div>
                )}

                {currentTab.id === 'spreadsheet' && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-slate-400 font-bold border-b border-slate-800 pb-1">
                        <span>DATE</span>
                        <span>ORDERS</span>
                        <span>TOTAL SALES</span>
                      </div>
                      <div className="flex justify-between text-slate-200">
                        <span>05 Nov 2026</span>
                        <span>4 bills</span>
                        <span className="text-emerald-400 font-black">₹974.35</span>
                      </div>
                      <div className="flex justify-between text-slate-200">
                        <span>30 Jul 2026</span>
                        <span>1 bill</span>
                        <span className="text-emerald-400 font-black">₹251.34</span>
                      </div>
                      <div className="flex justify-between text-slate-200">
                        <span>12 May 2026</span>
                        <span>1 bill</span>
                        <span className="text-emerald-400 font-black">₹947.09</span>
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-center font-bold">
                      📑 Export Daily Sales & Stock (.CSV)
                    </div>
                  </div>
                )}

                {currentTab.id === 'multi-device' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">🍏 Apple iPad</span>
                        <span className="text-emerald-400">AirPrint Wi-Fi</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">📱 Android Mobile</span>
                        <span className="text-emerald-400">Bluetooth / OTG</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">💻 Windows / Mac</span>
                        <span className="text-emerald-400">USB & Silent Kiosk</span>
                      </div>
                    </div>
                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg text-center font-bold">
                      ⚡ 100% Touch & Mobile Responsive
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default InteractiveShowcase
