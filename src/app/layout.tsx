import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DallapeSystems | ERP",
  description: "Panel de Control Operativo y Logístico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Evita flash al cargar: aplica el tema antes de que React hidrate */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('erp-theme') || 'dark';
              if (t === 'light') document.documentElement.classList.add('light');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#141c28] text-slate-200 antialiased selection:bg-sky-500/30`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Navbar />

          <main className="min-h-screen transition-all duration-300 relative z-10">
            {children}
          </main>

          {/* Fondo decorativo */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] rounded-full opacity-50" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full opacity-50" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}