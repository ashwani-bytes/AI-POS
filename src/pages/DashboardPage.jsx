import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import POSView from '../components/POSView'
import ProductsView from '../components/ProductsView'
import CustomersView from '../components/CustomersView'
import ReportsView from '../components/ReportsView'
import SettingsView from '../components/SettingsView'
import { onAuthStateChanged, signOut, getAuthInstance, initFirebase, isFirebaseConfigured } from '../lib/firebase'
import { api } from '../lib/api'
import { Store, Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const DashboardPage = ({ onLogout }) => {
  const { t, isDarkMode, toggleTheme, setTheme } = useTheme()
  const [activeView, setActiveView] = useState('pos')
  const [user, setUser] = useState(null)
  const [generalSettings, setGeneralSettings] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1200
    }
    return false
  })

  // Firebase auth state listener
  useEffect(() => {
    // Pre-warm backend API immediately in background on app load
    api.get('/api/health').catch(() => {})

    if (isFirebaseConfigured()) {
      initFirebase()
      const unsub = onAuthStateChanged(getAuthInstance(), (u) => setUser(u))
      return () => unsub && unsub()
    }
    return () => {}
  }, [])

  // Settings fetch effect - ONLY on user or mount, NOT on every activeView switch!
  useEffect(() => {
    const fetchGeneralSettings = async () => {
      try {
        const res = await api.get('/api/settings')
        if (res.ok) {
          setGeneralSettings(await res.json())
        }
      } catch (error) {
        console.error('Header failed to fetch general settings', error)
      }
    }
    fetchGeneralSettings()
  }, [user])

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex flex-col lg:flex-row relative overflow-hidden font-sans`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:inset-auto lg:z-auto
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar 
          activeView={activeView} 
          setActiveView={(view) => {
            setActiveView(view);
            setIsSidebarOpen(false); // Close sidebar on mobile after selection
          }} 
          onLogout={onLogout}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen bg-slate-100 dark:bg-slate-950">
        {/* Modern Elevated Header */}
        <header className="w-full flex items-center justify-between px-5 md:px-7 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button 
              className="lg:hidden p-2.5 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-600 dark:text-slate-400"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
            </button>

            {/* Desktop / iPad Sidebar Slim Toggle */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Slim Mode'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Store Avatar & Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 font-black text-base shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-base md:text-xl tracking-tight text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs md:max-w-none">
                    {generalSettings?.storeName || (user ? user.displayName || user.email : 'My Retail POS')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE
                  </span>
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate mt-0.5">
                  {generalSettings?.storeAddress ? (
                    <span className="truncate max-w-[220px] sm:max-w-md">📍 {generalSettings.storeAddress}</span>
                  ) : (
                    <span>Cloud Synced Smart Terminal</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
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
                <Sun className={`w-4 h-4 ${!isDarkMode ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Light</span>
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
                <Moon className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <button
              onClick={async () => { 
                try { 
                  if (isFirebaseConfigured()) await signOut(getAuthInstance()) 
                } finally { 
                  onLogout && onLogout() 
                } 
              }}
              className="px-4 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition text-xs md:text-sm font-black flex items-center gap-2 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* View Container - Persistent DOM with display toggle for 0ms tab switching! */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div style={{ display: activeView === 'pos' ? 'block' : 'none', height: '100%' }}>
            <POSView />
          </div>
          <div style={{ display: activeView === 'products' ? 'block' : 'none', minHeight: '100%' }}>
            <ProductsView />
          </div>
          <div style={{ display: activeView === 'customers' ? 'block' : 'none', minHeight: '100%' }}>
            <CustomersView />
          </div>
          <div style={{ display: activeView === 'reports' ? 'block' : 'none', minHeight: '100%' }}>
            <ReportsView active={activeView === 'reports'} />
          </div>
          <div style={{ display: activeView === 'settings' ? 'block' : 'none', minHeight: '100%' }}>
            <SettingsView />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
