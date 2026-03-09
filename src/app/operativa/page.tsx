'use client'
import { useState, useEffect } from 'react'
import {
  Package, Plus, Edit3, Trash2, AlertTriangle,
  CheckCircle2, X, Save, Loader2, Archive,
  Wrench, Droplets, Zap, Box, ChevronUp, ChevronDown
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════
//  TIPOS
// ═══════════════════════════════════════════════════════════
type Categoria = 'cubiertas' | 'lubricantes' | 'repuestos' | 'herramientas' | 'insumos' | 'otros'

interface ItemStock {
  id: string
  nombre: string
  categoria: Categoria
  cantidad: number
  unidad: string
  stock_minimo: number
  notas: string
  updated_at: string
}

const CATEGORIAS: { value: Categoria; label: string; icon: any; color: string }[] = [
  { value: 'cubiertas',    label: 'Cubiertas',    icon: Archive,   color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { value: 'lubricantes',  label: 'Lubricantes',  icon: Droplets,  color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'repuestos',    label: 'Repuestos',    icon: Wrench,    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { value: 'herramientas', label: 'Herramientas', icon: Wrench,    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'insumos',      label: 'Insumos',      icon: Zap,       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'otros',        label: 'Otros',        icon: Box,       color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
]

const STORAGE_KEY = 'rds_operativa_stock'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ═══════════════════════════════════════════════════════════
//  MODAL ITEM
// ═══════════════════════════════════════════════════════════
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<ItemStock, 'id' | 'updated_at'>) => void
  editing: ItemStock | null
}

function ItemModal({ isOpen, onClose, onSubmit, editing }: ModalProps) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'cubiertas' as Categoria,
    cantidad: 0, unidad: 'unidades', stock_minimo: 1, notas: '',
  })

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setForm({
        nombre: editing.nombre,
        categoria: editing.categoria,
        cantidad: editing.cantidad,
        unidad: editing.unidad,
        stock_minimo: editing.stock_minimo,
        notas: editing.notas,
      })
    } else {
      setForm({ nombre: '', categoria: 'cubiertas', cantidad: 0, unidad: 'unidades', stock_minimo: 1, notas: '' })
    }
  }, [isOpen, editing])

  if (!isOpen) return null

  const cat = CATEGORIAS.find(c => c.value === form.categoria)

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-emerald-500" />

        <div className="flex justify-between items-start mb-7">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-1">
              {editing ? 'Editar Item' : 'Nuevo Item'}
            </p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Depósito</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">

          {/* CATEGORÍA */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Categoría</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIAS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(p => ({ ...p, categoria: c.value }))}
                  className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                    form.categoria === c.value
                      ? `border-current ${c.color}`
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* NOMBRE */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Nombre</label>
            <input required placeholder="EJ: CUBIERTA 295/80 R22.5"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm uppercase outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700" />
          </div>

          {/* CANTIDAD + UNIDAD */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Cantidad</label>
              <input required type="number" min="0" step="0.01"
                value={form.cantidad}
                onChange={e => setForm(p => ({ ...p, cantidad: Math.max(0, Number(e.target.value)) }))}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-xl tabular-nums outline-none focus:border-emerald-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Unidad</label>
              <select value={form.unidad}
                onChange={e => setForm(p => ({ ...p, unidad: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-sm outline-none focus:border-emerald-500 transition-all appearance-none">
                {['unidades', 'litros', 'kg', 'metros', 'pares', 'cajas', 'rollos'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STOCK MÍNIMO */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">
              Stock Mínimo <span className="text-slate-700">(alerta cuando baje de)</span>
            </label>
            <input required type="number" min="0" step="0.01"
              value={form.stock_minimo}
              onChange={e => setForm(p => ({ ...p, stock_minimo: Math.max(0, Number(e.target.value)) }))}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm outline-none focus:border-amber-500 transition-all" />
          </div>

          {/* NOTAS */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">
              Notas <span className="text-slate-700">(opcional)</span>
            </label>
            <input placeholder="EJ: MARCA, PROVEEDOR, UBICACIÓN..."
              value={form.notas}
              onChange={e => setForm(p => ({ ...p, notas: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-5 text-white font-bold text-sm uppercase outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700" />
          </div>

          <button type="submit"
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl">
            <Save size={16} />
            {editing ? 'Guardar Cambios' : 'Agregar al Depósito'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  MODAL AJUSTE RÁPIDO DE CANTIDAD
// ═══════════════════════════════════════════════════════════
function AjusteModal({ item, onClose, onSave }: { item: ItemStock | null; onClose: () => void; onSave: (id: string, nueva: number) => void }) {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (item) setValor(item.cantidad)
  }, [item])

  if (!item) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-xs rounded-[2.5rem] border border-white/10 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-sky-500" />

        <p className="text-[9px] font-black text-sky-400 uppercase tracking-[0.4em] mb-1">Ajustar Stock</p>
        <p className="text-lg font-black text-white uppercase mb-6 truncate">{item.nombre}</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button type="button" onClick={() => setValor(v => Math.max(0, v - 1))}
            className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-all active:scale-95">
            <ChevronDown size={20} />
          </button>
          <input type="number" min="0" step="0.01" value={valor}
            onChange={e => setValor(Math.max(0, Number(e.target.value)))}
            className="w-32 text-center bg-slate-900 border border-white/10 rounded-xl py-3 text-white font-black text-2xl tabular-nums outline-none focus:border-sky-500" />
          <button type="button" onClick={() => setValor(v => v + 1)}
            className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-all active:scale-95">
            <ChevronUp size={20} />
          </button>
        </div>

        <p className="text-center text-[8px] text-slate-600 font-black uppercase tracking-widest mb-6">
          {item.unidad} en stock
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 font-black text-[9px] uppercase tracking-widest hover:text-white transition-all">
            Cancelar
          </button>
          <button onClick={() => { onSave(item.id, valor); onClose() }}
            className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[9px] uppercase tracking-widest transition-all active:scale-95">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function OperativaPage() {
  const [items, setItems] = useState<ItemStock[]>([])
  const [loaded, setLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<ItemStock | null>(null)
  const [ajustando, setAjustando] = useState<ItemStock | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | 'todas'>('todas')
  const [soloAlertas, setSoloAlertas] = useState(false)

  // ── Cargar desde localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  // ── Guardar en localStorage ──
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, loaded])

  function handleSave(data: Omit<ItemStock, 'id' | 'updated_at'>) {
    if (editing) {
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...data, updated_at: new Date().toISOString() } : i))
    } else {
      setItems(prev => [...prev, { ...data, id: genId(), updated_at: new Date().toISOString() }])
    }
    setIsModalOpen(false)
    setEditing(null)
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este item del depósito?')) return
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function handleAjuste(id: string, nueva: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad: nueva, updated_at: new Date().toISOString() } : i))
  }

  // ── Filtros ──
  const itemsFiltrados = items
    .filter(i => filtroCategoria === 'todas' || i.categoria === filtroCategoria)
    .filter(i => !soloAlertas || i.cantidad <= i.stock_minimo)

  // ── KPIs ──
  const totalItems = items.length
  const alertas = items.filter(i => i.cantidad <= i.stock_minimo && i.stock_minimo > 0)
  const sinStock = items.filter(i => i.cantidad === 0)
  const categoriasMas = CATEGORIAS.map(c => ({
    ...c,
    count: items.filter(i => i.categoria === c.value).length
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  if (!loaded) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
    </div>
  )

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
            OPERATIVA<br />
            <span className="text-emerald-500 font-thin">/ DEPÓSITO</span>
          </h1>
          <button onClick={() => { setEditing(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-xl group">
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Agregar Item
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Items en Depósito</p>
            <p className="text-3xl font-black text-white italic tabular-nums">{totalItems}</p>
          </div>
          <div className={`border rounded-[2rem] p-6 ${alertas.length > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-900/40 border-white/5'}`}>
            <p className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 ${alertas.length > 0 ? 'text-amber-400/70' : 'text-slate-600'}`}>Stock Bajo</p>
            <p className={`text-3xl font-black italic tabular-nums ${alertas.length > 0 ? 'text-amber-400' : 'text-white'}`}>{alertas.length}</p>
            {alertas.length > 0 && <p className="text-[8px] text-amber-400/60 font-bold mt-1">Reponer pronto</p>}
          </div>
          <div className={`border rounded-[2rem] p-6 ${sinStock.length > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/40 border-white/5'}`}>
            <p className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 ${sinStock.length > 0 ? 'text-rose-400/70' : 'text-slate-600'}`}>Sin Stock</p>
            <p className={`text-3xl font-black italic tabular-nums ${sinStock.length > 0 ? 'text-rose-400' : 'text-white'}`}>{sinStock.length}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6">
            <p className="text-[8px] font-black text-emerald-400/70 uppercase tracking-[0.3em] mb-1">Categorías</p>
            <p className="text-3xl font-black text-emerald-400 italic tabular-nums">{categoriasMas.length}</p>
          </div>
        </div>

        {/* ALERTA CRÍTICA */}
        {alertas.length > 0 && (
          <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-[2rem] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">
                {alertas.length} item{alertas.length > 1 ? 's' : ''} con stock bajo o agotado
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertas.map(a => (
                <span key={a.id} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                  a.cantidad === 0
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {a.cantidad === 0 ? '⚠ ' : ''}{a.nombre}: {a.cantidad} {a.unidad}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              <button onClick={() => setFiltroCategoria('todas')}
                className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${filtroCategoria === 'todas' ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>
                Todas
              </button>
              {CATEGORIAS.map(c => (
                <button key={c.value} onClick={() => setFiltroCategoria(c.value)}
                  className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${filtroCategoria === c.value ? `border-current ${c.color}` : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setSoloAlertas(!soloAlertas)}
            className={`ml-auto px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${soloAlertas ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>
            <AlertTriangle size={12} />
            Solo Alertas
          </button>
        </div>

        {/* LISTA DE ITEMS */}
        {itemsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-30">
            <Package size={56} className="text-slate-600 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
              {items.length === 0 ? 'Sin items en el depósito' : 'Sin resultados para el filtro'}
            </p>
            {items.length === 0 && (
              <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-1">
                Agregá cubiertas, aceite, repuestos...
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/30 rounded-[2rem] border border-white/5 overflow-hidden">
            {/* Header tabla */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px_auto] gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">
              <span>Item</span>
              <span className="text-center">Cantidad</span>
              <span className="text-center">Mínimo</span>
              <span className="text-center">Estado</span>
              <span className="text-center">Acciones</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {itemsFiltrados.map(item => {
                const cat = CATEGORIAS.find(c => c.value === item.categoria)!
                const sinStock = item.cantidad === 0
                const stockBajo = !sinStock && item.stock_minimo > 0 && item.cantidad <= item.stock_minimo
                const ok = !sinStock && !stockBajo

                return (
                  <div key={item.id}
                    className={`flex flex-col sm:grid sm:grid-cols-[1fr_120px_120px_100px_auto] gap-3 sm:gap-4 px-5 sm:px-6 py-4 transition-all hover:bg-white/[0.02] group ${sinStock ? 'bg-rose-500/[0.03]' : stockBajo ? 'bg-amber-500/[0.03]' : ''}`}>

                    {/* NOMBRE + CATEGORÍA */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${cat.color}`}>
                        <cat.icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white uppercase truncate">{item.nombre}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[8px] font-black uppercase tracking-widest border rounded-lg px-2 py-0.5 ${cat.color}`}>
                            {cat.label}
                          </span>
                          {item.notas && (
                            <span className="text-[8px] font-bold text-slate-600 uppercase truncate">{item.notas}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CANTIDAD */}
                    <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0">
                      <span className="sm:hidden text-[8px] font-black text-slate-600 uppercase tracking-widest">Stock:</span>
                      <button onClick={() => setAjustando(item)}
                        className={`text-2xl font-black tabular-nums transition-all hover:scale-110 active:scale-95 ${sinStock ? 'text-rose-400' : stockBajo ? 'text-amber-400' : 'text-white'}`}
                        title="Ajustar cantidad">
                        {item.cantidad}
                      </button>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${sinStock ? 'text-rose-400/60' : stockBajo ? 'text-amber-400/60' : 'text-slate-600'}`}>
                        {item.unidad}
                      </span>
                    </div>

                    {/* MÍNIMO */}
                    <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0">
                      <span className="sm:hidden text-[8px] font-black text-slate-600 uppercase tracking-widest">Mín:</span>
                      <span className="text-lg font-black text-slate-500 tabular-nums">{item.stock_minimo}</span>
                      <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">{item.unidad}</span>
                    </div>

                    {/* ESTADO */}
                    <div className="flex sm:justify-center items-center">
                      {sinStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-black uppercase rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <AlertTriangle size={10} /> Sin Stock
                        </span>
                      ) : stockBajo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-black uppercase rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <AlertTriangle size={10} /> Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-black uppercase rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 size={10} /> OK
                        </span>
                      )}
                    </div>

                    {/* ACCIONES */}
                    <div className="flex gap-1.5 items-center justify-end sm:justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setAjustando(item)}
                        className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/20 transition-all"
                        title="Ajustar stock">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => { setEditing(item); setIsModalOpen(true) }}
                        className="p-2 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-lg border border-white/5 transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="p-2 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg border border-white/5 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PIE */}
        {items.length > 0 && (
          <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
            {itemsFiltrados.length} de {items.length} items · Datos guardados localmente
          </p>
        )}
      </div>

      <ItemModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null) }} onSubmit={handleSave} editing={editing} />
      <AjusteModal item={ajustando} onClose={() => setAjustando(null)} onSave={handleAjuste} />
    </main>
  )
}
