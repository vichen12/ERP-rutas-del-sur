'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('erp-theme') || 'dark') as Theme
    setTheme(saved)
    document.documentElement.classList.toggle('light', saved === 'light')
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('erp-theme', next)
    document.documentElement.classList.toggle('light', next === 'light')
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
