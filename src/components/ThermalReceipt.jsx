import React from 'react'

/**
 * Universal Thermal Bill Receipt Renderer
 * Formats receipts to exact 80mm (3-inch) or 58mm (2-inch) thermal roll specifications.
 * Works seamlessly with thermal POS printer machines (USB, Bluetooth, Wi-Fi, Ethernet).
 */
const ThermalReceipt = ({ 
  transaction, 
  settings = {}, 
  paperSize = '80mm',
  isPrintOnly = false 
}) => {
  if (!transaction) return null

  const {
    id = 'TXN-PREVIEW',
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    taxRate = 0.18,
    total = 0,
    payments = [],
    paymentMethod = 'cash',
    createdAt = new Date().toISOString()
  } = transaction

  const is58mm = paperSize === '58mm'
  const storeName = settings?.storeName || 'AI POS RETAIL STORE'
  const storeAddress = settings?.storeAddress || 'Main Market, City Center'
  const storePhone = settings?.phone || ''
  const storeEmail = settings?.email || ''
  const gstin = settings?.gstin || ''
  const receiptHeader = settings?.receiptHeader || ''
  const receiptFooter = settings?.receiptFooter || 'Thank you for shopping with us! Visit again.'
  const upiId = settings?.upiId || ''

  const method = payments?.[0]?.method || paymentMethod || 'cash'
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)

  // GST Breakdown (CGST 50% + SGST 50%)
  const halfTaxRate = (Number(taxRate || 0) * 100 / 2).toFixed(1)
  const halfTaxAmt = (Number(tax || 0) / 2).toFixed(2)

  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const timeStr = new Date(createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const txnNumber = String(id).length > 12 ? String(id).slice(-8).toUpperCase() : String(id).toUpperCase()

  return (
    <div 
      className={`thermal-receipt-root bg-white text-black font-mono leading-tight select-text ${
        is58mm ? 'paper-58mm max-w-[240px] text-[11px]' : 'paper-80mm max-w-[340px] text-[13px]'
      } ${isPrintOnly ? '' : 'p-5 shadow-2xl rounded-sm border border-slate-300'}`}
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        color: '#000000',
        backgroundColor: '#ffffff'
      }}
    >
      {/* Receipt Jagged Edge Visual (screen preview only) */}
      {!isPrintOnly && (
        <div className="no-print -mx-5 -mt-5 mb-4 h-2 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-b border-dashed border-slate-400" />
      )}

      {/* Store Header */}
      <div className="text-center pb-2.5">
        <h2 className={`font-black uppercase tracking-wider text-black ${is58mm ? 'text-sm' : 'text-base'}`}>
          {storeName}
        </h2>
        {storeAddress && (
          <p className="whitespace-pre-line text-black font-semibold mt-0.5">
            {storeAddress}
          </p>
        )}
        <div className="mt-1 space-y-0.5">
          {storePhone && <p className="font-semibold text-black">Tel: {storePhone}</p>}
          {storeEmail && <p className="font-semibold text-black">Email: {storeEmail}</p>}
          {gstin && <p className="font-black text-black">GSTIN: {gstin.toUpperCase()}</p>}
        </div>

        {receiptHeader && (
          <p className="italic mt-1 text-black font-medium">{receiptHeader}</p>
        )}
      </div>

      {/* Invoice Meta Bar */}
      <div className="border-t-2 border-b-2 border-dashed border-black py-1.5 my-2 space-y-0.5 text-left font-bold text-black">
        <div className="flex justify-between">
          <span>INVOICE: #{txnNumber}</span>
          <span className="uppercase">{method}</span>
        </div>
        <div className="flex justify-between text-black">
          <span>DATE: {dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full my-2 border-collapse text-black">
        <thead>
          <tr className="border-b-2 border-black font-black text-left">
            <th className="py-1">ITEM</th>
            <th className="py-1 text-center">QTY</th>
            <th className="py-1 text-right">RATE</th>
            <th className="py-1 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-gray-300">
          {items.map((item, idx) => {
            const lineQty = Number(item.quantity) || 1
            const lineRate = Number(item.price) || 0
            const lineAmt = lineRate * lineQty
            return (
              <tr key={item.cartItemId || item.productId || idx} className="align-top font-semibold text-black">
                <td className="py-1 pr-1 truncate max-w-[120px] font-bold">
                  {item.name || 'Item'}
                </td>
                <td className="py-1 text-center font-bold">{lineQty}</td>
                <td className="py-1 text-right">{lineRate.toFixed(2)}</td>
                <td className="py-1 text-right font-black">{lineAmt.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Units & Items Summary */}
      <div className="border-t-2 border-dashed border-black pt-1 pb-1 flex justify-between font-bold text-black">
        <span>ITEMS: {items.length}</span>
        <span>TOTAL UNITS: {totalUnits}</span>
      </div>

      {/* Financial Calculations */}
      <div className="border-t border-dashed border-black pt-1.5 space-y-1 font-semibold text-black">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-bold">₹{Number(subtotal).toFixed(2)}</span>
        </div>

        {Number(discount) > 0 && (
          <div className="flex justify-between font-bold">
            <span>Special Discount:</span>
            <span>-₹{Number(discount).toFixed(2)}</span>
          </div>
        )}

        {Number(tax) > 0 && (
          <>
            <div className="flex justify-between text-gray-800">
              <span>CGST ({halfTaxRate}%):</span>
              <span>₹{halfTaxAmt}</span>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>SGST ({halfTaxRate}%):</span>
              <span>₹{halfTaxAmt}</span>
            </div>
          </>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-baseline border-t-2 border-b-2 border-black py-1.5 my-1 font-black text-black">
          <span className={is58mm ? 'text-xs' : 'text-sm'}>GRAND TOTAL:</span>
          <span className={is58mm ? 'text-sm' : 'text-base'}>
            ₹{Number(total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="my-2 py-1 border-b border-dashed border-black space-y-0.5 font-bold text-black">
        <div className="flex justify-between">
          <span>Tender Mode:</span>
          <span className="uppercase">{method === 'upi' ? 'UPI / QR Digital' : 'Cash Counter'}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span>PAID FULLY</span>
        </div>
      </div>

      {/* Dynamic QR Code for UPI or E-Bill Verification */}
      <div className="text-center my-3">
        <div className="inline-block p-1.5 bg-white border-2 border-black rounded-lg">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
              method === 'upi' && upiId
                ? `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(storeName)}&am=${Number(total).toFixed(2)}&cu=INR&tn=Bill-${txnNumber}&tr=${txnNumber}`
                : `https://ai-pos-one.vercel.app/invoice/${txnNumber}?amt=${Number(total).toFixed(2)}`
            )}`}
            alt="Invoice QR"
            className={is58mm ? 'w-24 h-24 mx-auto' : 'w-28 h-28 mx-auto'}
          />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-black mt-1">
          {method === 'upi' && upiId ? 'Scan UPI to Verify' : 'Scan to View E-Receipt'}
        </p>
      </div>

      {/* Footer Greeting */}
      <div className="text-center pt-2 border-t-2 border-dashed border-black font-semibold text-black">
        <p className="whitespace-pre-line">{receiptFooter}</p>
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mt-2">
          *** AI POS BILLING ENGINE ***
        </p>
      </div>

      {/* Paper Feed & Tear Padding (thermal printer cut clearance) */}
      <div className="h-10 print:h-12" aria-hidden="true" />
    </div>
  )
}

export default ThermalReceipt
