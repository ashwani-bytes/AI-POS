import React from 'react'
import { 
  Sparkles, 
  ChevronRight, 
  Printer, 
  Camera, 
  QrCode, 
  FileSpreadsheet, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  TrendingUp,
  Tablet,
  Check
} from 'lucide-react'

const Hero = ({ onGetStarted }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      
      {/* Subtle Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Top Content */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 shadow-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
              AI POS 2.0 Engine • Thermal Bill Printer & UPI Auto-Print Live
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] transition-colors">
            Smart POS for Modern Retail,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">
              Supercharged by AI
            </span>
          </h1>

          {/* Value Subtitle */}
          <p className="text-base sm:text-xl font-semibold text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed transition-colors">
            Scan paper vendor bills in seconds with <span className="text-blue-600 dark:text-blue-400 font-bold">Gemini Vision AI</span>, print clean receipts on any <span className="text-emerald-600 dark:text-emerald-400 font-bold">thermal machine</span>, auto-cut bills upon customer <span className="text-purple-600 dark:text-purple-400 font-bold">UPI QR payment</span>, and track daily profits in live spreadsheets.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base md:text-lg rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              <span>Launch Free Register</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="#thermal-printer"
              className="w-full sm:w-auto px-7 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-300 dark:border-slate-800 hover:border-blue-500 text-slate-800 dark:text-slate-200 font-black text-base rounded-2xl shadow-sm transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <Printer className="w-5 h-5 text-emerald-600" />
              <span>Thermal Printer Setup</span>
            </a>
          </div>

          {/* Quick Credibility Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>Works on Mobile, iPad & Laptop</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              <span>GST & Tax Invoice Ready</span>
            </div>
          </div>

        </div>

        {/* HERO INTERACTIVE PRODUCT SHOWCASE MOCKUP */}
        <div className="mt-14 sm:mt-20 max-w-6xl mx-auto relative group">
          
          {/* Ambient Glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[36px] blur-xl opacity-30 group-hover:opacity-50 transition duration-700" />

          {/* Terminal Mockup Card */}
          <div className="relative rounded-[32px] bg-slate-900 border-4 border-slate-800 shadow-2xl overflow-hidden text-white">
            
            {/* Window Top Bar */}
            <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 text-xs font-mono font-bold text-slate-400 hidden sm:inline">
                  ai-pos.live/checkout • Register #01
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Terminal Active</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">GSTIN: 03ABCDE1234F1Z5</span>
              </div>
            </div>

            {/* Simulated Live POS Register Interior */}
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90">
              
              {/* Left Column: Quick Catalog & Scanned Bill */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* AI Bill Scanner Pill */}
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-blue-400 uppercase tracking-wider block">
                        Gemini Vision Bill Parser
                      </span>
                      <p className="text-sm font-bold text-slate-200">
                        Delivery challan parsed in 0.8s • 3 items auto-matched
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-emerald-500/20 text-emerald-400">
                    +30 Units Restocked
                  </span>
                </div>

                {/* Sample Cart Table */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-400 pb-2 border-b border-slate-800">
                    <span>ITEM NAME</span>
                    <span>QTY</span>
                    <span>RATE</span>
                    <span>TOTAL</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-slate-200 py-1">
                    <span className="truncate max-w-[160px]">Bread crumb 1 kg</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">2</span>
                    <span className="text-slate-400 text-xs">₹130.00</span>
                    <span className="font-mono text-emerald-400 font-black">₹260.00</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-slate-200 py-1">
                    <span className="truncate max-w-[160px]">Chilli Flakes 500gm</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">1</span>
                    <span className="text-slate-400 text-xs">₹204.75</span>
                    <span className="font-mono text-emerald-400 font-black">₹204.75</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-slate-200 py-1">
                    <span className="truncate max-w-[160px]">Oregano Spicy Mix</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">1</span>
                    <span className="text-slate-400 text-xs">₹309.75</span>
                    <span className="font-mono text-emerald-400 font-black">₹309.75</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-black">
                    <span className="text-xs text-slate-400 uppercase">Subtotal + GST (18%)</span>
                    <span className="text-xl text-white font-mono">₹913.91</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Thermal Print & UPI Auto-Confirm Visualizer */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                
                {/* Dynamic QR Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-purple-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase">
                      <QrCode className="w-4 h-4" />
                      <span>Dynamic UPI QR</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  
                  <div className="p-3 bg-white rounded-xl flex items-center justify-center">
                    <div className="text-center font-mono text-xs text-slate-900 font-black space-y-1">
                      <div className="w-24 h-24 bg-slate-900 mx-auto rounded-lg flex items-center justify-center text-white text-[10px]">
                        [ UPI QR CODE ]
                      </div>
                      <p className="text-[11px] text-slate-700">Scan to Pay ₹913.91</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center text-xs font-black flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Auto-Prints Receipt on Payment!</span>
                  </div>
                </div>

                {/* Thermal Machine Cut Indicator */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="font-black text-white block">Thermal Machine (80mm / 58mm)</span>
                      <span className="text-slate-400 font-semibold text-[11px]">Zero Margin • Auto-Cutter Ready</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px]">
                    USB / BT / AirPrint
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* Floating Metric Card 1 */}
          <div className="absolute -top-6 -left-6 hidden md:flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl text-slate-900 dark:text-white transform -rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Today Sales</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹83,530.79</p>
            </div>
          </div>

          {/* Floating Metric Card 2 */}
          <div className="absolute -bottom-6 -right-6 hidden md:flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl text-slate-900 dark:text-white transform rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Spreadsheet Ledger</span>
              <p className="text-sm font-black text-purple-600 dark:text-purple-400">Excel / Google Sheets CSV</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}

export default Hero
