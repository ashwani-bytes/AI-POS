import React from 'react'
import { Check, X, Sparkles, TrendingUp, Zap, Clock, ShieldCheck } from 'lucide-react'

const COMPARISON_ROWS = [
  {
    feature: 'Bill Restocking & Inward Stock',
    legacy: 'Manual typing product by product (10-20 mins)',
    aipos: '0.8s phone camera scan via Gemini Vision AI',
    highlight: true
  },
  {
    feature: 'Thermal Paper Bill Printing',
    legacy: 'Browser prints website URL, dates & wastes paper',
    aipos: 'Zero-margin 80mm & 58mm roll with auto-cut support',
    highlight: true
  },
  {
    feature: 'UPI QR Payment & Billing',
    legacy: 'Customer types amount; cashier manually verifies',
    aipos: 'Dynamic QR auto-prints receipt on payment confirmation',
    highlight: true
  },
  {
    feature: 'Sales & Inventory Records',
    legacy: 'Cluttered paper notebooks or offline Excel files',
    aipos: 'Live in-app spreadsheet with pie charts & 1-click CSV export',
    highlight: true
  },
  {
    feature: 'Device Compatibility',
    legacy: 'Locked to heavy, expensive Windows desktop boxes',
    aipos: 'Runs on Apple iPad, Android Mobile, Tablets, and Laptops',
    highlight: false
  },
  {
    feature: 'Zero-Price Item Protection',
    legacy: 'Prone to cashier mistakes selling at ₹0.00',
    aipos: 'Auto-resolves retail prices + inline rate alert guards',
    highlight: false
  }
]

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Why Switch to AI POS?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Traditional POS vs. AI POS Engine
          </h2>
          <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
            See the difference modern artificial intelligence and thermal roll hardware integration make.
          </p>
        </div>

        {/* Side-by-Side Comparison Table Card */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-950/80 p-5 md:p-6 border-b-2 border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-black uppercase tracking-wider">
            <div className="col-span-4 text-slate-700 dark:text-slate-300">Feature / Workflow</div>
            <div className="col-span-4 text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <X className="w-4 h-4" />
              <span>Old Traditional POS</span>
            </div>
            <div className="col-span-4 text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>AI POS Engine 2.0</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
            {COMPARISON_ROWS.map((row, idx) => (
              <div 
                key={idx}
                className={`grid grid-cols-12 p-4 md:p-5 items-center transition-colors ${
                  row.highlight 
                    ? 'bg-blue-50/30 dark:bg-blue-950/10' 
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="col-span-4 font-black text-slate-900 dark:text-white pr-2">
                  {row.feature}
                </div>
                
                <div className="col-span-4 font-medium text-slate-500 dark:text-slate-400 flex items-start gap-2 pr-2">
                  <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-950 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-2.5 h-2.5" />
                  </div>
                  <span>{row.legacy}</span>
                </div>

                <div className="col-span-4 font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{row.aipos}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* 4 Impact Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-14 max-w-5xl mx-auto">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">90%</p>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Faster Billing Process</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">0.8s</p>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Camera Bill Restocking</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400">₹0</p>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Extra Hardware Needed</span>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-amber-500">100%</p>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">GST & Tax Compliant</span>
          </div>
        </div>

      </div>
    </section>
  )
}

export default BenefitsSection
