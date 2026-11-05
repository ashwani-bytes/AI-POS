import React, { useState, useEffect } from 'react'
import { CheckCircle2, Smartphone, ShieldCheck, ArrowRight, Store, Receipt } from 'lucide-react'
import { api } from '../lib/api'

const PublicInvoicePage = () => {
  const [txnRef, setTxnRef] = useState('')
  const [amount, setAmount] = useState('0.00')
  const [storeName, setStoreName] = useState('AI POS Store')
  const [upiId, setUpiId] = useState('')
  const [paid, setPaid] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    // Extract txnRef from URL path (e.g. /invoice/TXN123456)
    const parts = window.location.pathname.split('/')
    const ref = parts[parts.length - 1] || 'TXN-BILL'
    setTxnRef(ref)

    // Extract query params
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('amt')) setAmount(searchParams.get('amt'))

    // Fetch store UPI settings
    api.get('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(s => {
        if (s?.storeName) setStoreName(s.storeName)
        if (s?.upiId) setUpiId(s.upiId)
      })
      .catch(() => {})

    // Check if already paid
    if (ref) {
      api.get(`/api/payments/status/${ref}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.status === 'confirmed') setPaid(true)
        })
        .catch(() => {})
    }
  }, [])

  const handleConfirmPaid = async () => {
    setConfirming(true)
    try {
      const res = await api.post('/api/payments/confirm', {
        txnRef,
        amount: Number(amount) || 0,
        note: 'Customer Confirmed on Mobile E-Bill'
      })
      if (res.ok) {
        setPaid(true)
      }
    } catch (err) {
      console.error('Confirmation error', err)
    } finally {
      setConfirming(false)
    }
  }

  const upiDeepLink = upiId
    ? `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR&tn=Bill-${txnRef}&tr=${txnRef}`
    : ''

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Store Brand */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wide">{storeName}</h1>
          <p className="text-xs text-slate-400 font-bold">DIGITAL TAX INVOICE & UPI SETTLEMENT</p>
        </div>

        {/* Bill Summary Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-700 text-center space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">Total Payable</span>
          <p className="text-4xl font-black text-emerald-400">₹{Number(amount).toFixed(2)}</p>
          <div className="inline-block px-3 py-1 bg-slate-800 rounded-full text-xs font-mono font-bold text-slate-300">
            REF: #{txnRef}
          </div>
        </div>

        {paid ? (
          <div className="p-6 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-black text-emerald-300">Payment Confirmed!</h2>
            <p className="text-xs text-emerald-200 font-semibold leading-relaxed">
              Your transaction has been verified. The store bill has been automatically printed on the counter thermal machine. Thank you!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upiDeepLink ? (
              <a
                href={upiDeepLink}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 transition active:scale-95"
              >
                <Smartphone className="w-5 h-5" />
                <span>Pay via UPI App (GPay / PhonePe)</span>
              </a>
            ) : (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs text-center font-bold">
                Store UPI ID is being configured. Please show confirmation to cashier.
              </div>
            )}

            <button
              onClick={handleConfirmPaid}
              disabled={confirming}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{confirming ? 'Verifying with Counter...' : 'I Have Completed Payment'}</span>
            </button>
          </div>
        )}

        <div className="text-center pt-2 border-t border-slate-700/60">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            Secured by AI POS Retail Engine
          </p>
        </div>

      </div>
    </div>
  )
}

export default PublicInvoicePage
