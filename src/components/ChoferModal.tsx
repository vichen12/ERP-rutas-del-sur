'use client'
import { useState, useRef } from 'react'
import { X, Loader2, CheckCircle2, ChevronRight, Calendar, Activity, UserCircle, UploadCloud, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ChoferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
}

export function ChoferModal({ isOpen, onClose, onSubmit, isSubmitting, editingId, formData, setFormData }: ChoferModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null;

  // --- HANDLERS DE ARRASTRAR Y SOLTAR ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // Convierte la imagen a Base64 para guardarla directo en la DB
  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData({ ...formData, foto_url: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFormData({ ...formData, foto_url: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto font-sans italic">
      
      <div className="bg-[#020617] w-full max-w-lg rounded-[3rem] border border-white/10 p-8 md:p-10 shadow-2xl relative overflow-hidden my-10">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Recursos Humanos</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              {editingId ? 'Editar Legajo' : 'Alta de Chofer'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all hover:rotate-90">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* =========================================
              1. ZONA DRAG & DROP (FOTO)
          ========================================= */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-indigo-400 uppercase pl-3 tracking-widest">
              Foto de Perfil
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden group ${
                isDragging 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : formData.foto_url 
                  ? 'border-white/10 bg-slate-950 hover:border-indigo-500/50' 
                  : 'border-white/10 bg-slate-950 hover:bg-slate-900 hover:border-white/20'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              {formData.foto_url ? (
                <>
                  <Image src={formData.foto_url} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <ImageIcon className="text-white" size={24} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Foto</span>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-lg z-10"
                    title="Eliminar foto"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none">
                  <div className={`p-3 rounded-full ${isDragging ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5'} transition-colors`}>
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                    Arrastrá una foto o <span className="text-indigo-400">Hacé click</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            
            {/* =========================================
                2. NOMBRE
            ========================================= */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Nombre Completo</label>
              <input 
                required 
                placeholder="EJ: JUAN PEREZ"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none focus:border-indigo-500 transition-colors uppercase placeholder:text-slate-800 text-sm" 
                value={formData.nombre || ''} 
                onChange={e => setFormData({...formData, nombre: e.target.value})} 
              />
            </div>
            
            {/* =========================================
                3. DNI Y TELÉFONO
            ========================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">D.N.I.</label>
                <input 
                  placeholder="SIN PUNTOS"
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none focus:border-indigo-500 uppercase placeholder:text-slate-800 text-sm tabular-nums" 
                  value={formData.dni || ''} 
                  onChange={e => setFormData({...formData, dni: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Teléfono Móvil</label>
                <input 
                  required 
                  type="tel"
                  placeholder="261..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none focus:border-indigo-500 uppercase placeholder:text-slate-800 text-sm tabular-nums" 
                  value={formData.telefono || ''} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                />
              </div>
            </div>

            {/* =========================================
                4. LICENCIA Y VENCIMIENTO
            ========================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Nro. LNH (Licencia)</label>
                <input 
                  required 
                  placeholder="XXX-XXX"
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-black outline-none focus:border-indigo-500 uppercase placeholder:text-slate-800 text-sm" 
                  value={formData.licencia || ''} 
                  onChange={e => setFormData({...formData, licencia: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Vencimiento LNH</label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={18} />
                  <input 
                    required 
                    type="date" 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white font-black outline-none focus:border-indigo-500 [color-scheme:dark] uppercase text-xs" 
                    value={formData.vto_licencia || ''} 
                    onChange={e => setFormData({...formData, vto_licencia: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* =========================================
                5. ESTADO OPERATIVO
            ========================================= */}
            <div className="space-y-1 pt-2">
              <label className="text-[9px] font-black text-indigo-500 uppercase pl-3 tracking-widest">Estado de Disponibilidad</label>
              <div className="relative group">
                <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-600 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={18} />
                <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-black outline-none appearance-none cursor-pointer uppercase focus:border-indigo-500 text-xs" 
                  value={formData.estado || 'Disponible'} 
                  onChange={e => setFormData({...formData, estado: e.target.value})}
                >
                  <option value="Disponible" className="bg-[#020617] text-white">Disponible</option>
                  <option value="Franco" className="bg-[#020617] text-white">Franco / Licencia</option>
                  {/* 🚀 Nueva opción */}
                  <option value="Inactivo" className="bg-[#020617] text-white">Inactivo / Desvinculado</option>
                </select>
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] mt-8 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/30 border border-indigo-400/20 group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <CheckCircle2 size={22} className="group-hover:scale-110 transition-transform" /> 
                  {editingId ? 'Sincronizar Cambios' : 'Registrar Legajo'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}