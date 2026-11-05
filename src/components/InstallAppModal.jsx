import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Download, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  Zap, 
  ShieldCheck
} from 'lucide-react'

const InstallAppModal = ({ isOpen, onClose }) => {
  const [deviceTab, setDeviceTab] = useState('ipad') // 'ipad' | 'android' | 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const ua = navigator.userAgent || ''
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setDeviceTab('ipad')
    } else if (/Android/.test(ua)) {
      setDeviceTab('android')
    } else {
      setDeviceTab('desktop')
    }

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true)
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!isOpen || !mounted) return null

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white flex flex-col my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sticky Header with prominent, large close button */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shrink-0">
              <Download className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">Install AI POS App</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white shrink-0">
                  PWA
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium truncate">
                Full-screen app for iPad, iPhone & Android
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 text-white transition-all shrink-0 ml-3 shadow-sm border border-white/25"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>You are already running AI POS in standalone app mode!</span>
            </div>
          )}

          {/* Device Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceTab('ipad')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                deviceTab === 'ipad'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">iPad & iPhone</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceTab('android')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                deviceTab === 'android'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">Android</span>
            </button>

            <button
              type="button"
              onClick={() => setDeviceTab('desktop')}
              className={`py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                deviceTab === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="truncate">PC / Laptop</span>
            </button>
          </div>

          {/* TAB 1: APPLE IPAD & IPHONE */}
          {deviceTab === 'ipad' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200">
                <span className="font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>iPad Safari Installation (Takes 10 Seconds)</span>
                </span>
                <p>Apple Safari adds websites directly to your home screen with 3 quick taps:</p>
              </div>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Tap the Safari Share Button</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 inline-flex items-center">
                        <Share className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      On iPad, the Share icon is at the top right near the address bar. On iPhone, it is at the bottom center.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Scroll down and tap "Add to Home Screen"</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 inline-flex items-center">
                        <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                      </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Look for the square icon with a plus (+) symbol in the share options.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white">
                      Tap "Add" in the top-right corner
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      AI POS is now added to your iPad home screen! Tap its icon to launch it in full screen without any browser navigation bars.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID MOBILE & TABLET */}
          {deviceTab === 'android' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200">
                <span className="font-black flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Google Chrome 1-Click Install</span>
                </span>
                <p>Install directly into your app drawer like a native Play Store app:</p>
              </div>

              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install AI POS App Now</span>
                </button>
              )}

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Tap Chrome 3 Dots Menu</span>
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 inline-flex items-center">
                        <MoreVertical className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                      </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Located in the top-right corner of Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white">
                      Tap "Install app" or "Add to Home screen"
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Chrome will automatically add the AI POS icon to your home screen and app launcher.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP / LAPTOP */}
          {deviceTab === 'desktop' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200">
                <span className="font-black flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Standalone Desktop Window for Cash Counters</span>
                </span>
                <p>Run AI POS in its own dedicated window without browser tabs or URL bars:</p>
              </div>

              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install AI POS Desktop App</span>
                </button>
              )}

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white">
                      Click the Install icon in the Chrome / Edge URL bar
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Look on the right side of the address bar (near the bookmark star).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-black text-slate-900 dark:text-white">
                      Click "Install"
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Pins to your Windows Taskbar or Mac Dock with instant thermal printer support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
              <span className="font-black text-blue-600 dark:text-blue-400 block text-[11px]">Full Screen</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">No URL bars</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
              <span className="font-black text-emerald-600 dark:text-emerald-400 block text-[11px]">AirPrint & BT</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Direct printing</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
              <span className="font-black text-purple-600 dark:text-purple-400 block text-[11px]">Cloud Synced</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time stock</p>
            </div>
          </div>

        </div>

        {/* Footer with easy Done / Close Button */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Works offline & updates automatically
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            Got It / Close
          </button>
        </div>

      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default InstallAppModal
