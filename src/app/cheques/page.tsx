'use client'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { FileCheck, Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, XCircle } from 'lucide-react'
import { ChequesModal } from '@/components/cheques/ChequesModal'
import { ChequeAccionModal } from '@/components/cheques/ChequeAccionModal'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

type Tab = 'todos' | 'recibidos' | 'emitidos'
type Estado = 'todos' | 'pendiente' | 'cobrado' | 'pagado' | 'rechazado'

export default function ChequesPage() {
  const supabase = getSupabase()

  const [cheques, setCheques] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState<Tab>('todos')
  const [estadoFiltro, setEstadoFiltro] = useState<Estado>('todos')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCheque, setEditingCheque] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [accionCheque, setAccionCheque] = useState<any>(null)
  const [isSavingAccion, setIsSavingAccion] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [chRes, clRes] = await Promise.all([
        supabase
          .from('cheques_diferidos')
          .select(`*, clientes(id, razon_social)`)
          .order('fecha_vencimiento', { ascending: true }),
        supabase.from('clientes').select('id, razon_social').order('razon_social'),
      ])
      setCheques(chRes.data || [])
      setClientes(clRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // --- RESUMEN ---
  const resumen = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0]
    const recibidos = cheques.filter(c => c.tipo === 'recibido')
    const emitidos = cheques.filter(c => c.tipo === 'emitido')

    const porCobrar = recibidos.filter(c => c.estado === 'pendiente').reduce((s, c) => s + Number(c.monto), 0)
    const porPagar = emitidos.filter(c => c.estado === 'pendiente').reduce((s, c) => s + Number(c.monto), 0)
    const vencidos = cheques.filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && c.fecha_vencimiento < hoy).length

    return { porCobrar, porPagar, vencidos, totalRecibidos: recibidos.length, totalEmitidos: emitidos.length }
  }, [cheques])

  const chequesFiltrados = useMemo(() => {
    return cheques.filter(c => {
      if (tab === 'recibidos' && c.tipo !== 'recibido') return false
      if (tab === 'emitidos' && c.tipo !== 'emitido') return false
      if (estadoFiltro !== 'todos' && c.estado !== estadoFiltro) return false
      return true
    })
  }, [cheques, tab, estadoFiltro])

  // --- GUARDAR (nuevo/editar) ---
  async function handleSave(data: any) {
    setIsSaving(true)
    try {
      const payload: any = {
        tipo: data.tipo,
        cliente_id: data.cliente_id || null,
        destinatario: data.destinatario || null,
        numero_cheque: data.numero_cheque || null,
        banco: data.banco || null,
        monto: Number(data.monto),
        fecha_emision: data.fecha_emision || null,
        fecha_vencimiento: data.fecha_vencimiento || null,
        notas: data.notas || null,
      }

      if (editingCheque) {
        await supabase.from('cheques_diferidos').update(payload).eq('id', editingCheque.id)
        toast.success('Cheque actualizado')
      } else {
        payload.estado = 'pendiente'
        await supabase.from('cheques_diferidos').insert([payload])
        toast.success('Cheque registrado')
      }

      setIsModalOpen(false)
      setEditingCheque(null)
      fetchAll()
    } catch (e) {
      console.error(e)
      toast.error('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // --- COBRAR / PAGAR ---
  async function handleAccion(fechaCobro: string, registrarEnBanco: boolean) {
    if (!accionCheque) return
    setIsSavingAccion(true)
    try {
      const esRecibido = accionCheque.tipo === 'recibido'
      const nuevoEstado = esRecibido ? 'cobrado' : 'pagado'

      // Actualizar cheque
      await supabase.from('cheques_diferidos').update({
        estado: nuevoEstado,
        fecha_cobro: fechaCobro,
      }).eq('id', accionCheque.id)

      // Registrar en banco si el usuario lo eligió
      if (registrarEnBanco) {
        const clienteNombre = accionCheque.clientes?.razon_social || accionCheque.destinatario || 'Sin cliente'
        const nroCheque = accionCheque.numero_cheque ? ` (Nro. ${accionCheque.numero_cheque})` : ''
        const descripcion = esRecibido
          ? `Cobro cheque${nroCheque} - ${clienteNombre}`
          : `Pago cheque${nroCheque} - ${clienteNombre}`

        const { data: movData } = await supabase.from('movimientos_caja').insert([{
          fecha: fechaCobro,
          tipo: esRecibido ? 'ingreso' : 'egreso',
          tipo_cuenta: 'banco',
          categoria: 'cheque',
          descripcion,
          monto: Number(accionCheque.monto),
          cliente_id: accionCheque.cliente_id || null,
          referencia: accionCheque.numero_cheque || null,
          origen: 'cheques',
          modulo_origen: 'cheques',
        }]).select('id').single()

        // Guardar referencia al movimiento
        if (movData?.id) {
          await supabase.from('cheques_diferidos').update({ movimiento_caja_id: movData.id }).eq('id', accionCheque.id)
        }
      }

      toast.success(esRecibido ? 'Cheque cobrado' : 'Pago de cheque registrado')
      setAccionCheque(null)
      fetchAll()
    } catch (e) {
      console.error(e)
      toast.error('Error al procesar')
    } finally {
      setIsSavingAccion(false)
    }
  }

  // --- ELIMINAR ---
  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este cheque?')) return
    await supabase.from('cheques_diferidos').delete().eq('id', id)
    toast.success('Cheque eliminado')
    fetchAll()
  }

  // --- RECHAZAR ---
  async function handleRechazar(id: string) {
    if (!confirm('¿Marcar este cheque como rechazado?')) return
    await supabase.from('cheques_diferidos').update({ estado: 'rechazado' }).eq('id', id)
    toast.success('Cheque marcado como rechazado')
    fetchAll()
  }

  function formatFecha(f: string | null) {
    if (!f) return '—'
    return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  function formatMonto(n: number) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
  }

  const hoy = new Date().toISOString().split('T')[0]

  function getEstadoBadge(c: any) {
    const vencido = c.estado === 'pendiente' && c.fecha_vencimiento && c.fecha_vencimiento < hoy
    if (vencido) return { label: 'Vencido', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
    if (c.estado === 'pendiente') return { label: 'Pendiente', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' }
    if (c.estado === 'cobrado') return { label: 'Cobrado', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
    if (c.estado === 'pagado') return { label: 'Pagado', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
    if (c.estado === 'rechazado') return { label: 'Rechazado', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' }
    return { label: c.estado, color: 'bg-white/5 text-slate-400' }
  }

  return (
    <main className="min-h-screen bg-[#141c28] pt-20 lg:pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans italic">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <FileCheck size={28} className="text-indigo-400" />
              Cheques
            </h1>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
              Gestión de cheques recibidos y emitidos
            </p>
          </div>
          <button onClick={() => { setEditingCheque(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            <Plus size={14} /> Nuevo Cheque
          </button>
        </div>

        {/* RESUMEN CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans italic">
          <div className="bg-[#1a2537] border border-white/5 rounded-[2rem] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Por Cobrar</span>
            </div>
            <p className="text-xl font-black text-emerald-400 tabular-nums">{formatMonto(resumen.porCobrar)}</p>
            <p className="text-[8px] text-slate-600 font-bold">{cheques.filter(c => c.tipo === 'recibido' && c.estado === 'pendiente').length} cheques pendientes</p>
          </div>
          <div className="bg-[#1a2537] border border-white/5 rounded-[2rem] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-rose-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Por Pagar</span>
            </div>
            <p className="text-xl font-black text-rose-400 tabular-nums">{formatMonto(resumen.porPagar)}</p>
            <p className="text-[8px] text-slate-600 font-bold">{cheques.filter(c => c.tipo === 'emitido' && c.estado === 'pendiente').length} cheques emitidos</p>
          </div>
          <div className={`bg-[#1a2537] border rounded-[2rem] p-5 space-y-2 ${resumen.vencidos > 0 ? 'border-amber-500/20' : 'border-white/5'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className={resumen.vencidos > 0 ? 'text-amber-400' : 'text-slate-600'} />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vencidos</span>
            </div>
            <p className={`text-xl font-black tabular-nums ${resumen.vencidos > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{resumen.vencidos}</p>
            <p className="text-[8px] text-slate-600 font-bold">cheques vencidos sin acción</p>
          </div>
          <div className="bg-[#1a2537] border border-white/5 rounded-[2rem] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <FileCheck size={14} className="text-indigo-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total</span>
            </div>
            <p className="text-xl font-black text-white tabular-nums">{cheques.length}</p>
            <p className="text-[8px] text-slate-600 font-bold">{resumen.totalRecibidos} recibidos · {resumen.totalEmitidos} emitidos</p>
          </div>
        </div>

        {/* TABS + FILTRO ESTADO */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between font-sans italic">
          <div className="flex bg-[#1a2537] p-1.5 rounded-3xl border border-white/5 gap-1">
            {(['todos', 'recibidos', 'emitidos'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                {t === 'recibidos' && <ArrowUpRight size={11} />}
                {t === 'emitidos' && <ArrowDownLeft size={11} />}
                {t === 'todos' && <FileCheck size={11} />}
                {t}
              </button>
            ))}
          </div>

          <div className="flex bg-[#1a2537] p-1.5 rounded-3xl border border-white/5 gap-1">
            {(['todos', 'pendiente', 'cobrado', 'pagado', 'rechazado'] as Estado[]).map(e => (
              <button key={e} onClick={() => setEstadoFiltro(e)}
                className={`px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${estadoFiltro === e ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-[#1a2537]/40 border border-white/5 rounded-[2rem] overflow-hidden font-sans italic">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : chequesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <FileCheck size={40} className="text-slate-700" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No hay cheques</p>
              <p className="text-[9px] text-slate-700">Registrá el primero con el botón &quot;Nuevo Cheque&quot;</p>
            </div>
          ) : (
            <>
              {/* Header tabla */}
              <div className="hidden md:grid grid-cols-[1.2fr_1.8fr_1fr_1fr_1fr_1.2fr_auto] px-6 py-3 border-b border-white/5 gap-4">
                {['Tipo', 'Cliente / Destinatario', 'Nro. Cheque / Banco', 'Emisión', 'Vencimiento', 'Monto', ''].map(h => (
                  <p key={h} className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{h}</p>
                ))}
              </div>

              <div className="divide-y divide-white/5">
                {chequesFiltrados.map(c => {
                  const badge = getEstadoBadge(c)
                  const esRecibido = c.tipo === 'recibido'
                  const pendiente = c.estado === 'pendiente'
                  const nombre = c.clientes?.razon_social || c.destinatario || '—'

                  return (
                    <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr_1fr_1fr_1fr_1.2fr_auto] px-6 py-4 hover:bg-white/[0.02] transition-colors gap-4 items-center">
                      {/* Tipo */}
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase border ${esRecibido ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          {esRecibido ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                          {esRecibido ? 'Recibido' : 'Emitido'}
                        </span>
                      </div>

                      {/* Cliente */}
                      <div>
                        <p className="text-sm font-black text-white truncate">{nombre}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${badge.color} mt-1`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Nro / Banco */}
                      <div>
                        {c.numero_cheque && <p className="text-xs font-bold text-slate-300">{c.numero_cheque}</p>}
                        {c.banco && <p className="text-[9px] text-slate-500 font-bold">{c.banco}</p>}
                        {!c.numero_cheque && !c.banco && <p className="text-[9px] text-slate-600">—</p>}
                      </div>

                      {/* Emisión */}
                      <p className="text-xs font-bold text-slate-400">{formatFecha(c.fecha_emision)}</p>

                      {/* Vencimiento */}
                      <div>
                        <p className={`text-xs font-bold ${c.fecha_vencimiento && c.fecha_vencimiento < hoy && pendiente ? 'text-amber-400' : 'text-slate-400'}`}>
                          {formatFecha(c.fecha_vencimiento)}
                        </p>
                        {c.fecha_cobro && <p className="text-[8px] text-slate-600 font-bold">Cobrado: {formatFecha(c.fecha_cobro)}</p>}
                      </div>

                      {/* Monto */}
                      <p className={`text-sm font-black tabular-nums ${esRecibido ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {esRecibido ? '+' : '-'}{formatMonto(c.monto)}
                      </p>

                      {/* Acciones */}
                      <div className="flex items-center gap-1">
                        {pendiente && (
                          <button onClick={() => setAccionCheque(c)}
                            title={esRecibido ? 'Cobrar' : 'Pagar'}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        {pendiente && esRecibido && (
                          <button onClick={() => handleRechazar(c.id)}
                            title="Marcar rechazado"
                            className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all">
                            <XCircle size={13} />
                          </button>
                        )}
                        <button onClick={() => { setEditingCheque(c); setIsModalOpen(true) }}
                          className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALES */}
      <ChequesModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCheque(null) }}
        onSubmit={handleSave}
        isSaving={isSaving}
        editingCheque={editingCheque}
        clientes={clientes}
      />

      {accionCheque && (
        <ChequeAccionModal
          cheque={accionCheque}
          onClose={() => setAccionCheque(null)}
          onConfirm={handleAccion}
          isSaving={isSavingAccion}
        />
      )}
    </main>
  )
}
