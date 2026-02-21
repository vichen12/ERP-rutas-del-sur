'use client'
import { useState } from 'react'
import { X, Mail, Download, FileText, Loader2, CheckCircle2, ShieldAlert, Share2 } from 'lucide-react'

export function ClienteBackUp({ isOpen, onClose, onSendEmail, onDownloadPDF, isProcessing, clienteNombre }: any) {
  const [step, setStep] = useState<'idle' | 'success'>('idle')

  if (!isOpen) return null

  const handleAction = async (type: 'email' | 'pdf') => {
    if (type === 'email') {
      if (onSendEmail) await onSendEmail()
    } else {
      if (onDownloadPDF) await onDownloadPDF()
    }
    setStep('success')
    // Esperamos un momento para que el usuario vea el check de éxito antes de cerrar
    setTimeout(() => { 
      setStep('idle')
      onClose() 
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#020617] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden italic font-sans">
        
        {/* Efecto de luz ambiental */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-500/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Exportar <span className="text-sky-500">Informe</span>
            </h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Terminal de Despacho de Datos</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'idle' ? (
          <div className="space-y-6 relative z-10">
            {/* Info del Cliente */}
            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Dador de Carga</p>
              <p className="text-xl font-black text-white uppercase tracking-tight leading-none">{clienteNombre}</p>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleAction('pdf')}
                disabled={isProcessing}
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-sky-500/30 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-all shadow-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Generar Resumen PDF</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Estado de cuenta y ADN logístico</p>
                  </div>
                </div>
                <Download size={18} className="text-slate-600 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => handleAction('email')}
                disabled={isProcessing}
                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-emerald-500/30 transition-all group active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Despachar por Email</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Envío directo a administración</p>
                  </div>
                </div>
                <Share2 size={18} className="text-slate-600 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10 text-[9px] font-bold text-sky-400 uppercase leading-relaxed">
              <ShieldAlert size={18} className="shrink-0 text-sky-500" /> 
              <p>El informe sincronizará el saldo pendiente, las tarifas pactadas y el historial completo de viajes finalizados hasta la fecha.</p>
            </div>
          </div>
        ) : (
          /* ESTADO DE ÉXITO */
          <div className="py-12 flex flex-col items-center justify-center space-y-5 animate-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative p-6 bg-emerald-500/20 text-emerald-500 rounded-full border border-emerald-500/30 shadow-2xl">
                <CheckCircle2 size={56} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white uppercase italic tracking-tighter">Proceso Exitoso</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Sincronización de datos completada</p>
            </div>
          </div>
        )}

        {/* LOADING OVERLAY */}
        {isProcessing && (
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center z-[50] animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="text-sky-500 animate-spin" size={48} strokeWidth={3} />
                <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full" />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Compilando Reporte...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}