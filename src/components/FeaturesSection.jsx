import React from 'react'
import { 
  Camera, 
  Printer, 
  QrCode, 
  FileSpreadsheet, 
  Package, 
  Tablet, 
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Check
} from 'lucide-react'

const FEATURES = [
  {
    icon: Camera,
    badge: 'Vision AI OCR',
    title: 'Instant Bill & Challan Scanner',
    description: 'Upload or capture delivery slips, handwritten cash memos, or GST invoices with your phone camera. Automatically extracts items and links catalog retail prices in 0.8s.',
    color: 'from-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    highlights: ['50ms Client-Side Compression', 'Auto-Fills Store Selling Price', 'Delivery Slip & Wholesale Parsing']
  },
  {
    icon: Printer,
    badge: 'Hardware Ready',
    title: 'Universal Thermal Printer Engine',
    description: 'Print crisp, zero-margin customer receipts on 80mm (3") or 58mm (2") roll paper. Supports USB, Bluetooth wireless, iPad AirPrint, and silent auto-cut Kiosk mode.',
    color: 'from-emerald-600 to-teal-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    highlights: ['80mm & 58mm Paper Switcher', 'Zero-Margin @page Roll Print', 'Test Print Button in Settings']
  },
  {
    icon: QrCode,
    badge: 'Smart Payment',
    title: 'Dynamic UPI QR & Auto-Print',
    description: 'Pre-fills bill amounts on dynamic UPI QR codes for GPay, PhonePe, and Paytm. Listens for payment confirmation in real time and automatically prints the paper bill.',
    color: 'from-purple-600 to-pink-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    highlights: ['Zero-Click Checkout Print', 'Built-in Audio Payment Chime', 'Customer E-Bill Verification Link']
  },
  {
    icon: FileSpreadsheet,
    badge: 'Excel & Sheets Sync',
    title: 'Everyday Sales & Stock Spreadsheet',
    description: 'A complete in-app spreadsheet hub inside Analytics & Reports. Tracks every day’s total sales, exact restocking dates and times, inventory valuations, and visual pie charts.',
    color: 'from-indigo-600 to-blue-600',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    highlights: ['Daily Sales Ledger by Date', 'Exact Restocking Date & Time', '1-Click Excel CSV Export']
  },
  {
    icon: Package,
    badge: 'Warehouse Sync',
    title: 'Real-Time Inventory & Margin Tracker',
    description: 'Automatically deducts stock upon checkout and alerts cashiers before shelves run dry. Tracks purchase cost, retail value, potential gross margins, and profit forecast.',
    color: 'from-amber-600 to-orange-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    highlights: ['Low-Stock Warning Banners', 'Automated SKU Categorization', 'Potential Profit & Valuation']
  },
  {
    icon: Tablet,
    badge: 'Universal Access',
    title: 'Every Device: Mobile, iPad & Laptop',
    description: 'Touch-optimized for Android smartphones, Apple iPads, Android tablets, and Windows/Mac billing laptops. Multi-counter cloud sync keeps registers unified.',
    color: 'from-cyan-600 to-blue-600',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    highlights: ['Bluetooth & OTG for Android', 'AirPrint for Apple iPadOS', 'USB Driver for Windows/Mac']
  }
]

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 lg:py-28 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            Enterprise Features Built for Local Stores
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything Your Store Needs in One AI Engine
          </h2>
          <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
            Say goodbye to slow billing queues, manual Excel typing, and misplaced paper invoices.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon

            return (
              <div 
                key={idx}
                className="group p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Icon & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl ${item.lightBg} ${item.iconColor} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {item.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default FeaturesSection
