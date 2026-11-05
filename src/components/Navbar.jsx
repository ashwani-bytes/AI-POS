import React, { useState } from 'react'
import { ShoppingCart, Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Navbar = ({ onGetStarted }) => {
  const { t, isDarkMode, toggleTheme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className={`${t.bgSecondary} border-b ${t.border} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">AI POS</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className={`${t.textSecondary} hover:${t.text} transition`}>Features</a>
            <a href="#benefits" className={`${t.textSecondary} hover:${t.text} transition`}>Benefits</a>
            <a href="#pricing" className={`${t.textSecondary} hover:${t.text} transition`}>Pricing</a>
            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                  !isDarkMode 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
                title="Switch to Light Mode"
              >
                <Sun className={`w-3.5 h-3.5 ${!isDarkMode ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900 text-blue-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Switch to Dark Mode"
              >
                <Moon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>Dark</span>
              </button>
            </div>
            <button onClick={onGetStarted} className={`px-6 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg transition`}>
              Get Started
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden ${t.bgSecondary} border-t ${t.border}`}>
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className={`block ${t.textSecondary}`}>Features</a>
            <a href="#benefits" className={`block ${t.textSecondary}`}>Benefits</a>
            <a href="#pricing" className={`block ${t.textSecondary}`}>Pricing</a>
            <button onClick={onGetStarted} className={`w-full px-6 py-2 ${t.accent} text-white rounded-lg`}>
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
