'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Truck, Users, LayoutDashboard, LogOut, 
  Settings, Bell, UserCircle, MapPin, 
  AlertTriangle, CheckCircle2, X,
  FileText, Wrench, Menu, ShieldCheck
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset' 
    }
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  async function fetchAlerts() {
    try {
      const [ch, ca] = await Promise.all([
        supabase.from('choferes').select('nombre, vencimiento_licencia'),
        supabase.from('camiones').select('patente, km_actual, ultimo_cambio_aceite, vencimiento_rto, vencimiento_senasa')
      ])
      const newAlerts: any[] = []
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      // 1. Alertas de Choferes
      ch.data?.forEach(driver => {
        if (!driver.vencimiento_licencia) return
        const venci = new Date(driver.vencimiento_licencia)
        const diffDays = Math.ceil((venci.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) {
          newAlerts.push({ type: 'error', title: 'Bloqueo: Licencia', desc: `${driver.nombre}: Documentación vencida.`, href: '/choferes' })
        } else if (diffDays <= 30) {
          newAlerts.push({ type: 'warning', title: 'Vencimiento Próximo', desc: `${driver.nombre}: Vence en ${diffDays} días.`, href: '/choferes' })
        }
      })

      // 2. Alertas de Flota
      ca.data?.forEach(truck => {
        const kmRecorridos = (truck.km_actual || 0) - (truck.ultimo_cambio_aceite || 0)
        if (kmRecorridos >= 32000) {
          const exceso = kmRecorridos - 32000
          newAlerts.push({ type: 'maintenance', title: 'Mantenimiento Crítico', desc: `Unidad ${truck.patente}: Pasada por ${exceso.toLocaleString()} KM.`, href: '/camiones' })
        } else if (kmRecorridos >= 18000) {
          newAlerts.push({ type: 'warning', title: 'Service Cercano', desc: `Unidad ${truck.patente}: A menos de 2.000 KM del service.`, href: '/camiones' })
        }

        if (truck.vencimiento_rto) {
          const vtoRto = new Date(truck.vencimiento_rto)
          const diffDaysRto = Math.ceil((vtoRto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDaysRto < 0) newAlerts.push({ type: 'error', title: 'RTO Vencida', desc: `Unidad ${truck.patente}: Revisión técnica caducada.`, href: '/camiones' })
          else if (diffDaysRto <= 30) newAlerts.push({ type: 'warning', title: 'RTO Próxima', desc: `Unidad ${truck.patente}: Vence en ${diffDaysRto} días.`, href: '/camiones' })
        }

        if (truck.vencimiento_senasa) {
          const vtoSenasa = new Date(truck.vencimiento_senasa)
          const diffDaysSenasa = Math.ceil((vtoSenasa.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDaysSenasa < 0) newAlerts.push({ type: 'error', title: 'SENASA Vencido', desc: `Unidad ${truck.patente}: Certificado sanitario caducado.`, href: '/camiones' })
          else if (diffDaysSenasa <= 30) newAlerts.push({ type: 'warning', title: 'SENASA Próximo', desc: `Unidad ${truck.patente}: SENASA vence en ${diffDaysSenasa} días.`, href: '/camiones' })
        }
      })
      setAlerts(newAlerts)
    } catch (e) { console.error(e) }
  }

  if (!mounted || pathname === '/' || pathname === '/login') return null

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
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#020617]/90 backdrop-blur-xl h-16 md:h-20 font-sans italic transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          
          {/* LOGO AREA */}
          <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="p-2 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-all">
              <Truck className="text-white" size={20} strokeWidth={2.5} />
            </div>
            {/* Texto oculto en móviles muy pequeños, visible en tablets+ */}
            <div className="hidden xs:block">
              <span className="text-lg md:text-xl font-black tracking-tighter italic text-white block leading-none uppercase">
                Rutas <span className="text-sky-500 font-light">del Sur</span>
              </span>
              <span className="text-[8px] font-black tracking-[0.3em] text-slate-500 uppercase italic">Control de Operaciones</span>
            </div>
          </Link>

          {/* DESKTOP MENU (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                  <item.icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* NOTIFICATIONS */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2.5 md:p-3 rounded-xl border transition-all relative active:scale-95 ${alerts.length > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                <Bell size={18} className={alerts.length > 0 ? 'animate-pulse' : ''} />
                {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[9px] md:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#020617]">{alerts.length}</span>}
              </button>

              {showNotifications && (
                <div className="absolute right-[-60px] md:right-0 mt-4 w-[85vw] max-w-[320px] md:w-80 bg-[#020617] border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right z-50">
                  <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Alertas Operativas</h3>
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded-full hover:bg-white/10 text-slate-500"><X size={16}/></button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto font-sans italic">
                    {alerts.length > 0 ? alerts.map((alert, i) => (
                      <Link key={i} href={alert.href} onClick={() => setShowNotifications(false)} className="p-5 border-b border-white/5 flex gap-4 hover:bg-white/[0.05] transition-colors group">
                        <div className={`p-2 rounded-lg h-fit ${alert.type === 'error' ? 'bg-rose-500/10 text-rose-500' : alert.type === 'maintenance' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                          {alert.title.includes('SENASA') ? <ShieldCheck size={14} /> : alert.type === 'maintenance' ? <Wrench size={14} /> : <AlertTriangle size={14} />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-white uppercase italic">{alert.title}</p>
                          <p className="text-[10px] text-slate-500 font-bold leading-tight uppercase">{alert.desc}</p>
                        </div>
                      </Link>
                    )) : (
                      <div className="p-10 text-center text-slate-600 text-[10px] font-black uppercase italic tracking-widest flex flex-col items-center gap-2">
                        <CheckCircle2 size={24} className="opacity-50"/>
                        Todo en orden
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* HAMBURGER MENU (Visible only on LG and below) */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2.5 md:p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95">
              <Menu size={20} />
            </button>

            {/* LOGOUT BUTTON (Desktop only) */}
            <button onClick={handleLogout} className="hidden lg:flex p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div className={`fixed inset-0 z-[200] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)} />
        
        {/* Drawer content */}
        <div className={`absolute right-0 top-0 bottom-0 w-[85vw] max-w-[300px] bg-[#020617] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Mobile Header */}
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-slate-900/50">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"/> Menú
            </span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
               <X size={20} />
            </button>
          </div>

          {/* Mobile Links */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 font-sans italic">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 px-6 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${isActive ? 'bg-sky-600 border-sky-400 text-white shadow-lg shadow-sky-600/20 translate-x-2' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile Footer */}
          <div className="p-6 md:p-8 border-t border-white/5 space-y-4 font-sans italic bg-slate-900/30">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest active:scale-95">
              <LogOut size={16} /> Cerrar Sesión
            </button>
            <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] pt-2">Rutas del Sur ERP</p>
          </div>
        </div>
      </div>
    </>
  )
}