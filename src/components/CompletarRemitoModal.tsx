'use client'
import { useState, useEffect, useRef } from 'react'
import { X, FileEdit, Loader2, CheckCircle2, AlertTriangle, Camera, FileText, UploadCloud, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

// 🚀 AHORA RECIBE "initialRemito"
export function CompletarRemitoModal({ isOpen, initialRemito, onClose, onSubmit, isSaving }: any) {
  const [numero, setNumero] = useState('')
  const [fileData, setFileData] = useState<{ base64: string, type: string, name?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // 🚀 SI TIENE REMITO PREVIO, LO CARGA. SINO, EN BLANCO.
      setNumero(initialRemito && initialRemito !== 'PENDIENTE' ? initialRemito : '')
      setFileData(null)
    }
  }, [isOpen, initialRemito])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].type === 'application/pdf') {
          const file = items[i].getAsFile();
          if (file) processFile(file);
          break; 
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setFileData({
        base64: reader.result as string,
        type: file.type,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      processFile(file);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!numero.trim()) return
    onSubmit(numero, fileData?.base64 || null) 
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 font-sans italic overflow-y-auto">
      
      <div className="bg-[#020617] border border-orange-500/30 w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden my-auto">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-amber-500" />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
              <AlertTriangle size={12} /> {initialRemito ? 'Editando Datos' : 'Faltan Datos'}
            </p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              {initialRemito ? 'Editar' : 'Cargar'} <br/> <span className="text-orange-500">Remito</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
              Número Físico
            </label>
            <div className="relative group">
              <FileEdit className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500/50 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input 
                required
                autoFocus
                type="text"
                placeholder="EJ: 0001-00001234"
                className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-white text-lg font-black outline-none focus:border-orange-500 transition-all uppercase placeholder:text-slate-700"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex justify-between items-center">
              <span>Archivo Adjunto {initialRemito && '(Opcional)'}</span>
              <span className="text-[8px] text-slate-500 opacity-60">Foto o PDF (Ctrl+V)</span>
            </label>
            
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              capture="environment"
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />

            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {fileData ? (
                <div className="relative w-full h-40 rounded-[1.5rem] overflow-hidden border border-white/10 group bg-slate-900/50 flex flex-col items-center justify-center">
                  {fileData.type.startsWith('image/') ? (
                    <Image src={fileData.base64} alt="Remito" fill className="object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-sky-500 p-4 text-center">
                      <FileText size={40} strokeWidth={1.5} />
                      <p className="text-[10px] font-black uppercase tracking-widest truncate max-w-full">
                        {fileData.name || 'Documento PDF'}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-white/20 transition-all">
                       <Camera size={16} /> Cambiar Archivo
                     </button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-[1.5rem] border-2 border-dashed border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-3 bg-orange-500/10 rounded-full text-orange-500 group-hover:scale-110 transition-transform flex items-center gap-2">
                    <Camera size={20} /> <span className="text-orange-500/50 text-[12px]">+</span> <UploadCloud size={20} />
                  </div>
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center">
                    Escanear / Arrastrar / Pegar
                  </span>
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving || !numero.trim()}
            className="w-full py-5 mt-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,88,12,0.3)] disabled:shadow-none"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle2 size={20} /> {initialRemito ? 'Guardar Cambios' : 'Guardar Datos'}</>}
          </button>
        </form>

      </div>
    </div>
  )
}