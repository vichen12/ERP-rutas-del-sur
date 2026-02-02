'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Truck, Users, LayoutDashboard, LogOut, 
  Settings, Bell, UserCircle, MapPin, 
  AlertTriangle, CheckCircle2, Info, X,
  FileText, Wrench // Iconos nuevos para Remitos y Service
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    fetchAlerts()
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchAlerts() {
    try {
      const [ch, ca] = await Promise.all([
        supabase.from('choferes').select('nombre, vencimiento_licencia'),
        supabase.from('camiones').select('patente, km_actuales, ultimo_cambio_aceite')
      ])

      const newAlerts: any[] = []
      const hoy = new Date()

      ch.data?.forEach(driver => {
        const venci = new Date(driver.vencimiento_licencia)
        const diffDays = Math.ceil((venci.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) {
          newAlerts.push({ type: 'error', title: 'Licencia Vencida', desc: `${driver.nombre} requiere acción.`, href: '/choferes' })
        } else if (diffDays <= 30) {
          newAlerts.push({ type: 'warning', title: 'Vencimiento Cercano', desc: `${driver.nombre} vence pronto.`, href: '/choferes' })
        }
      })

      ca.data?.forEach(truck => {
        const kmRecorridos = (truck.km_actuales || 0) - (truck.ultimo_cambio_aceite || 0)
        if (kmRecorridos >= 10000) {
          newAlerts.push({ type: 'maintenance', title: 'Service Alerta', desc: `Unidad ${truck.patente}: +10k KM.`, href: '/camiones' })
        }
      })

      setAlerts(newAlerts)
    } catch (e) {
      console.error("Error cargando alertas", e)
    }
  }

  if (!mounted || pathname === '/' || pathname === '/login') return null

  // ORGANIZACIÓN DEL MENÚ
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Clientes', href: '/clientes', icon: Users },
    { label: 'Flota', href: '/camiones', icon: Truck },
    { label: 'Choferes', href: '/choferes', icon: UserCircle },
    { label: 'Viajes', href: '/viajes', icon: MapPin },
    { label: 'Remitos', href: '/remitos', icon: FileText },
   
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#020617]/60 backdrop-blur-xl transition-all duration-500">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-all">
            <Truck className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-black tracking-tighter italic text-white block leading-none uppercase">
              Rutas <span className="text-sky-500 font-light">del Sur</span>
            </span>
            <span className="text-[8px] font-black tracking-[0.3em] text-slate-500 uppercase italic">Command Center</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-3 rounded-xl border transition-all relative ${
                alerts.length > 0 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
            >
              <Bell size={20} className={alerts.length > 0 ? 'animate-pulse' : ''} />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#020617]">
                  {alerts.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 bg-[#020617] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Alertas Activas</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.map((alert, i) => (
                      <Link 
                        key={i} 
                        href={alert.href}
                        onClick={() => setShowNotifications(false)}
                        className="p-5 border-b border-white/5 flex gap-4 hover:bg-white/[0.05] transition-colors block"
                      >
                        <div className={`p-2 rounded-lg h-fit ${
                          alert.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 
                          alert.type === 'maintenance' ? 'bg-indigo-500/10 text-indigo-500' : 
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {alert.type === 'maintenance' ? <Wrench size={14} /> : <AlertTriangle size={14} />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-white uppercase italic">{alert.title}</p>
                          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{alert.desc}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-10 text-center space-y-3">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-20" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sistema Operativo</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout} 
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}