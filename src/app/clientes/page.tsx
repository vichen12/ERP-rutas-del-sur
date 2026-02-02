'use client'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { backupService } from '@/lib/backupService'
import { 
  Plus, Search, FileText, Wallet, Loader2, 
  Truck, ChevronRight, Calendar, Landmark, ClipboardList,
  MoreHorizontal, ArrowUpRight, ArrowDownLeft, X, Save, 
  Trash2, AlertTriangle, Mail, Printer
} from 'lucide-react'

// --- INTERFACES ---
interface Movimiento {
  id: string; fecha: string; descripcion: string;
  debe: number; haber: number; nro_comprobante: string;
}

interface Cliente {
  id: string; razon_social: string; cuit: string;
  direccion: string; saldo: number; historial: Movimiento[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  const supabase = getSupabase()

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*, cuenta_corriente(*)')
    if (data) {
      const procesados = data.map((c: any) => {
        const historial = (c.cuenta_corriente || []).sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        const saldo = historial.reduce((acc: number, m: any) => acc + (Number(m.debe) - Number(m.haber)), 0)
        return { ...c, historial, saldo }
      })
      setClientes(procesados)
      if (procesados.length > 0) setSelected(procesados[0])
    }
    setLoading(false)
  }

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await backupService.enviarBackupMensual(clientes);
      alert("✅ Backup enviado a rutasdelsurmza@gmail.com");
    } catch (err) {
      alert("❌ Error al enviar backup. Verificá la Edge Function.");
    } finally {
      setBackupLoading(false);
    }
  }

  const handleDeleteClient = async () => {
    if (!selected) return
    setIsSaving(true)
    const { error } = await supabase.from('clientes').delete().eq('id', selected.id)
    if (!error) { setIsDeleteModalOpen(false); fetchClientes(); }
    else { alert("Error: Posiblemente el cliente tenga movimientos asociados."); }
    setIsSaving(false)
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-[family-name:var(--font-geist-sans)] transition-colors duration-500">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-85 border-r border-white/5 bg-slate-900/40 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">Clientes</h1>
            <button onClick={() => setIsClientModalOpen(true)} className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-500 shadow-lg active:scale-95 transition-all">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text" placeholder="Buscar por Razón Social..." 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl outline-none text-sm text-white focus:ring-1 focus:ring-sky-500/50"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-sky-500" /></div> : 
            clientes.filter(c => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
              <div key={c.id} onClick={() => setSelected(c)} className={`p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center ${selected?.id === c.id ? 'bg-sky-500/10 border-l-4 border-sky-600' : 'hover:bg-white/5 border-l-4 border-transparent'}`}>
                <div className="truncate pr-2">
                  <span className="font-bold text-white block text-sm truncate uppercase">{c.razon_social}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{c.cuit}</span>
                </div>
                <p className={`text-xs font-black ${c.saldo > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>${c.saldo.toLocaleString('es-AR')}</p>
              </div>
            ))
          }
        </div>
      </aside>

      {/* --- MAIN --- */}
      <main className="flex-1 overflow-y-auto p-8">
        {selected ? (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Header Profile */}
            <div className="mt-18 flex justify-between items-start bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-sky-500/10 text-sky-400 rounded-2xl"><Landmark size={36}/></div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">{selected.razon_social}</h2>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-3">{selected.cuit} • {selected.direccion}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleBackup}
                  disabled={backupLoading}
                  className="p-4 bg-white/5 text-slate-300 rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                  title="Enviar Backup Mensual"
                >
                  {backupLoading ? <Loader2 className="animate-spin" size={20}/> : <Mail size={20} />}
                </button>
                <button onClick={() => setIsDeleteModalOpen(true)} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10 active:scale-95">
                  <Trash2 size={20} />
                </button>
                <button className="bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl font-black text-xs transition-all shadow-xl shadow-sky-900/20 uppercase tracking-widest">
                  Nueva Operación
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: 'Saldo Adeudado', val: selected.saldo, color: selected.saldo > 0 ? 'text-rose-500' : 'text-emerald-400', icon: FileText },
                { label: 'Última Actividad', val: selected.historial[0]?.fecha || '---', color: 'text-white', icon: Calendar },
                { label: 'Fletes Registrados', val: selected.historial.filter(m => m.debe > 0).length, color: 'text-sky-400', icon: Truck },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-lg">
                  <stat.icon className="absolute -top-4 -right-4 w-32 h-32 opacity-[0.05] group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                  <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>
                    {typeof stat.val === 'number' ? `$${stat.val.toLocaleString('es-AR')}` : stat.val}
                  </p>
                </div>
              ))}
            </div>

            {/* Ledger Table */}
            <div className="bg-slate-900/60 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-3 italic text-xl">
                  <ClipboardList size={24} className="text-sky-600"/> Libro Mayor Detallado
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                    <tr>
                      <th className="px-10 py-6">Fecha</th>
                      <th className="px-10 py-6">Concepto / Referencia</th>
                      <th className="px-10 py-6 text-right">Debe (+)</th>
                      <th className="px-10 py-6 text-right">Haber (-)</th>
                      <th className="px-10 py-6 text-right bg-white/[0.01]">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selected.historial.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-6 text-sm font-bold text-slate-500">{m.fecha}</td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-3">
                             {m.debe > 0 ? <ArrowUpRight size={16} className="text-rose-500" /> : <ArrowDownLeft size={16} className="text-emerald-500" />}
                             <span className="font-bold text-slate-200 text-base uppercase tracking-tight leading-none block">{m.descripcion}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-rose-500 text-base">{m.debe > 0 ? `+ $${Number(m.debe).toLocaleString('es-AR')}` : '---'}</td>
                        <td className="px-10 py-6 text-right font-black text-emerald-400 text-base">{m.haber > 0 ? `- $${Number(m.haber).toLocaleString('es-AR')}` : '---'}</td>
                        <td className="px-10 py-6 text-right font-black text-white text-base bg-white/[0.01]">
                          ${selected.historial.slice(idx).reduce((a:any, b:any) => a + (Number(b.debe) - Number(b.haber)), 0).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <Truck size={140} className="mb-6" />
            <p className="text-4xl font-black uppercase tracking-[1em] italic">Rutas del Sur</p>
          </div>
        )}
      </main>

      {/* --- MODAL CONFIRMACIÓN ELIMINAR --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-rose-500/20 p-12 rounded-[3.5rem] w-full max-w-md text-center space-y-8 relative overflow-hidden">
            <div className="p-6 bg-rose-500/10 text-rose-500 rounded-3xl inline-block mx-auto"><AlertTriangle size={48} /></div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">¿Confirmar Baja?</h3>
            <p className="text-slate-400 text-sm font-bold leading-relaxed uppercase">Eliminarás a <span className="text-rose-500">{selected?.razon_social}</span> y todo su historial financiero.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-5 bg-white/5 text-slate-400 font-black rounded-2xl hover:bg-white/10 transition-all uppercase text-xs">Cancelar</button>
              <button onClick={handleDeleteClient} disabled={isSaving} className="flex-1 py-5 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/20 uppercase text-xs disabled:opacity-50">{isSaving ? 'Borrando...' : 'Sí, Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ALTA CLIENTE --- */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/5 p-12 rounded-[3.5rem] w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsClientModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><X size={32}/></button>
            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-8">Nuevo Cliente</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSaving(true);
              const fd = new FormData(e.currentTarget);
              const { error } = await supabase.from('clientes').insert([{ razon_social: fd.get('rs'), cuit: fd.get('cuit'), direccion: fd.get('dir') }]);
              if (!error) { setIsClientModalOpen(false); fetchClientes(); }
              setIsSaving(false);
            }} className="space-y-5">
              <input name="rs" placeholder="Razón Social" required className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white focus:ring-1 focus:ring-sky-500 font-bold" />
              <input name="cuit" placeholder="CUIT" required className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white focus:ring-1 focus:ring-sky-500 font-bold" />
              <input name="dir" placeholder="Dirección" className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white focus:ring-1 focus:ring-sky-500 font-bold" />
              <button disabled={isSaving} className="w-full py-6 bg-sky-600 text-white font-black rounded-[1.75rem] shadow-xl shadow-sky-900/30 transition-all active:scale-95 disabled:opacity-50 uppercase text-sm mt-6">
                {isSaving ? 'Guardando...' : 'Registrar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}