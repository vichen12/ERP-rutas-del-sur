'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Se asegura que el componente esté montado en el cliente antes de renderizar
  // para evitar errores de hidratación y corregir el warning del linter
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // No renderiza nada hasta que el cliente esté listo
  if (!mounted) return <div className="p-2 w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 shadow-lg group"
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-400 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-slate-400 transition-all" />
      )}
    </button>
  )
}