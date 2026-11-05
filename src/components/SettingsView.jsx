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
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            setSettings(prev => ({
              ...prev,
              ...data,
              taxRate: data.taxRate !== undefined && data.taxRate !== null ? Number(data.taxRate) : prev.taxRate
            }))
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
      const payload = {
        ...settings,
        taxRate: Number(settings.taxRate) || 0
      }
      const res = await api.post('/api/settings', payload)
      if (res.ok) {
        showToast('success', 'All Store Settings completely saved!')
      } else {
        const d = await res.json().catch(() => ({}))
        showToast('error', d.error || 'Failed to save settings externally')
      }
    } catch (e) {
      showToast('error', 'Network error trying to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto pb-28">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Store Configuration</h1>
          <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">Configure business profile, UPI digital payments, and GST tax settings.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 font-black text-white text-sm md:text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-95"
        >
          {saving ? 'Saving...' : 'SAVE ALL SETTINGS'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-l-8 border-l-blue-600">
          <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Store Identity & Location</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Store Name / Brand</label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                placeholder="My Awesome Retail Store"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Store Address & GSTIN</label>
              <textarea
                name="storeAddress"
                value={settings.storeAddress}
                onChange={handleChange}
                placeholder="123 Main St, City, State, ZIP - GSTIN: XXXXX"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                rows="2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Official Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Support Email</label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  placeholder="store@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm mb-2 font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  Merchant UPI ID <span className="text-xs normal-case font-bold">(For QR code)</span>
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={settings.upiId}
                  onChange={handleChange}
                  placeholder="storemanager@okicici"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-white placeholder-emerald-700/50 focus:border-emerald-600 outline-none text-base font-black shadow-sm transition"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-t-8 border-t-indigo-600">
            <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Checkout & GST Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Default Tax Rate (%)</label>
                <input
                  type="number"
                  name="taxRate"
                  value={settings.taxRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none text-base font-black shadow-sm transition"
                />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-md border-t-8 border-t-purple-600">
            <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">Receipt Output</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Invoice Header Greeting</label>
                <input
                  type="text"
                  name="receiptHeader"
                  value={settings.receiptHeader}
                  onChange={handleChange}
                  placeholder="Thank you for shopping with us!"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm mb-2 text-slate-900 dark:text-slate-200 font-black uppercase tracking-wider">Invoice Footer Note</label>
                <input
                  type="text"
                  name="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={handleChange}
                  placeholder="Visit again for 10% OFF!"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none text-base font-semibold shadow-sm transition"
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
