import React, { useState } from 'react'
import { ShoppingCart, Sun, Moon, Menu, X, ArrowRight, Sparkles, Download, Tablet, Smartphone } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import InstallAppModal from './InstallAppModal'

const Navbar = ({ onGetStarted }) => {
  const { isDarkMode, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [installModalOpen, setInstallModalOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'AI Bill Scanner', href: '#showcase' },
    { label: 'Thermal Printer', href: '#thermal-printer' },
    { label: 'Spreadsheet', href: '#spreadsheet' },
    { label: 'Why Us', href: '#benefits' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ]

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Brand */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all duration-300">
              <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  AI POS
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>2.0 Pro</span>
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                Smart Retail Operating System
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 relative group"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>

          {/* Right Action: Dual-Pill Theme Switcher & Get Started CTA */}
          <div className="hidden sm:flex items-center gap-3.5">
            {/* Dual-Pill Segmented Theme Switcher */}
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-black transition-all duration-200 ${
                  !isDarkMode 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
                title="Switch to Light Mode"
              >
                <Sun className={`w-3.5 h-3.5 ${!isDarkMode ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-black transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-800 text-blue-400 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Dark Mode"
              >
                <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>Dark</span>
              </button>
            </div>

            <button
              onClick={() => setInstallModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 flex items-center gap-1.5 transition-all shadow-sm"
              title="Install AI POS App on iPad or Mobile"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Install App</span>
            </button>

            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95"
            >
              <span>Launch Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setInstallModalOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-blue-600 dark:text-blue-400"
              title="Install App"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-fade-in">
          <div className="px-5 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 rounded-lg"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setInstallModalOpen(true)
                }}
                className="w-full py-3 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-800"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Install Standalone App on iPad/Mobile</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onGetStarted()
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <span>Launch POS Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install App Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </nav>
  )
}

export default Navbar
