import React from 'react'
import { ArrowRight, Sparkles, Printer, QrCode, Zap, CheckCircle2, ShieldCheck, Laptop } from 'lucide-react'

const CTASection = ({ onGetStarted }) => {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Decorative Background Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 sm:p-12 lg:p-16 text-white shadow-2xl shadow-blue-600/30">
          
          {/* Subtle Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Zero Hardware Lock-In • 1-Click Launch</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Ready to Upgrade Your Retail Billing in Under 60 Seconds?
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed font-medium">
              Join thousands of modern shopkeepers, supermarkets, and cafes running on AI POS 2.0. Scan supplier bills with your camera, auto-print receipts on any thermal printer, and track daily sales spreadsheets with interactive pie charts.
            </p>

            {/* Feature Bullets */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-blue-100">
              <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                <Printer className="w-4 h-4 text-amber-300" />
                <span>80mm & 58mm Thermal Ready</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                <QrCode className="w-4 h-4 text-purple-300" />
                <span>UPI Dynamic QR Auto-Print</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                <Laptop className="w-4 h-4 text-cyan-300" />
                <span>iPad, Mobile & PC</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 font-black text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span>Launch Free Register Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#showcase"
                className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base rounded-2xl border border-white/20 backdrop-blur-sm transition-all duration-300 text-center"
              >
                Explore Live Demo Tour
              </a>
            </div>

            {/* Trust Footer */}
            <div className="pt-4 flex items-center justify-center gap-6 text-[11px] font-bold text-blue-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Bank-Grade Encryption</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Sub-Second Fast Checkout</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
