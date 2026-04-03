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
    <div className={`w-64 ${t.bgSecondary} flex flex-col h-full border-r ${t.border} shadow-sm`}>
      <div className={`p-6 border-b ${t.border} flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${t.accent} rounded-lg flex items-center justify-center`}>
            <span className="text-sm font-bold text-white uppercase italic">AI</span>
          </div>
          <span className="text-xl font-bold tracking-tight">AI POS</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg
                transition-colors font-medium
                ${isActive 
                  ? `${t.accent} text-white shadow-md` 
                  : `${t.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500`
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className={`p-4 border-t ${t.border} space-y-1`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium`}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
