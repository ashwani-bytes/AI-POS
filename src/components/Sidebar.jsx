import React, { useState } from 'react'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Sparkles, 
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import InstallAppModal from './InstallAppModal'

const Sidebar = ({ activeView, setActiveView, onLogout, onClose, isCollapsed, onToggleCollapse }) => {
  const { t, isDarkMode, setTheme } = useTheme()
  const [installModalOpen, setInstallModalOpen] = useState(false)

  const menuItems = [
    { id: 'pos', label: 'Point of Sale', badge: 'Billing', icon: ShoppingCart },
    { id: 'products', label: 'Inventory Catalog', badge: null, icon: Package },
    { id: 'customers', label: 'Customers', badge: null, icon: Users },
    { id: 'reports', label: 'Analytics & Reports', badge: 'Live', icon: BarChart3 },
    { id: 'settings', label: 'Store Settings', badge: null, icon: Settings },
  ]

  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-20' : 'w-64'} 
        bg-white dark:bg-slate-900 flex flex-col h-full 
        border-r border-slate-200 dark:border-slate-800 shadow-sm select-none 
        transition-all duration-300 relative
      `}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg tracking-wider shrink-0">
            AI
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">AI POS</span>
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Smart Retail</p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Collapse / Expand Toggle Button for Tablet / Desktop */}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3.5 top-16 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shadow-md hover:bg-blue-50 dark:hover:bg-slate-700 transition z-30"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Slim Mode'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {!isCollapsed && (
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 py-1 block">
            Operations
          </span>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-3'} rounded-xl
                transition-all duration-200 text-sm font-black group relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-white'
                }
              `}
            >
              <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'} min-w-0`}>
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!isCollapsed && item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.badge === 'Live' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Profile & Session */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">Terminal Ready</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">v1.0.2</span>
          </div>
        )}

        {/* Install App Button */}
        <button
          type="button"
          onClick={() => setInstallModalOpen(true)}
          className={`
            w-full ${isCollapsed ? 'p-2.5 justify-center' : 'py-2 px-3 justify-center'} 
            rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 
            border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 
            flex items-center gap-2 text-xs font-black transition shadow-sm
          `}
          title="Install App on iPad or Mobile"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          {!isCollapsed && <span className="truncate">Install App</span>}
        </button>

        {/* Theme & Logout */}
        <div className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col' : ''}`}>
          {/* Dual Segmented Light / Dark Toggle */}
          {!isCollapsed ? (
            <div className="flex-1 flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
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
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
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
          ) : (
            <button
              type="button"
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className={`
              ${isCollapsed ? 'p-2.5 w-full justify-center' : 'p-2.5'}
              flex items-center justify-center rounded-xl border border-red-300 dark:border-red-500/30 
              text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition shadow-sm
            `}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PWA App Installation Guide Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </aside>
  )
}

export default Sidebar
