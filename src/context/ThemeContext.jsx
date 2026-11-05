import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

const theme = {
  dark: {
    bg: 'bg-slate-950',
    bgSecondary: 'bg-slate-900',
    bgCard: 'bg-slate-900',
    text: 'text-slate-100',
    textSecondary: 'text-slate-400',
    border: 'border-slate-800',
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-500',
    input: 'bg-slate-900 text-slate-100 border-slate-700 focus:border-blue-500',
  },
  light: {
    bg: 'bg-slate-100',
    bgSecondary: 'bg-white',
    bgCard: 'bg-white',
    text: 'text-slate-900',
    textSecondary: 'text-slate-700',
    border: 'border-slate-300',
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    input: 'bg-white text-slate-900 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100',
  },
}

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
  t: theme.light,
})

export const ThemeProvider = ({ children, defaultDark = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_theme')
      if (saved === 'light') return false
      if (saved === 'dark') return true
      return defaultDark
    } catch {
      return defaultDark
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('pos_theme', isDarkMode ? 'dark' : 'light')
    } catch {}
    const root = document.documentElement
    const body = document.body
    if (isDarkMode) {
      root.classList.add('dark')
      root.classList.remove('light')
      body.classList.add('dark')
      body.classList.remove('light')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      body.classList.remove('dark')
      body.classList.add('light')
      root.style.colorScheme = 'light'
    }
  }, [isDarkMode])

  const t = useMemo(() => (isDarkMode ? theme.dark : theme.light), [isDarkMode])
  const value = useMemo(() => ({ 
    isDarkMode, 
    toggleTheme: () => setIsDarkMode(v => !v),
    setTheme: (mode) => setIsDarkMode(mode === 'dark'),
    t 
  }), [isDarkMode, t])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
