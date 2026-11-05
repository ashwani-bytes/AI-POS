import React from 'react'
import { ShoppingCart, Sparkles, Printer, QrCode, BarChart3, Smartphone, Laptop, ShieldCheck, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    AI POS
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>v2.0 Pro</span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Smart Retail Operating System
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              The next-generation retail POS built for modern stores. Intelligent camera bill scanner, ESC/POS thermal printing engine, UPI QR auto-billing, and in-app Excel & Google Sheets sales analytics.
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational • Cloud & Local Engine Active</span>
            </div>
          </div>

          {/* Column 1: Core Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Capabilities
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <a href="#showcase" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>AI Camera Scanner</span>
                </a>
              </li>
              <li>
                <a href="#thermal-printer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Thermal Bill Printer</span>
                </a>
              </li>
              <li>
                <a href="#upi-auto-print" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-purple-500" />
                  <span>UPI QR Auto-Print</span>
                </a>
              </li>
              <li>
                <a href="#spreadsheet" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sales Spreadsheet & Pie Charts</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Hardware & Devices */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Hardware
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>80mm & 58mm Receipt Rolls</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>iPad & Android Tablets</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Windows & macOS Kiosks</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Bluetooth, Wi-Fi & USB</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links & Help */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Product & Help
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Features Overview
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 cursor-not-allowed">
                  GST Invoice Compliance
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} AI POS Inc. Designed for modern retail businesses & store owners.
          </p>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span>Powered by</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Google Gemini Vision AI</span>
            <span>&</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">React</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
