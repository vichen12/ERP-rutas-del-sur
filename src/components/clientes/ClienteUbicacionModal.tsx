'use client'
// src/components/clientes/ClienteUbicacionModal.tsx
// Modal para crear / editar una ubicación de cliente
// El usuario busca por texto o clickea directamente en el mapa para marcar el punto
import { useState, useEffect, useRef } from 'react'
import {
  X, MapPin, Loader2, CheckCircle2,
  DollarSign, Ruler, Fuel, Search, Navigation
} from 'lucide-react'

interface UbicacionForm {
  nombre:        string
  direccion:     string
  lat:           number | null
  lng:           number | null
  tarifa_flete:  string
  km_desde_base: string
  lts_estimados: string
  es_origen:     boolean
  notas:         string
}

interface Props {
  isOpen:         boolean
  onClose:        () => void
  onSubmit:       (data: UbicacionForm) => Promise<void>
  initialData?:   any
  isSaving:       boolean
  clienteNombre?: string
}

const EMPTY: UbicacionForm = {
  nombre: '', direccion: '', lat: null, lng: null,
  tarifa_flete: '', km_desde_base: '', lts_estimados: '',
  es_origen: false, notas: ''
}

// Centro default: Mendoza
const DEFAULT_LAT  = -32.8895
const DEFAULT_LNG  = -68.8458
const DEFAULT_ZOOM = 12

export function ClienteUbicacionModal({
  isOpen, onClose, onSubmit, initialData, isSaving, clienteNombre
}: Props) {
  const [form, setForm]             = useState<UbicacionForm>(EMPTY)
  const [searching, setSearching]   = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState('')
  const [mapReady, setMapReady]     = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef  = useRef<any>(null)
  const markerRef       = useRef<any>(null)
  const leafletRef      = useRef<any>(null)
  const formRef         = useRef(form)

  // Mantener ref actualizada para usar dentro de closures del mapa
  useEffect(() => { formRef.current = form }, [form])

  const set = (field: keyof UbicacionForm, val: any) =>
    setForm(p => ({ ...p, [field]: val }))

  // Reset al abrir
  useEffect(() => {
    if (!isOpen) return
    const initial = initialData ? {
      nombre:        initialData.nombre        || '',
      direccion:     initialData.direccion      || '',
      lat:           initialData.lat            != null ? Number(initialData.lat) : null,
      lng:           initialData.lng            != null ? Number(initialData.lng) : null,
      tarifa_flete:  initialData.tarifa_flete   ? String(initialData.tarifa_flete) : '',
      km_desde_base: initialData.km_desde_base  ? String(initialData.km_desde_base) : '',
      lts_estimados: initialData.lts_estimados  ? String(initialData.lts_estimados) : '',
      es_origen:     initialData.es_origen      || false,
      notas:         initialData.notas          || '',
    } : EMPTY
    setForm(initial)
    setSearchInput(initialData?.direccion || '')
    setSearchError('')
  }, [isOpen, initialData])

  // Cargar Leaflet dinámicamente (Next.js safe)
  useEffect(() => {
    if (!isOpen) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    if ((window as any).L) {
      leafletRef.current = (window as any).L
      setMapReady(true)
      return
    }

    const script = document.createElement('script')
    script.id  = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      leafletRef.current = (window as any).L
      setMapReady(true)
    }
    document.head.appendChild(script)
  }, [isOpen])

  // Inicializar mapa
  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || mapInstanceRef.current) return

    const L = leafletRef.current

    const makePinIcon = () => L.divIcon({
      html: `<div style="
        width:32px;height:32px;
        background:linear-gradient(135deg,#ef4444,#dc2626);
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 4px 20px rgba(239,68,68,0.6);
        cursor:grab;
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: ''
    })

    const startLat = formRef.current.lat ?? DEFAULT_LAT
    const startLng = formRef.current.lng ?? DEFAULT_LNG

    const map = L.map(mapContainerRef.current, {
      center:      [startLat, startLng],
      zoom:        formRef.current.lat ? 15 : DEFAULT_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    // Pin inicial si hay coords guardadas
    if (formRef.current.lat != null && formRef.current.lng != null) {
      markerRef.current = L.marker(
        [formRef.current.lat, formRef.current.lng],
        { icon: makePinIcon(), draggable: true }
      ).addTo(map)

      markerRef.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng()
        setForm(p => ({ ...p, lat, lng }))
        reverseGeocode(lat, lng)
      })
    }

    // Click en mapa → poner/mover pin
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], {
          icon: makePinIcon(),
          draggable: true,
        }).addTo(map)

        markerRef.current.on('dragend', (ev: any) => {
          const pos = ev.target.getLatLng()
          setForm(p => ({ ...p, lat: pos.lat, lng: pos.lng }))
          reverseGeocode(pos.lat, pos.lng)
        })
      }

      setForm(p => ({ ...p, lat, lng }))
      reverseGeocode(lat, lng)
    })

    mapInstanceRef.current = map
    setTimeout(() => map.invalidateSize(), 150)
  }, [mapReady])

  // Cleanup al cerrar
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current      = null
      setMapReady(false)
    }
  }, [isOpen])

  // Reverse geocoding: coords → dirección
  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'RutasDelSurERP/1.0' } }
      )
      const data = await res.json()
      if (data?.display_name) {
        const partes = data.display_name.split(',').slice(0, 4).join(',')
        setForm(p => ({ ...p, direccion: data.display_name }))
        setSearchInput(partes)
      }
    } catch { /* silencioso */ }
  }

  // Búsqueda de dirección
  async function buscarDireccion() {
    if (!searchInput.trim() || !mapInstanceRef.current) return
    setSearching(true)
    setSearchError('')

    try {
      const q   = encodeURIComponent(searchInput + ', Mendoza, Argentina')
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
        { headers: { 'Accept-Language': 'es', 'User-Agent': 'RutasDelSurERP/1.0' } }
      )
      const data = await res.json()

      if (!data.length) {
        setSearchError('No se encontró. Intentá escribir solo la calle y ciudad, o marcá el punto en el mapa.')
        setSearching(false)
        return
      }

      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      const L   = leafletRef.current

      mapInstanceRef.current.setView([lat, lng], 16)

      const makePinIcon = () => L.divIcon({
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#ef4444,#dc2626);border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 20px rgba(239,68,68,0.6);cursor:grab;"></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32], className: ''
      })

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], {
          icon: makePinIcon(), draggable: true
        }).addTo(mapInstanceRef.current)

        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng()
          setForm(p => ({ ...p, lat: pos.lat, lng: pos.lng }))
          reverseGeocode(pos.lat, pos.lng)
        })
      }

      setForm(p => ({ ...p, lat, lng, direccion: data[0].display_name }))

    } catch {
      setSearchError('Error al buscar. Clickeá el punto directamente en el mapa.')
    } finally {
      setSearching(false)
    }
  }

  if (!isOpen) return null

  const tienePin = form.lat !== null && form.lng !== null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto font-sans italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl relative my-auto overflow-hidden">

        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 z-10" />

        {/* Header */}
        <div className="flex justify-between items-start p-8 pb-5">
          <div>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">
              {initialData ? 'Editar Ubicación' : 'Nueva Ubicación'}
            </p>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
              {clienteNombre || 'Cliente'}
            </h2>
            <p className="text-[9px] font-bold text-slate-600 uppercase mt-1.5 flex items-center gap-1.5">
              <MapPin size={10} className="text-emerald-500" />
              Buscá una dirección o clickeá en el mapa
            </p>
          </div>
          <button onClick={onClose}
            className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all mt-1">
            <X size={20} />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-8 pb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                placeholder="Ej: Luján de Cuyo, Ruta 40 km 40..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarDireccion())}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white font-bold text-sm outline-none focus:border-sky-500 placeholder:text-slate-700 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={buscarDireccion}
              disabled={searching || !searchInput.trim()}
              className="px-5 py-3.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest shrink-0 active:scale-95"
            >
              {searching
                ? <Loader2 size={14} className="animate-spin" />
                : <Navigation size={14} />}
              Buscar
            </button>
          </div>

          {searchError && (
            <p className="text-[9px] font-bold text-amber-400 ml-2">{searchError}</p>
          )}

          {tienePin && !searchError && (
            <div className="flex items-center gap-2 ml-2">
              <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
              <p className="text-[9px] font-black text-emerald-400 truncate">
                {form.direccion
                  ? form.direccion.split(',').slice(0, 3).join(',').trim()
                  : `${form.lat!.toFixed(5)}, ${form.lng!.toFixed(5)}`}
              </p>
            </div>
          )}
        </div>

        {/* MAPA */}
        <div className="mx-8 mb-6 relative rounded-2xl overflow-hidden border border-white/10" style={{ height: 280 }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {!mapReady && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-sky-500" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cargando mapa...</p>
              </div>
            </div>
          )}

          {mapReady && !tienePin && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/75 backdrop-blur-sm rounded-full pointer-events-none border border-white/10">
              <p className="text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                👆 Clickeá para marcar el punto
              </p>
            </div>
          )}

          {tienePin && (
            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/75 backdrop-blur-sm rounded-full pointer-events-none border border-emerald-500/30">
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                ✓ Arrastrá el pin para ajustar
              </p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form
          onSubmit={e => { e.preventDefault(); onSubmit(form) }}
          className="px-8 pb-8 space-y-4"
        >
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-3 tracking-widest">
              Nombre del Punto
            </label>
            <input
              required
              placeholder="EJ: PLANTA LUJÁN, DEPÓSITO CENTRO, OFICINAS GODOY CRUZ"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-xs uppercase outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700"
            />
          </div>

          {/* Datos económicos */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
            <p className="text-[9px] font-black text-sky-500 uppercase tracking-[0.3em]">
              Datos del Trayecto
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <DollarSign size={9} /> Tarifa ($)
                </label>
                <input
                  type="number" step="0.01" min="0"
                  placeholder="0.00"
                  value={form.tarifa_flete}
                  onChange={e => set('tarifa_flete', e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-emerald-400 font-black text-sm tabular-nums outline-none focus:border-emerald-500 placeholder:text-slate-800"
                />
                <p className="text-[7px] text-slate-700 font-black uppercase ml-1">Vacío = tarifa del cliente</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <Ruler size={9} /> KM desde base
                </label>
                <input
                  type="number" step="0.1" min="0"
                  placeholder="0"
                  value={form.km_desde_base}
                  onChange={e => set('km_desde_base', e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-violet-400 font-black text-sm tabular-nums outline-none focus:border-violet-500 placeholder:text-slate-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <Fuel size={9} /> Litros est.
                </label>
                <input
                  type="number" step="0.1" min="0"
                  placeholder="0"
                  value={form.lts_estimados}
                  onChange={e => set('lts_estimados', e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-amber-400 font-black text-sm tabular-nums outline-none focus:border-amber-500 placeholder:text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Toggle origen */}
          <button
            type="button"
            onClick={() => set('es_origen', !form.es_origen)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
              form.es_origen
                ? 'bg-sky-500/10 border-sky-500/30'
                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-widest ${form.es_origen ? 'text-sky-400' : 'text-slate-500'}`}>
              ¿También puede ser punto de ORIGEN?
            </span>
            <span className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${form.es_origen ? 'bg-sky-500' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.es_origen ? 'left-5' : 'left-0.5'}`} />
            </span>
          </button>

          {/* Notas */}
          <textarea
            rows={2}
            placeholder="Notas: horario de descarga, contacto en planta, instrucciones de acceso..."
            value={form.notas}
            onChange={e => set('notas', e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-sm outline-none focus:border-white/20 resize-none placeholder:text-slate-700"
          />

          <button
            type="submit"
            disabled={isSaving || !form.nombre.trim() || !tienePin}
            className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
          >
            {isSaving
              ? <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              : !tienePin
              ? <><MapPin size={18} /> Marcá primero el punto en el mapa</>
              : <><CheckCircle2 size={18} /> {initialData ? 'Guardar Cambios' : 'Registrar Ubicación'}</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}