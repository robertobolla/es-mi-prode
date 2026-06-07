"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Es Mi Prode"
            width={44}
            height={44}
            className="rounded-xl transition-transform group-hover:scale-110"
          />
          <span className="text-xl font-black tracking-wide text-slate-50">
            ES MI <span className="text-gold">PRODE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-gold"
          >
            Funciones
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-gold"
          >
            Cómo Funciona
          </Link>
          <Link
            href="/soporte"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-gold"
          >
            Soporte
          </Link>
          <a
            href="#download"
            className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-gold-contrast shadow-lg shadow-gold/20 transition-all hover:bg-gold-light hover:shadow-gold/30 hover:-translate-y-0.5"
          >
            Descargar App
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menú"
          id="menu-toggle"
        >
          <span
            className={`h-0.5 w-6 bg-slate-400 transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-slate-400 transition-all ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-slate-400 transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-white/5 bg-slate-950/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            <Link
              href="/#features"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-gold"
            >
              Funciones
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-gold"
            >
              Cómo Funciona
            </Link>
            <Link
              href="/soporte"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-gold"
            >
              Soporte
            </Link>
            <a
              href="#download"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-xl bg-gold px-5 py-3 text-center text-sm font-bold text-gold-contrast"
            >
              Descargar App
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
