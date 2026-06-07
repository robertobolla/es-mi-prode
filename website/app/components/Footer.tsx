import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Es Mi Prode"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="text-lg font-black text-slate-50">
                ES MI <span className="text-gold">PRODE</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              La app de pronósticos deportivos para competir con tus amigos.
              Predecí, competí y convertite en leyenda.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Producto
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Funciones
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Cómo Funciona
                </Link>
              </li>
              <li>
                <a
                  href="#download"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Descargar
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacidad"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/eliminar-cuenta"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Eliminar Cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Ayuda
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/soporte"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  Soporte
                </Link>
              </li>
              <li>
                <a
                  href="mailto:soporte@esmiprode.com"
                  className="text-sm text-slate-500 transition-colors hover:text-gold"
                >
                  soporte@esmiprode.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-slate-600">
            © {currentYear} Es Mi Prode. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-600">
            Hecho con ⚽ para los fanáticos del fútbol
          </p>
        </div>
      </div>
    </footer>
  );
}
