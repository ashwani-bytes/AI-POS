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

useEffect(() => {
    if (isFirebaseConfigured()) {
      initFirebase()
      const unsub = onAuthStateChanged(getAuthInstance(), (u) => setUser(u))
      return () => unsub && unsub()
    }
    return () => {}
  }, [])

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
      <div className="flex-1 w-full h-full relative relative-view">
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
    <div className={`min-h-screen ${t.bg} ${t.text} flex`}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        <div className={`w-full flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
          <div className="flex flex-col">
            <span className="font-bold text-xl uppercase tracking-wide">
              {generalSettings?.storeName || (user ? user.displayName || user.email : 'My Store')}
            </span>
            <span className={`text-sm ${t.textSecondary} flex items-center gap-2 mt-0.5`}>
              {generalSettings?.storeAddress ? (
                <>
                  <span>📍</span> {generalSettings.storeAddress}
                  {generalSettings?.upiId && <span className="ml-2 font-mono text-xs opacity-70">| UPI: {generalSettings.upiId}</span>}
                </>
              ) : (
                'Welcome to your POS Dashboard'
              )}
            </span>
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
