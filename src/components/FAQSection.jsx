import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'Which thermal printer machine models work with AI POS?',
    a: 'Any standard 80mm (3-inch) or 58mm (2-inch) thermal printer machine is supported! Models like Epson TM-T82, TVS RP-3200, NGX, Everycom, POS-58, POS-80, Rugtek, and Retsol work plug-and-play. You can connect via USB cable on PC/Mac, Bluetooth wireless on Android phones/tablets, or AirPrint / Wi-Fi on Apple iPad.'
  },
  {
    q: 'How does the Gemini Vision AI bill scanner work?',
    a: 'Simply snapshot or upload any paper delivery slip, wholesale challan, or handwritten cash memo. Our built-in HTML5 Canvas engine compresses the image by 20x in 50ms so uploads happen in under 1 second. Gemini Vision AI extracts the items and quantities, automatically attaches your store’s registered retail price, and updates live warehouse stock instantly.'
  },
  {
    q: 'Can I use AI POS on my Apple iPad, Android tablet, or mobile phone?',
    a: 'Yes, 100%! AI POS is engineered as a responsive progressive cloud engine. Open ai-pos-one.vercel.app on your iPad, Android tablet, iPhone, or laptop. Your inventory, customer tabs, and sales synchronize across all counters in real time.'
  },
  {
    q: 'How does the dynamic UPI QR auto-printing work?',
    a: 'When you select "Dynamic UPI QR" at checkout, AI POS generates a QR code pre-filled with the exact bill amount. A background listener checks payment confirmation every 1.5 seconds. The second the payment lands, a celebratory soundbox chime plays, and your thermal printer automatically cuts the receipt with zero clicks needed from the cashier.'
  },
  {
    q: 'How do I export my sales and stock records to Excel or Google Sheets?',
    a: 'Go to "Analytics & Reports" in the sidebar and open the "Live Sales & Stock Spreadsheet". You can inspect everyday sales ledgers and restocking dates directly in the app, or click "Export Sales CSV" / "Export Stock CSV" to download files ready to open in Microsoft Excel, Google Sheets, or Apple Numbers.'
  },
  {
    q: 'Does it support Indian GST and Tax Invoices?',
    a: 'Yes. In Store Settings, enter your Store GSTIN and default tax rate (e.g. 18%). Printed receipts automatically break down CGST (50%) and SGST (50%), list items with rates and quantities, and display your store address, phone, and greeting.'
  }
]

const FAQSection = () => {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-base sm:text-lg font-semibold text-slate-600 dark:text-slate-400">
            Everything you need to know about setting up your thermal printer, AI scanner, and UPI checkout.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx

            return (
              <div 
                key={idx}
                className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-blue-600 text-white' : 'text-slate-500'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default FAQSection
