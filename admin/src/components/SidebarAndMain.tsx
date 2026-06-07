'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function SidebarAndMain({ children }: { children: React.ReactNode }) {
  const { logout, profile } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col justify-between shadow-xl">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="text-2xl font-black tracking-tight">
            Es Mi Prode<span className="text-yellow-500">.Admin</span>
          </div>

          {/* User Profile Info */}
          {profile && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500 font-bold text-lg">
                {(profile.username || 'A').substring(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-100">{profile.username || 'Administrador'}</p>
                <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/"
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${
                isActive('/')
                  ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/10'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Inicio</span>
            </Link>

            <Link
              href="/competitions"
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${
                isActive('/competitions')
                  ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/10'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span className="text-lg">🏆</span>
              <span>Competencias</span>
            </Link>

            <Link
              href="/matches"
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${
                isActive('/matches')
                  ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/10'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span className="text-lg">⚽</span>
              <span>Partidos</span>
            </Link>
          </nav>
        </div>

        {/* Footer/Logout */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-500/10 hover:bg-red-500/15 text-red-400 hover:text-red-300 border border-red-500/25 hover:border-red-500/40 rounded-2xl font-bold text-sm transition-all"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
