'use client'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  FileCheck, Plus, Pencil, Trash2, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft, XCircle,
  Search, Calendar, User, Filter
} from 'lucide-react'
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

  // Filtros
  const [tab, setTab] = useState<Tab>('todos')
  const [estadoFiltro, setEstadoFiltro] = useState<Estado>('pendiente')
  const [clienteFiltro, setClienteFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCheque, setEditingCheque] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [accionCheque, setAccionCheque] = useState<any>(null)
  const [isSavingAccion, setIsSavingAccion] = useState(false)

  useEffect(() => { fetchAll() }, [])

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

  // ── RESUMEN ────────────────────────────────────────────────────────────────
  const resumen = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0]
    const pendientes = cheques.filter(c => c.estado === 'pendiente')
    const recibidosPend = pendientes.filter(c => c.tipo === 'recibido')
    const emitidosPend = pendientes.filter(c => c.tipo === 'emitido')

    return {
      porCobrar: recibidosPend.reduce((s, c) => s + Number(c.monto), 0),
      porPagar: emitidosPend.reduce((s, c) => s + Number(c.monto), 0),
      vencidos: pendientes.filter(c => c.fecha_vencimiento && c.fecha_vencimiento < hoy),
      cantRecibidos: cheques.filter(c => c.tipo === 'recibido').length,
      cantEmitidos: cheques.filter(c => c.tipo === 'emitido').length,
      cantPendRecibidos: recibidosPend.length,
      cantPendEmitidos: emitidosPend.length,
    }
  }, [cheques])

  // ── FILTRADO ───────────────────────────────────────────────────────────────
  const chequesFiltrados = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0]
    return cheques.filter(c => {
      if (tab === 'recibidos' && c.tipo !== 'recibido') return false
      if (tab === 'emitidos' && c.tipo !== 'emitido') return false
      if (estadoFiltro === 'pendiente' && c.estado !== 'pendiente') return false
      if (estadoFiltro === 'cobrado' && c.estado !== 'cobrado') return false
      if (estadoFiltro === 'pagado' && c.estado !== 'pagado') return false
      if (estadoFiltro === 'rechazado' && c.estado !== 'rechazado') return false
      if (clienteFiltro && c.cliente_id !== clienteFiltro) return false
      if (dateStart && c.fecha_vencimiento && c.fecha_vencimiento < dateStart) return false
      if (dateEnd && c.fecha_vencimiento && c.fecha_vencimiento > dateEnd) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const nombre = (c.clientes?.razon_social || c.destinatario || '').toLowerCase()
        const nro = (c.numero_cheque || '').toLowerCase()
        const banco = (c.banco || '').toLowerCase()
        if (!nombre.includes(q) && !nro.includes(q) && !banco.includes(q)) return false
      }
      return true
    })
  }, [cheques, tab, estadoFiltro, clienteFiltro, dateStart, dateEnd, busqueda])

  // ── GUARDAR ────────────────────────────────────────────────────────────────
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
        const { data: inserted, error } = await supabase
          .from('cheques_diferidos').insert([payload]).select('id').single()
        if (error) throw error

        // Si es recibido y tiene cliente → registrar en cuenta corriente
        if (data.tipo === 'recibido' && data.cliente_id) {
          const nro = data.numero_cheque ? ` Nro. ${data.numero_cheque}` : ''
          const banco = data.banco ? ` (${data.banco})` : ''
          await supabase.from('cuenta_corriente').insert([{
            cliente_id: data.cliente_id,
            fecha: data.fecha_emision || new Date().toISOString().split('T')[0],
            tipo_movimiento: 'Cheque Recibido',
            detalle: `Cheque${nro}${banco} entregado — pendiente de acreditación`,
            debe: 0,
            haber: Number(data.monto),
            estado_gestion: 'maestro',
          }])
        }

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

  // ── COBRAR / PAGAR ─────────────────────────────────────────────────────────
  async function handleAccion(fechaCobro: string, registrarEnBanco: boolean) {
    if (!accionCheque) return
    setIsSavingAccion(true)
    try {
      const esRecibido = accionCheque.tipo === 'recibido'
      const nuevoEstado = esRecibido ? 'cobrado' : 'pagado'

      await supabase.from('cheques_diferidos').update({
        estado: nuevoEstado,
        fecha_cobro: fechaCobro,
      }).eq('id', accionCheque.id)

      if (registrarEnBanco) {
        const clienteNombre = accionCheque.clientes?.razon_social || accionCheque.destinatario || 'Sin cliente'
        const nroCheque = accionCheque.numero_cheque ? ` (Nro. ${accionCheque.numero_cheque})` : ''
        const descripcion = esRecibido
          ? `Cobro cheque${nroCheque} — ${clienteNombre}`
          : `Pago cheque${nroCheque} — ${clienteNombre}`

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

        if (movData?.id) {
          await supabase.from('cheques_diferidos')
            .update({ movimiento_caja_id: movData.id })
            .eq('id', accionCheque.id)
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

  // ── RECHAZAR ───────────────────────────────────────────────────────────────
  async function handleRechazar(id: string) {
    if (!confirm('¿Marcar este cheque como rechazado?')) return
    await supabase.from('cheques_diferidos').update({ estado: 'rechazado' }).eq('id', id)
    toast.success('Cheque marcado como rechazado')
    fetchAll()
  }

  // ── ELIMINAR ───────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este cheque?')) return
    await supabase.from('cheques_diferidos').delete().eq('id', id)
    toast.success('Cheque eliminado')
    fetchAll()
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const hoy = new Date().toISOString().split('T')[0]

  function formatFecha(f: string | null) {
    if (!f) return '—'
    return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  function fmt(n: number) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
  }

  function getEstadoBadge(c: any) {
    const vencido = c.estado === 'pendiente' && c.fecha_vencimiento && c.fecha_vencimiento < hoy
    if (vencido) return { label: 'Vencido', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
    if (c.estado === 'pendiente') return { label: 'Pendiente', color: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' }
    if (c.estado === 'cobrado') return { label: 'Cobrado', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
    if (c.estado === 'pagado') return { label: 'Pagado', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
    if (c.estado === 'rechazado') return { label: 'Rechazado', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' }
    return { label: c.estado, color: 'bg-white/5 text-slate-400' }
  }

  function getDiasLabel(c: any) {
    if (!c.fecha_vencimiento || c.estado !== 'pendiente') return null
    const diff = Math.ceil((new Date(c.fecha_vencimiento + 'T12:00:00').getTime() - new Date(hoy + 'T12:00:00').getTime()) / 86400000)
    if (diff < 0) return { label: `Vencido hace ${Math.abs(diff)}d`, color: 'text-rose-400' }
    if (diff === 0) return { label: 'Vence hoy', color: 'text-amber-400' }
    if (diff <= 5) return { label: `Vence en ${diff}d`, color: 'text-amber-400' }
    return null
  }

  const hayFiltrosActivos = clienteFiltro || dateStart || dateEnd || busqueda

  return (
    <main className="min-h-screen bg-[#141c28] pt-20 lg:pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-sans italic pt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <FileCheck size={26} className="text-indigo-400" />
              Cheques
            </h1>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
              Gestión de cheques recibidos y emitidos
            </p>
          </div>
          <button
            onClick={() => { setEditingCheque(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20 shrink-0"
          >
            <Plus size={14} /> Nuevo Cheque
          </button>
        </div>

        {/* ── RESUMEN CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-sans italic">
          {/* Por cobrar */}
          <div className="bg-[#1a2537] border border-white/5 rounded-[1.8rem] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-emerald-400 shrink-0" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Por Cobrar</span>
            </div>
            <p className="text-lg md:text-xl font-black text-emerald-400 tabular-nums leading-none">{fmt(resumen.porCobrar)}</p>
            <p className="text-[8px] text-slate-600 font-bold">{resumen.cantPendRecibidos} cheque{resumen.cantPendRecibidos !== 1 ? 's' : ''} pendiente{resumen.cantPendRecibidos !== 1 ? 's' : ''}</p>
          </div>

          {/* Por pagar */}
          <div className="bg-[#1a2537] border border-white/5 rounded-[1.8rem] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown size={13} className="text-rose-400 shrink-0" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Por Pagar</span>
            </div>
            <p className="text-lg md:text-xl font-black text-rose-400 tabular-nums leading-none">{fmt(resumen.porPagar)}</p>
            <p className="text-[8px] text-slate-600 font-bold">{resumen.cantPendEmitidos} cheque{resumen.cantPendEmitidos !== 1 ? 's' : ''} emitido{resumen.cantPendEmitidos !== 1 ? 's' : ''}</p>
          </div>

          {/* Vencidos */}
          <div className={`bg-[#1a2537] border rounded-[1.8rem] p-5 space-y-2 ${resumen.vencidos.length > 0 ? 'border-amber-500/25' : 'border-white/5'}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className={resumen.vencidos.length > 0 ? 'text-amber-400 shrink-0' : 'text-slate-600 shrink-0'} />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vencidos</span>
            </div>
            <p className={`text-lg md:text-xl font-black tabular-nums leading-none ${resumen.vencidos.length > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
              {resumen.vencidos.length}
            </p>
            <p className="text-[8px] text-slate-600 font-bold">sin cobrar / pagar</p>
          </div>

          {/* Total */}
          <div className="bg-[#1a2537] border border-white/5 rounded-[1.8rem] p-5 space-y-2">
            <div className="flex items-center gap-2">
              <FileCheck size={13} className="text-indigo-400 shrink-0" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Reg.</span>
            </div>
            <p className="text-lg md:text-xl font-black text-white tabular-nums leading-none">{cheques.length}</p>
            <p className="text-[8px] text-slate-600 font-bold">{resumen.cantRecibidos} recib. · {resumen.cantEmitidos} emit.</p>
          </div>
        </div>

        {/* ── CONTROLES: TABS + BÚSQUEDA + FILTROS ── */}
        <div className="space-y-3 font-sans italic">
          {/* Fila 1: Tabs tipo + estado + botón filtros */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-start sm:items-center justify-between">
            {/* Tab tipo */}
            <div className="flex bg-[#1a2537] p-1 rounded-2xl border border-white/5 gap-0.5">
              {([
                { key: 'todos', label: 'Todos', icon: FileCheck },
                { key: 'recibidos', label: 'Recibidos', icon: ArrowUpRight },
                { key: 'emitidos', label: 'Emitidos', icon: ArrowDownLeft },
              ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${tab === key ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                  <Icon size={10} />{label}
                </button>
              ))}
            </div>

            {/* Tab estado */}
            <div className="flex bg-[#1a2537] p-1 rounded-2xl border border-white/5 gap-0.5 flex-wrap">
              {(['todos', 'pendiente', 'cobrado', 'pagado', 'rechazado'] as Estado[]).map(e => (
                <button key={e} onClick={() => setEstadoFiltro(e)}
                  className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${estadoFiltro === e ? 'bg-sky-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Fila 2: Búsqueda + filtros extra */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente, nro. cheque, banco..."
                className="w-full bg-[#1a2537] border border-white/5 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/40 transition-colors"
              />
            </div>

            {/* Botón filtros extra */}
            <button
              onClick={() => setShowFiltros(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[8px] font-black uppercase tracking-widest transition-all ${showFiltros || hayFiltrosActivos ? 'bg-sky-600/10 border-sky-500/30 text-sky-400' : 'bg-[#1a2537] border-white/5 text-slate-500 hover:text-white'}`}
            >
              <Filter size={12} />
              Filtros {hayFiltrosActivos ? '●' : ''}
            </button>
          </div>

          {/* Panel filtros extra */}
          {showFiltros && (
            <div className="bg-[#1a2537] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
              {/* Filtro cliente */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Cliente</label>
                <select
                  value={clienteFiltro}
                  onChange={e => setClienteFiltro(e.target.value)}
                  className="w-full bg-[#243248] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/40"
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
              </div>

              {/* Rango vencimiento */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Vence desde</label>
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                  className="w-full bg-[#243248] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/40" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Vence hasta</label>
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                  className="w-full bg-[#243248] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/40" />
              </div>

              <button
                onClick={() => { setClienteFiltro(''); setDateStart(''); setDateEnd(''); setBusqueda('') }}
                className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* ── TABLA / LISTA ── */}
        <div className="bg-[#1a2537]/40 border border-white/5 rounded-[2rem] overflow-hidden font-sans italic">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : chequesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <FileCheck size={36} className="text-slate-700" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sin resultados</p>
              <p className="text-[9px] text-slate-700">Probá cambiando los filtros</p>
            </div>
          ) : (
            <>
              {/* Header desktop */}
              <div className="hidden lg:grid grid-cols-[120px_1fr_150px_100px_110px_130px_90px] px-5 py-3 border-b border-white/5 gap-3">
                {['Tipo', 'Cliente / Destinatario', 'Nro. / Banco', 'Emisión', 'Vencimiento', 'Monto', ''].map(h => (
                  <p key={h} className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{h}</p>
                ))}
              </div>

              <div className="divide-y divide-white/5">
                {chequesFiltrados.map(c => {
                  const badge = getEstadoBadge(c)
                  const diasLabel = getDiasLabel(c)
                  const esRecibido = c.tipo === 'recibido'
                  const pendiente = c.estado === 'pendiente'
                  const nombre = c.clientes?.razon_social || c.destinatario || '—'

                  return (
                    <div key={c.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      {/* Layout desktop */}
                      <div className="hidden lg:grid grid-cols-[120px_1fr_150px_100px_110px_130px_90px] gap-3 items-center">
                        {/* Tipo */}
                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase border w-fit ${esRecibido ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                          {esRecibido ? <ArrowUpRight size={9} /> : <ArrowDownLeft size={9} />}
                          {esRecibido ? 'Recibido' : 'Emitido'}
                        </span>

                        {/* Cliente */}
                        <div>
                          <p className="text-sm font-black text-white truncate">{nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${badge.color}`}>{badge.label}</span>
                            {diasLabel && <span className={`text-[8px] font-bold ${diasLabel.color}`}>{diasLabel.label}</span>}
                          </div>
                        </div>

                        {/* Nro / Banco */}
                        <div>
                          {c.numero_cheque && <p className="text-xs font-bold text-slate-300 truncate">{c.numero_cheque}</p>}
                          {c.banco && <p className="text-[9px] text-slate-500 font-bold truncate">{c.banco}</p>}
                          {!c.numero_cheque && !c.banco && <p className="text-[9px] text-slate-700">—</p>}
                        </div>

                        {/* Emisión */}
                        <p className="text-xs font-bold text-slate-500">{formatFecha(c.fecha_emision)}</p>

                        {/* Vencimiento */}
                        <div>
                          <p className={`text-xs font-bold ${c.fecha_vencimiento && c.fecha_vencimiento < hoy && pendiente ? 'text-amber-400' : 'text-slate-400'}`}>
                            {formatFecha(c.fecha_vencimiento)}
                          </p>
                          {c.fecha_cobro && <p className="text-[8px] text-emerald-600 font-bold">Acred: {formatFecha(c.fecha_cobro)}</p>}
                        </div>

                        {/* Monto */}
                        <p className={`text-sm font-black tabular-nums ${esRecibido ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {esRecibido ? '+' : '-'}{fmt(c.monto)}
                        </p>

                        {/* Acciones */}
                        <div className="flex items-center gap-1">
                          {pendiente && (
                            <button onClick={() => setAccionCheque(c)} title={esRecibido ? 'Cobrar' : 'Pagar'}
                              className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          {pendiente && esRecibido && (
                            <button onClick={() => handleRechazar(c.id)} title="Rechazado"
                              className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all">
                              <XCircle size={13} />
                            </button>
                          )}
                          <button onClick={() => { setEditingCheque(c); setIsModalOpen(true) }}
                            className="p-1.5 rounded-xl text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-xl text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Layout mobile */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${esRecibido ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                {esRecibido ? <ArrowUpRight size={9} /> : <ArrowDownLeft size={9} />}
                                {esRecibido ? 'Recibido' : 'Emitido'}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${badge.color}`}>{badge.label}</span>
                              {diasLabel && <span className={`text-[8px] font-bold ${diasLabel.color}`}>{diasLabel.label}</span>}
                            </div>
                            <p className="text-sm font-black text-white truncate">{nombre}</p>
                            {c.numero_cheque && <p className="text-[9px] text-slate-500 font-bold">Nro: {c.numero_cheque}{c.banco ? ` · ${c.banco}` : ''}</p>}
                          </div>
                          <p className={`text-base font-black tabular-nums shrink-0 ${esRecibido ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {esRecibido ? '+' : '-'}{fmt(c.monto)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold">
                            {c.fecha_emision && <span>Emis: {formatFecha(c.fecha_emision)}</span>}
                            {c.fecha_vencimiento && (
                              <span className={c.fecha_vencimiento < hoy && pendiente ? 'text-amber-400' : ''}>
                                Vce: {formatFecha(c.fecha_vencimiento)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {pendiente && (
                              <button onClick={() => setAccionCheque(c)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">
                                {esRecibido ? 'Cobrar' : 'Pagar'}
                              </button>
                            )}
                            {pendiente && esRecibido && (
                              <button onClick={() => handleRechazar(c.id)}
                                className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all">
                                <XCircle size={13} />
                              </button>
                            )}
                            <button onClick={() => { setEditingCheque(c); setIsModalOpen(true) }}
                              className="p-1.5 rounded-xl text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(c.id)}
                              className="p-1.5 rounded-xl text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer count */}
              <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
                  {chequesFiltrados.length} de {cheques.length} registros
                </p>
                {chequesFiltrados.filter(c => c.estado === 'pendiente').length > 0 && (
                  <p className="text-[8px] text-sky-500 font-black uppercase tracking-widest">
                    {chequesFiltrados.filter(c => c.estado === 'pendiente').length} pendientes visibles
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MODALES ── */}
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
