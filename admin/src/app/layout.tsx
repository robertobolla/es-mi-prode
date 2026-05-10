import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin | Es Mi Prode',
  description: 'Panel de Administración',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex min-h-screen`}>
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col gap-4">
          <div className="text-2xl font-bold mb-8 tracking-tight">Es Mi Prode<span className="text-blue-500">.Admin</span></div>
          <nav className="flex flex-col gap-2">
            <Link href="/" className="hover:bg-slate-800 p-3 rounded-lg font-medium transition-colors">Inicio</Link>
            <Link href="/competitions" className="hover:bg-slate-800 p-3 rounded-lg font-medium transition-colors">Competencias</Link>
            <Link href="/matches" className="hover:bg-slate-800 p-3 rounded-lg font-medium transition-colors">Partidos y Resultados</Link>
            <Link href="/audit" className="hover:bg-slate-800 p-3 rounded-lg font-medium transition-colors">Registro de Auditoría</Link>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
