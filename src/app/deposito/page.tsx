'use client'
export const dynamic = 'force-dynamic'

import { toast } from 'sonner'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { StockItemModal } from '@/components/stock/StockItemModal'
import { StockAjusteModal } from '@/components/stock/StockAjusteModal'
import {
  Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, Layers, DollarSign, Edit2, Archive,
  X, History, CheckCircle2
} from 'lucide-react'

const CATEGORIAS_FILTER = ['todos', 'repuesto', 'aceite', 'filtro', 'neumatico', 'herramienta', 'papeleria', 'higiene', 'combustible', 'electrico', 'otro']

const CAT_COLORS: Record<string, string> = {
  repuesto:    'bg-sky-500/15 text-sky-400 border-sky-500/30',
  aceite:      'bg-amber-500/15 text-amber-400 border-amber-500/30',
  filtro:      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  neumatico:   'bg-slate-500/15 text-slate-300 border-slate-500/30',
  herramienta: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  papeleria:   'bg-violet-500/15 text-violet-400 border-violet-500/30',
  higiene:     'bg-teal-500/15 text-teal-400 border-teal-500/30',
  combustible: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  electrico:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  otro:        'bg-white/10 text-slate-400 border-white/20',
}

export default function DepositoPage() {
  const supabase = getSupabase()
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('todos')
  const [showInactivos, setShowInactivos] = useState(false)

  // Modals
  const [modalItem, setModalItem] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [modalAjuste, setModalAjuste] = useState(false)
  const [ajusteItem, setAjusteItem] = useState<any>(null)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [historialItem, setHistorialItem] = useState<any>(null)

  useEffect(() => { setMounted(true); fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: stockData }, { data: movData }] = await Promise.all([
      supabase.from('stock_items').select('*').order('nombre'),
      supabase.from('stock_movimientos').select('*').order('created_at', { ascending: false }).limit(200),
    ])
    setItems(stockData || [])
    setMovimientos(movData || [])
    setLoading(false)
  }

  // KPIs
  const kpis = useMemo(() => {
    const activos = items.filter(i => i.activo)
    const stockBajo = activos.filter(i => (i.cantidad_actual ?? 0) <= (i.cantidad_minima ?? 0) && (i.cantidad_minima ?? 0) > 0)
    const sinStock = activos.filter(i => (i.cantidad_actual ?? 0) === 0)
    const valorTotal = activos.reduce((sum, i) => sum + ((i.cantidad_actual ?? 0) * (i.precio_unitario ?? 0)), 0)
    return { total: activos.length, stockBajo: stockBajo.length, sinStock: sinStock.length, valorTotal }
  }, [items])

  // Filtered items
  const filtered = useMemo(() => {
    return items
      .filter(i => showInactivos ? true : i.activo)
      .filter(i => catFilter === 'todos' || i.categoria === catFilter)
      .filter(i => {
        const q = search.toLowerCase()
        return !q || i.nombre?.toLowerCase().includes(q) || i.codigo?.toLowerCase().includes(q) || i.descripcion?.toLowerCase().includes(q)
      })
  }, [items, search, catFilter, showInactivos])

  // Historial del item seleccionado
  const historialFiltrado = useMemo(() => {
    if (!historialItem) return []
    return movimientos.filter(m => m.stock_item_id === historialItem.id)
  }, [movimientos, historialItem])

  async function handleSaveItem(data: any) {
    if (editItem) {
      await supabase.from('stock_items').update(data).eq('id', editItem.id)
    } else {
      await supabase.from('stock_items').insert(data)
    }
    await fetchAll()
    setEditItem(null)
  }

  async function handleAjuste(data: { tipo: string; cantidad: number; motivo: string; notas: string }) {
    if (!ajusteItem) return
    const antes = ajusteItem.cantidad_actual ?? 0
    let despues: number
    if (data.tipo === 'entrada') despues = antes + data.cantidad
    else if (data.tipo === 'salida') despues = Math.max(0, antes - data.cantidad)
    else despues = data.cantidad // ajuste = setear directo

    // Guarda movimiento
    await supabase.from('stock_movimientos').insert({
      stock_item_id: ajusteItem.id,
      tipo: data.tipo,
      cantidad: data.cantidad,
      cantidad_antes: antes,
      cantidad_despues: despues,
      motivo: data.motivo,
      notas: data.notas || null,
      fecha: new Date().toISOString().split('T')[0],
    })
    // Actualiza stock
    await supabase.from('stock_items').update({ cantidad_actual: despues }).eq('id', ajusteItem.id)
    await fetchAll()
    setAjusteItem(null)
  }

  async function handleToggleActivo(item: any) {
    await supabase.from('stock_items').update({ activo: !item.activo }).eq('id', item.id)
    await fetchAll()
  }

  async function handleDelete(id: string) {
    toast('¿Eliminar este artículo permanentemente?', {
      action: { label: 'Eliminar', onClick: async () => {
        await supabase.from('stock_movimientos').delete().eq('stock_item_id', id)
        await supabase.from('stock_items').delete().eq('id', id)
        await fetchAll()
      }},
      cancel: { label: 'Cancelar', onClick: () => {} }
    })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#141c28] pt-20 md:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 bg-teal-500/15 border border-teal-500/30 rounded-xl inline-flex">
                <Package size={22} className="text-teal-400" />
              </span>
              Depósito
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-1">Gestión de stock e inventario de repuestos e insumos</p>
          </div>
          <button
            onClick={() => { setEditItem(null); setModalItem(true) }}
            className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-teal-600/20 active:scale-95"
          >
            <Plus size={16} /> Nuevo Artículo
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a2537] border border-white/[0.08] rounded-[1.5rem] p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-teal-500/15 rounded-lg shrink-0">
                <Layers size={14} className="text-teal-400" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">Artículos</span>
            </div>
            <p className="text-2xl md:text-3xl font-black text-white">{kpis.total}</p>
            <p className="text-[11px] text-slate-500 mt-1">en inventario</p>
          </div>
          <div className={`bg-[#1a2537] border rounded-[1.5rem] p-4 md:p-5 ${kpis.stockBajo > 0 ? 'border-amber-500/30' : 'border-white/[0.08]'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${kpis.stockBajo > 0 ? 'bg-amber-500/15' : 'bg-white/5'}`}>
                <AlertTriangle size={14} className={kpis.stockBajo > 0 ? 'text-amber-400' : 'text-slate-600'} />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">Stock Bajo</span>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${kpis.stockBajo > 0 ? 'text-amber-400' : 'text-white'}`}>{kpis.stockBajo}</p>
            <p className="text-[11px] text-slate-500 mt-1">bajo el mínimo</p>
          </div>
          <div className={`bg-[#1a2537] border rounded-[1.5rem] p-4 md:p-5 ${kpis.sinStock > 0 ? 'border-rose-500/30' : 'border-white/[0.08]'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg shrink-0 ${kpis.sinStock > 0 ? 'bg-rose-500/15' : 'bg-white/5'}`}>
                <X size={14} className={kpis.sinStock > 0 ? 'text-rose-400' : 'text-slate-600'} />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">Sin Stock</span>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${kpis.sinStock > 0 ? 'text-rose-400' : 'text-white'}`}>{kpis.sinStock}</p>
            <p className="text-[11px] text-slate-500 mt-1">sin unidades</p>
          </div>
          <div className="bg-[#1a2537] border border-white/[0.08] rounded-[1.5rem] p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg shrink-0">
                <DollarSign size={14} className="text-emerald-400" />
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-tight">Valor Total</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-400 leading-tight">
              ${kpis.valorTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">en inventario</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código..."
                className="w-full bg-[#1a2537] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/40 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowInactivos(!showInactivos)}
              className={`px-5 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                showInactivos
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#1a2537] border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              {showInactivos ? 'Ocultar inactivos' : 'Ver inactivos'}
            </button>
          </div>
          {/* Categorías — scroll horizontal en mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIAS_FILTER.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all capitalize whitespace-nowrap shrink-0 ${
                  catFilter === cat
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-[#1a2537] border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GRID DE ITEMS */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Cargando depósito...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package size={40} className="text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold">No hay artículos</p>
            <p className="text-slate-600 text-sm mt-1">
              {search || catFilter !== 'todos' ? 'Ningún artículo coincide con los filtros.' : 'Agregá el primer artículo al depósito.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(item => {
              const stockBajo = (item.cantidad_actual ?? 0) <= (item.cantidad_minima ?? 0) && (item.cantidad_minima ?? 0) > 0
              const sinStock = (item.cantidad_actual ?? 0) === 0
              const pct = item.cantidad_maxima > 0
                ? Math.min(100, Math.round(((item.cantidad_actual ?? 0) / item.cantidad_maxima) * 100))
                : null

              return (
                <div
                  key={item.id}
                  className={`bg-[#1a2537] border rounded-[1.5rem] overflow-hidden transition-all hover:shadow-lg flex flex-col ${
                    !item.activo ? 'opacity-50 border-white/[0.05]' :
                    sinStock ? 'border-rose-500/30' :
                    stockBajo ? 'border-amber-500/30' :
                    'border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {/* Top color bar */}
                  <div className={`h-1 w-full shrink-0 ${sinStock ? 'bg-rose-500' : stockBajo ? 'bg-amber-500' : item.activo ? 'bg-teal-500/60' : 'bg-white/10'}`} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-white leading-tight truncate">{item.nombre}</h3>
                        {item.codigo && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.codigo}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase shrink-0 ${CAT_COLORS[item.categoria] || CAT_COLORS.otro}`}>
                        {item.categoria}
                      </span>
                    </div>

                    {/* Stock display */}
                    <div className="bg-[#243248] rounded-xl p-3 mb-3">
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Stock actual</p>
                          <p className={`text-2xl font-black ${sinStock ? 'text-rose-400' : stockBajo ? 'text-amber-400' : 'text-white'}`}>
                            {item.cantidad_actual ?? 0}
                            <span className="text-xs text-slate-500 font-normal ml-1">{item.unidad}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          {item.cantidad_minima > 0 && (
                            <p className="text-[9px] text-slate-500 uppercase">Mín: {item.cantidad_minima}</p>
                          )}
                          {item.cantidad_maxima > 0 && (
                            <p className="text-[9px] text-slate-500 uppercase">Máx: {item.cantidad_maxima}</p>
                          )}
                        </div>
                      </div>
                      {/* Barra de progreso */}
                      {pct !== null && (
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${sinStock ? 'bg-rose-500' : stockBajo ? 'bg-amber-500' : pct > 70 ? 'bg-teal-500' : 'bg-sky-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Precio + descripcion */}
                    {item.precio_unitario > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <DollarSign size={12} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-bold">
                          ${item.precio_unitario.toLocaleString('es-AR')} / {item.unidad}
                        </span>
                        {item.cantidad_actual > 0 && (
                          <span className="text-[10px] text-slate-600 ml-auto">
                            Total: ${(item.cantidad_actual * item.precio_unitario).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    )}
                    {item.descripcion && (
                      <p className="text-[11px] text-slate-500 leading-tight mb-3 line-clamp-2">{item.descripcion}</p>
                    )}

                    {/* Alerta stock bajo */}
                    {(sinStock || stockBajo) && item.activo && (
                      <div className={`flex items-center gap-2 py-2 px-3 rounded-lg mb-3 text-[10px] font-bold ${sinStock ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        <AlertTriangle size={12} />
                        {sinStock ? 'Sin stock disponible' : `Stock bajo (mín: ${item.cantidad_minima} ${item.unidad})`}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
                      <button
                        onClick={() => { setAjusteItem(item); setModalAjuste(true) }}
                        disabled={!item.activo}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={12} /> Mover
                      </button>
                      <button
                        onClick={() => { setHistorialItem(item); setModalHistorial(true) }}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <History size={12} /> Historial
                      </button>
                      <button
                        onClick={() => { setEditItem(item); setModalItem(true) }}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(item)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          item.activo
                            ? 'bg-white/5 border-white/10 text-slate-500 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {item.activo ? <><Archive size={12} /> Dar baja</> : <><CheckCircle2 size={12} /> Activar</>}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL HISTORIAL */}
      {modalHistorial && historialItem && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalHistorial(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-[#1a2537] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#243248]/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/15 border border-teal-500/30 rounded-xl">
                  <History size={18} className="text-teal-400" />
                </div>
                <div>
                  <h2 className="font-black text-sm uppercase tracking-widest text-white">Historial de Movimientos</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{historialItem.nombre}</p>
                </div>
              </div>
              <button onClick={() => setModalHistorial(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {historialFiltrado.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historialFiltrado.map(mov => (
                    <div key={mov.id} className="flex items-center gap-4 p-4 bg-[#243248] rounded-xl">
                      <div className={`p-2 rounded-lg shrink-0 ${mov.tipo === 'entrada' ? 'bg-emerald-500/15 text-emerald-400' : mov.tipo === 'salida' ? 'bg-rose-500/15 text-rose-400' : 'bg-sky-500/15 text-sky-400'}`}>
                        {mov.tipo === 'entrada' ? <TrendingUp size={14} /> : mov.tipo === 'salida' ? <TrendingDown size={14} /> : <RefreshCw size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${mov.tipo === 'entrada' ? 'bg-emerald-500/15 text-emerald-400' : mov.tipo === 'salida' ? 'bg-rose-500/15 text-rose-400' : 'bg-sky-500/15 text-sky-400'}`}>
                            {mov.tipo}
                          </span>
                          <span className="font-black text-sm text-white">
                            {mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : '='}{mov.cantidad} {historialItem.unidad}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate">{mov.motivo}</p>
                        {mov.notas && <p className="text-[10px] text-slate-600 mt-0.5 truncate">{mov.notas}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">
                          {mov.cantidad_antes ?? '?'} → <span className="text-white font-bold">{mov.cantidad_despues ?? '?'}</span>
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {mov.fecha ? new Date(mov.fecha + 'T00:00:00').toLocaleDateString('es-AR') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <StockItemModal
        open={modalItem}
        onClose={() => { setModalItem(false); setEditItem(null) }}
        onSave={handleSaveItem}
        item={editItem}
      />
      <StockAjusteModal
        open={modalAjuste}
        onClose={() => { setModalAjuste(false); setAjusteItem(null) }}
        onSave={handleAjuste}
        item={ajusteItem}
      />
    </div>
  )
}
