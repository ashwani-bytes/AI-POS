import React, { useState } from 'react'
import { Check, Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react'

const PricingSection = ({ onGetStarted }) => {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'

  return (
    <section id="pricing" className="py-20 lg:py-28 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            Simple & Transparent Plans
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Fair Pricing for Every Indian Retailer
          </h2>
          <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
            Start completely free. Upgrade only when you open more billing counters or branches.
          </p>

          {/* Billing Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs sm:text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-8 rounded-full bg-slate-200 dark:bg-slate-800 p-1 relative transition-colors border border-slate-300 dark:border-slate-700"
            >
              <div 
                className={`w-6 h-6 rounded-full bg-blue-600 shadow-md transform transition-transform duration-200 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500'}`}>
              <span>Yearly</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Card 1: Starter Free Forever */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Starter Free</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Individual Shop
                </span>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">₹0</p>
              <p className="text-xs font-semibold text-slate-500 mb-6">Free forever. No credit card needed.</p>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                {[
                  '1 POS Register Terminal',
                  'Unlimited Bills & Invoices',
                  'Gemini Vision AI Scanner (50/mo)',
                  'Thermal Bill Printer (80mm & 58mm)',
                  'Dynamic Pre-filled UPI QR',
                  'In-App Sales & Stock Spreadsheet',
                  'Standard GST Tax Invoices'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 font-black text-sm text-slate-800 dark:text-white transition active:scale-95"
            >
              Start Free Register
            </button>
          </div>

          {/* Card 2: Pro Store (Highlighted) */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-2xl relative flex flex-col justify-between transform md:-translate-y-2">
            
            {/* Best Value Ribbon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Most Popular for Retail</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Pro Store</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                  Supermarket
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {billingCycle === 'monthly' ? '₹499' : '₹399'}
                </p>
                <span className="text-xs font-bold text-slate-500">/ month</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mb-6">
                {billingCycle === 'yearly' ? 'Billed annually (₹4,788/yr)' : 'Billed monthly'}
              </p>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                {[
                  'Up to 3 Concurrent Terminals (iPad, Phone, PC)',
                  'Unlimited Gemini AI Bill Scans',
                  'Instant Kiosk Auto-Cut Thermal Printing',
                  'Soundbox Chime on UPI QR Payment',
                  'Complete Excel & Google Sheets CSV Exports',
                  'Exact Restocking Timestamps & Margin Alerts',
                  'Store Logo & Custom Tax Invoices',
                  'Priority 24/7 Store Support'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Get Started Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Multi-Branch Chain */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Enterprise</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Multiple Outlets
                </span>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white mb-2">Custom</p>
              <p className="text-xs font-semibold text-slate-500 mb-6">For multi-outlet grocery and franchise chains.</p>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                {[
                  'Unlimited Registers across All Branches',
                  'Central Warehouse & Stock Transfers',
                  'Tally & SAP ERP Accounting Sync',
                  'Multi-Counter Cashier Role Permissions',
                  'Dedicated Database Cluster',
                  'Custom Thermal Invoice Layouts',
                  'Dedicated Account Manager'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="mt-8 w-full py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-purple-600 font-black text-sm text-slate-800 dark:text-white transition active:scale-95"
            >
              Contact Sales
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}

export default PricingSection
