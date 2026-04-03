import React from 'react'
import { ShoppingCart, Package, Users, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Sidebar = ({ activeView, setActiveView, onLogout, onClose }) => {
  const { t, isDarkMode, toggleTheme } = useTheme()

  const menuItems = [
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className={`w-72 lg:w-64 ${t.bgSecondary} flex flex-col h-full shadow-2xl relative overflow-hidden group`}>
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-1000" />
      
      <div className={`p-6 border-b ${t.border} flex items-center justify-between relative z-10`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${t.accent} rounded-xl flex items-center justify-center ${t.glow}`}>
            <span className="text-xl font-black text-white italic">AI</span>
          </div>
          <span className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            POS
          </span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl
                transition-all duration-300 relative group/item overflow-hidden
                ${isActive 
                  ? `${t.accent} text-white ${t.glow} scale-[1.02]` 
                  : `hover:bg-white/5 ${t.textSecondary} hover:text-white`
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover/item:rotate-12'}`} />
              <span className="font-bold tracking-wide">{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-0 h-full w-1 bg-white/40 rounded-l-full" />
              )}
            </button>
          )
        })}
      </nav>

      <div className={`p-4 border-t ${t.border} space-y-2 relative z-10`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${t.bgCard} hover:bg-white/10 transition-all font-bold`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-bold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold">Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
