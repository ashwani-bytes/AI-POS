import React, { createContext, useContext, useMemo, useState } from 'react'

const theme = {
  dark: {
    bg: 'bg-slate-900',
    bgSecondary: 'bg-slate-800',
    bgCard: 'bg-slate-800/50',
    text: 'text-slate-50',
    textSecondary: 'text-slate-400',
    border: 'border-white/10',
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-500',
    input: 'bg-slate-800/50 text-slate-100 border-white/10 focus:border-blue-500/50',
    glow: '',
  },
  light: {
    bg: 'bg-slate-50',
    bgSecondary: 'bg-white border-r border-slate-200',
    bgCard: 'bg-white shadow-sm border border-slate-100',
    text: 'text-slate-900',
    textSecondary: 'text-slate-500',
    border: 'border-slate-200',
    accent: 'bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    input: 'bg-white text-slate-900 border-slate-200 focus:border-blue-500',
    glow: '',
  },
}

const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {},
  t: theme.dark,
})

export const ThemeProvider = ({ children, defaultDark = true }) => {
  const [isDarkMode, setIsDarkMode] = useState(defaultDark)
  const t = useMemo(() => (isDarkMode ? theme.dark : theme.light), [isDarkMode])
  const value = useMemo(() => ({ isDarkMode, toggleTheme: () => setIsDarkMode(v => !v), t }), [isDarkMode, t])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
