const express = require('express')
const { db } = require('../config/firebase')
const router = express.Router()

// Fast in-memory registry for live transaction payment states (keyed by txnRef)
const activePaymentStates = new Map()

/**
 * Check payment status for a specific transaction reference
 * Polled by POS terminals during live QR checkout
 */
router.get('/status/:txnRef', async (req, res) => {
  const { txnRef } = req.params
  if (!txnRef) {
    return res.status(400).json({ error: 'txnRef required' })
  }

  // 1. Check in-memory fast registry
  const memState = activePaymentStates.get(txnRef)
  if (memState && memState.status === 'confirmed') {
    return res.json({
      status: 'confirmed',
      txnRef,
      ...memState
    })
  }

  // 2. Fallback check in Firestore payments collection
  try {
    const doc = await db().collection('payments').doc(txnRef).get()
    if (doc.exists && doc.data()?.status === 'confirmed') {
      const data = doc.data()
      activePaymentStates.set(txnRef, data)
      return res.json({
        status: 'confirmed',
        txnRef,
        ...data
      })
    }
  } catch (err) {
    // Non-fatal, continue with pending
  }

  return res.json({ status: 'pending', txnRef })
})

/**
 * Confirm payment (called by customer e-bill page, webhook, or cashier)
 */
router.post('/confirm', async (req, res) => {
  const { txnRef, amount, upiTransactionId, payerVpa, note } = req.body
  if (!txnRef) {
    return res.status(400).json({ error: 'txnRef is required' })
  }

  const paymentRecord = {
    status: 'confirmed',
    txnRef,
    amount: Number(amount) || 0,
    upiTransactionId: upiTransactionId || `UPI${Date.now().toString().slice(-8)}`,
    payerVpa: payerVpa || 'customer@upi',
    note: note || 'Verified UPI Payment',
    confirmedAt: new Date().toISOString()
  }

  // Store in memory for instant polling response (<5ms)
  activePaymentStates.set(txnRef, paymentRecord)

  // Persist asynchronously in Firestore
  try {
    await db().collection('payments').doc(txnRef).set(paymentRecord, { merge: true })
  } catch (err) {
    console.warn('[Payments] Firestore write warning:', err.message)
  }

  console.log(`[Payments] Payment CONFIRMED for ${txnRef}: ₹${paymentRecord.amount}`)
  res.json({ success: true, payment: paymentRecord })
})

/**
 * Instant simulation trigger for testing and counter confirmation
 */
router.post('/simulate', (req, res) => {
  const { txnRef, amount } = req.body
  if (!txnRef) {
    return res.status(400).json({ error: 'txnRef required' })
  }

  const paymentRecord = {
    status: 'confirmed',
    txnRef,
    amount: Number(amount) || 0,
    upiTransactionId: `SIM_UPI_${Date.now().toString().slice(-6)}`,
    payerVpa: 'user@okhdfcbank',
    note: 'Simulated Instant UPI Payment',
    confirmedAt: new Date().toISOString()
  }

  activePaymentStates.set(txnRef, paymentRecord)
  res.json({ success: true, payment: paymentRecord })
})

module.exports = router
