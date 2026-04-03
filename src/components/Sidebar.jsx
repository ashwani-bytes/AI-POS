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
    <div className={`w-72 lg:w-64 ${t.bgSecondary} border-r ${t.border} flex flex-col h-full shadow-2xl lg:shadow-none`}>
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="App Logo" 
            className="w-10 h-10 object-cover rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-gray-700" 
          />
          <span className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            AI POS
          </span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-700/50 rounded-lg transition text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : `${t.bgCard} hover:bg-gray-700`
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${t.bgCard} hover:bg-gray-700 transition`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${t.bgCard} hover:bg-red-600 transition`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
