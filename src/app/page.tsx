import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col relative overflow-hidden">

      {/* FOTO DE FONDO */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=85')" }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a] via-[#0a0f1a]/85 to-[#0a0f1a]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-[#0a0f1a]/40" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/4 w-[700px] h-[500px] bg-sky-500/10 blur-[160px] rounded-full pointer-events-none" />

      {/* CONTENIDO */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navbar — solo logo texto */}
        <nav className="flex items-center justify-between px-8 md:px-16 pt-10">
          <span className="text-2xl font-black italic tracking-tighter text-white uppercase select-none">
            Flet<span className="text-sky-400">X</span>
          </span>
        </nav>

        {/* HERO */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 pb-32 pt-10 max-w-5xl">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.35em] w-fit mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Sistema de Gestión Logística
          </div>

          <h1 className="text-[clamp(5rem,15vw,13rem)] font-black italic tracking-[-0.04em] text-white uppercase leading-[0.82] mb-8">
            Flet<span className="text-sky-400">X</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg font-medium max-w-lg leading-relaxed mb-12">
            Controlá tu flota, choferes, caja, banco y facturación AFIP desde un solo lugar.
          </p>

          <Link
            href="/login"
            className="group inline-flex items-center gap-4 px-10 py-5 bg-sky-500 hover:bg-sky-400 text-white font-black uppercase text-sm tracking-[0.25em] rounded-2xl transition-all hover:scale-[1.03] active:scale-95 shadow-[0_8px_60px_rgba(14,165,233,0.35)] hover:shadow-[0_8px_80px_rgba(14,165,233,0.55)] w-fit"
          >
            Ingresar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          {/* Features */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-20 border-t border-white/5 pt-8">
            {['Viajes & Remitos', 'Facturación ARCA', 'Caja & Banco', 'Flota & Choferes', 'Stock', 'Costos & Multas'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-sky-500/60" />
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">
          FletX · Argentina · 2026
        </p>
      </div>
    </div>
  )
}
