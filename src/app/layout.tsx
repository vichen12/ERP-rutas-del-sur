import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rutas del Sur | ERP",
  description: "Panel de Control Operativo y Logístico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} bg-[#020617] text-slate-200 antialiased selection:bg-sky-500/30`}
        suppressHydrationWarning
      >
        <Navbar />
        
        <main className="min-h-screen transition-all duration-500 relative z-10">
          {children}
        </main>

        {/* Fondo Táctico (Efecto Nebulosa) */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] rounded-full opacity-50" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full opacity-50" />
          
        </div>
      </body>
    </html>
  )
}