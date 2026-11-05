import React, { useState, useEffect } from 'react'
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
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

const InstallAppModal = ({ isOpen, onClose }) => {
  const [deviceTab, setDeviceTab] = useState('ipad') // 'ipad' | 'android' | 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Detect platform on mount
  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setDeviceTab('ipad')
    } else if (/Android/.test(ua)) {
      setDeviceTab('android')
    } else {
      setDeviceTab('desktop')
    }

    // Check if already in standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true)
    }

    // Listen for native beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-all">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Download className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Install AI POS App</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/20">
                  PWA Standalone
                </span>
              </div>
              <p className="text-xs text-blue-100 font-semibold">
                Use AI POS as a full-screen native app on your iPad or mobile device
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>You are already running AI POS in standalone app mode!</span>
            </div>
          )}

          {/* Device Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDeviceTab('ipad')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                deviceTab === 'ipad'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4 text-indigo-500" />
              <span>Apple iPad & iPhone</span>
            </button>

            <button
              onClick={() => setDeviceTab('android')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                deviceTab === 'android'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Android Mobile/Tab</span>
            </button>

            <button
              onClick={() => setDeviceTab('desktop')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                deviceTab === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4 text-purple-500" />
              <span>Laptop / PC</span>
            </button>
          </div>

          {/* TAB 1: APPLE IPAD & IPHONE */}
          {deviceTab === 'ipad' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                <span className="font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span>iPad Safari Installation Guide (Takes 10 Seconds)</span>
                </span>
                <p>Apple Safari doesn't allow automatic install popups, but you can add it directly to your home screen:</p>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Open in Apple Safari and tap the Share Button
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
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Scroll down and tap "Add to Home Screen"
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 inline-flex items-center">
                        <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                      </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Look for the square icon with a plus (+) sign in the Safari share sheet.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white">
                      Tap "Add" in the top-right corner
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      AI POS is now added to your home screen! Tap its icon to launch it in full screen without any browser navigation bars.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID MOBILE & TABLET */}
          {deviceTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                <span className="font-black flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Google Chrome Android 1-Click Install</span>
                </span>
                <p>Install directly into your Android apps drawer just like an APK / Play Store app:</p>
              </div>

              {deferredPrompt && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Click Here to Install AI POS App</span>
                </button>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Tap the Chrome 3 Dots Menu
                      <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 inline-flex items-center">
                        <MoreVertical className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                      </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Located in the top-right corner of Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white">
                      Tap "Install app" or "Add to Home screen"
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Chrome will automatically add the AI POS icon to your app drawer and home screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESKTOP / LAPTOP */}
          {deviceTab === 'desktop' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-950 dark:text-purple-200 space-y-1">
                <span className="font-black flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Desktop App Window for Cash Counters</span>
                </span>
                <p>Run AI POS in a standalone desktop window without browser tabs or address bars:</p>
              </div>

              {deferredPrompt && (
                <button
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install AI POS Desktop App</span>
                </button>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white">
                      Look at the address bar in Chrome or Microsoft Edge
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Click the small computer/download icon on the right side of the URL bar (near the bookmark star).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-black text-slate-900 dark:text-white">
                      Click "Install"
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      It pins to your Windows Taskbar or macOS Dock, and launches in its own dedicated window with instant thermal printer support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Advantages Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Full Screen</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No address bars or navigation buttons to distract cashiers.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Printer Sync</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct Wi-Fi AirPrint, Bluetooth, or USB connection.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cloud Synced</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All inventory and sales sync across phone, iPad & laptop.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Works offline for cached assets & updates automatically.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  )
}

export default InstallAppModal
