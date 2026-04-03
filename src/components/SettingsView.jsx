import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import Toast from './Toast'
import { api } from '../lib/api'

const SettingsView = () => {
  const { t } = useTheme()
  
  const [settings, setSettings] = useState({
    storeName: '',
    storeAddress: '',
    phone: '',
    email: '',
    upiId: '',
    taxRate: 18,
    receiptHeader: '',
    receiptFooter: ''
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ type: 'info', message: '' })

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(prev => prev.message === message ? { type: 'info', message: '' } : prev)
    }, 5000)
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (Object.keys(data).length > 0) {
            setSettings(prev => ({ ...prev, ...data }))
          }
        }
      } catch (error) {
        console.error('Failed to load settings', error)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.post('/api/settings', settings)
      if (res.ok) {
        showToast('success', 'All Store Settings completely saved!')
      } else {
        showToast('error', 'Failed to save settings externally')
      }
    } catch (e) {
      showToast('error', 'Network error trying to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 relative pb-24">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Store Configuration</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full md:w-auto px-8 py-3 ${t.accent} ${t.accentHover} font-bold text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-95`}
        >
          {saving ? 'Saving...' : 'SAVE ALL SETTINGS'}
        </button>
      </div>

      <div className="space-y-6">
        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg shadow-sm border-l-4 border-l-blue-500`}>
          <h2 className="text-xl font-bold mb-4">Store Identity</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Store Name</label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                placeholder="My Awesome Retail Store"
                className={`w-full px-4 py-3 rounded-lg border ${t.input} transition-colors`}
              />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Store Address (GST/Location)</label>
              <textarea
                name="storeAddress"
                value={settings.storeAddress}
                onChange={handleChange}
                placeholder="123 Main St, City, State, ZIP - GSTIN: XXXXX"
                className={`w-full px-4 py-3 rounded-lg border ${t.input}`}
                rows="2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className={`w-full px-4 py-3 rounded-lg border ${t.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  placeholder="store@example.com"
                  className={`w-full px-4 py-3 rounded-lg border ${t.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 font-bold text-emerald-500 flex items-center gap-1`}>
                  Merchant UPI ID <span className="text-xs font-normal">(For QR)</span>
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={settings.upiId}
                  onChange={handleChange}
                  placeholder="storemanager@okicici"
                  className={`w-full px-4 py-3 rounded-lg border-2 border-emerald-500/30 outline-none focus:border-emerald-500 ${t.input} bg-emerald-50/5`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg shadow-sm border-t-4 border-t-indigo-500`}>
            <h2 className="text-xl font-bold mb-4">Checkout Processing</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Default Tax Rate (%)</label>
                <input
                  type="number"
                  name="taxRate"
                  value={settings.taxRate}
                  onChange={handleChange}
                  step="0.01"
                  className={`w-full px-4 py-3 rounded-lg border ${t.input}`}
                />
              </div>
            </div>
          </div>

          <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg shadow-sm border-t-4 border-t-purple-500`}>
            <h2 className="text-xl font-bold mb-4">Receipt Output</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Invoice Custom Greeting</label>
                <input
                  type="text"
                  name="receiptHeader"
                  value={settings.receiptHeader}
                  onChange={handleChange}
                  placeholder="Thank you for shopping with us!"
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary} font-semibold`}>Invoice Footer Note</label>
                <input
                  type="text"
                  name="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={handleChange}
                  placeholder="Visit again for 10% OFF!"
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default SettingsView
