import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'

const CustomersView = () => {
  const { t } = useTheme()
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ type: 'info', message: '' })

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(prev => prev.message === message ? { type: 'info', message: '' } : prev)
    }, 6000)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(Array.isArray(data) ? data : [])
      } else {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data?.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Failed to fetch customers:', { status: response.status, data })
        showToast('error', `Failed to load customers: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      const errorMsg = error.message || 'Failed to fetch customers. Please check if the server is running.'
      showToast('error', errorMsg)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showToast('warning', 'Customer name is required')
      return
    }

    const path = editingCustomer
      ? `/api/customers/${editingCustomer.id}`
      : '/api/customers'

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim()
      }

      const response = editingCustomer
        ? await api.put(path, payload)
        : await api.post(path, payload)

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        await fetchCustomers()
        setShowModal(false)
        resetForm()
        showToast('success', editingCustomer ? 'Customer updated' : 'Customer created')
      } else {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`
        console.error('Save customer error:', { status: response.status, data, response })
        showToast('error', errorMsg)
      }
    } catch (error) {
      console.error('Save failed:', error)
      const errorMsg = error.message || 'Failed to save customer. Please check your connection and try again.'
      showToast('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return

    try {
      const response = await api.delete(`/api/customers/${id}`)
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        await fetchCustomers()
        showToast('success', 'Customer deleted')
      } else {
        const msg = data?.error || 'Failed to delete customer'
        showToast('error', msg)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      showToast('error', 'Failed to delete customer')
    }
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    })
  }

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto pb-28">
      <LoadingBar active={saving} label={saving ? (editingCustomer ? 'Updating customer...' : 'Creating customer...') : ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Customer Directory</h1>
          <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 mt-1">Manage VIP clients, contact records, and loyalty accounts.</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-sm md:text-base font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div>
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition text-base font-semibold shadow-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-800 shadow-md overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[750px] text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-800">
            <tr>
              <th className="p-4 text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Phone</th>
              <th className="p-4 text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Email</th>
              <th className="p-4 text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Address</th>
              <th className="p-4 text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-600 dark:text-slate-400 font-semibold text-base">
                  {searchQuery ? 'No matching customers found.' : 'No customers enrolled yet. Click "Add Customer" to register one.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4 font-black text-base md:text-lg text-slate-900 dark:text-white">{customer.name}</td>
                  <td className="p-4 font-semibold text-sm md:text-base text-slate-800 dark:text-slate-200">{customer.phone || '—'}</td>
                  <td className="p-4 font-semibold text-sm md:text-base text-slate-800 dark:text-slate-200">{customer.email || '—'}</td>
                  <td className="p-4 font-semibold text-sm md:text-base text-slate-700 dark:text-slate-300 max-w-xs truncate">{customer.address || '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition shadow-sm"
                        title="Edit Customer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition shadow-sm"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-black mb-5 text-slate-900 dark:text-white">
              {editingCustomer ? 'Edit Customer Profile' : 'Enroll New Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Customer Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-semibold"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-semibold"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-semibold"
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div>
                <label className="block text-slate-900 dark:text-slate-200 mb-1.5 font-black uppercase tracking-wider text-xs md:text-sm">Billing Address / Notes</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-600 outline-none transition text-base font-semibold"
                  placeholder="Customer address, landmark, or GST details..."
                  rows="3"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold transition text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition disabled:opacity-50 text-base"
                >
                  {saving ? 'Saving...' : (editingCustomer ? 'Update Profile' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersView
