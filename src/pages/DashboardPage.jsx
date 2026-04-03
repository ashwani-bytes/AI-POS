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

const DashboardPage = ({ onLogout }) => {
  const { t } = useTheme()
  const [activeView, setActiveView] = useState('pos')
  const [user, setUser] = useState(null)
  const [generalSettings, setGeneralSettings] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ... (Firebase effect)
  useEffect(() => {
    if (isFirebaseConfigured()) {
      initFirebase()
      const unsub = onAuthStateChanged(getAuthInstance(), (u) => setUser(u))
      return () => unsub && unsub()
    }
    return () => {}
  }, [])

  // ... (Settings fetch effect)
  useEffect(() => {
    if (user) {
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
    }
  }, [user, activeView])

  const renderView = () => {
    return (
      <div className="flex-1 w-full h-full relative">
        <div style={{ display: activeView === 'pos' ? 'block' : 'none', height: '100%' }}>
          <POSView />
        </div>
        {activeView === 'products' && <ProductsView />}
        {activeView === 'customers' && <CustomersView />}
        {activeView === 'reports' && <ReportsView />}
        {activeView === 'settings' && <SettingsView />}
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex flex-col lg:flex-row relative overflow-hidden`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Responsive Header */}
        <div className={`w-full flex items-center justify-between px-4 py-3 border-b ${t.border} ${t.bgSecondary}`}>
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 hover:bg-gray-700/50 rounded-lg transition"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
            </button>
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-xl uppercase tracking-wide truncate max-w-[150px] md:max-w-none">
                {generalSettings?.storeName || (user ? user.displayName || user.email : 'My Store')}
              </span>
              <span className={`text-[10px] md:text-sm ${t.textSecondary} flex items-center gap-1 mt-0.5 truncate`}>
                {generalSettings?.storeAddress ? (
                  <>
                    <span>📍</span> <span className="truncate">{generalSettings.storeAddress}</span>
                  </>
                ) : (
                  'POS Dashboard'
                )}
              </span>
            </div>
          </div>
          {user && (
            <button
              onClick={async () => { try { await signOut(getAuthInstance()) } finally { onLogout && onLogout() } }}
              className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.bgCard} hover:border-blue-500 transition text-sm`}
            >
              Sign out
            </button>
          )}
        </div>
        {renderView()}
      </div>
    </div>
  )
}

export default DashboardPage
