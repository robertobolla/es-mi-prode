import Image from "next/image";

export default function HomePage() {
  return (
    <>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gold/5 blur-[120px] animate-glow-pulse" />
          <div className="absolute -bottom-60 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px] animate-glow-pulse animation-delay-200" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-indigo-900/10 blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-center">


          {/* Logo */}
          <div className="animate-fade-in-up animation-delay-200 mb-8 flex justify-center">
            <Image
              src="/logo.png"
              alt="Es Mi Prode"
              width={240}
              height={240}
              className="drop-shadow-2xl animate-float"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up animation-delay-400 mb-6 text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Competí, Predecí
            <br />
            y <span className="text-shimmer">Convertite en Leyenda</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animation-delay-600 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Creá torneos de pronósticos con tus amigos. Predecí resultados de fútbol,
            sumá puntos y demostrá quién es el que más sabe.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animation-delay-800 flex flex-col items-center justify-center gap-4 sm:flex-row" id="download">
            <a
              href="#"
              className="group flex items-center gap-3 rounded-2xl bg-slate-50 px-8 py-4 text-slate-950 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
              id="cta-appstore"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">Disponible en</div>
                <div className="text-lg font-bold leading-tight">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="group flex items-center gap-3 rounded-2xl bg-slate-50 px-8 py-4 text-slate-950 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
              id="cta-googleplay"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199 2.302 2.302-2.302 2.302L15.397 12l2.301-2.492zM5.864 2.658 16.8 8.991l-2.302 2.302L5.864 2.658z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">Disponible en</div>
                <div className="text-lg font-bold leading-tight">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}

      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
              Funciones
            </span>
            <h2 className="mb-4 text-4xl font-black md:text-5xl">
              Todo lo que necesitás para{" "}
              <span className="text-gold">ganar</span>
            </h2>
            <p className="mx-auto max-w-xl text-lg text-slate-400">
              Herramientas pensadas para que la experiencia de predecir sea
              divertida, competitiva y social.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🏆",
                title: "Torneos Personalizados",
                description:
                  "Creá torneos de Copa o Liga con reglas a medida. Definí el sistema de puntos, cantidad de participantes y más.",
              },
              {
                icon: "⚽",
                title: "Predicciones en Vivo",
                description:
                  "Predecí resultados exactos de cada partido. Cuanto más preciso seas, más puntos sumás.",
              },
              {
                icon: "📊",
                title: "Rankings en Tiempo Real",
                description:
                  "Tabla de posiciones actualizada al instante. Sabé siempre quién lidera y cuántos puntos te faltan.",
              },
              {
                icon: "🔗",
                title: "Invitá con un Código",
                description:
                  "Compartí un código o enlace para que tus amigos se unan al torneo en segundos.",
              },
              {
                icon: "🔔",
                title: "Notificaciones Push",
                description:
                  "Recordatorios antes de cada fecha para que nunca te olvides de hacer tus pronósticos.",
              },
              {
                icon: "🎯",
                title: "Predicciones Extras",
                description:
                  "Predecí MVP, Goleador, Mejor Arquero y clasificados de grupo para sumar puntos bonus.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card glass-card-hover rounded-2xl p-8"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-50">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section id="how-it-works" className="relative py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-3xl rounded-full bg-gold/3 blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
              Cómo Funciona
            </span>
            <h2 className="mb-4 text-4xl font-black md:text-5xl">
              Empezá en <span className="text-gold">3 pasos</span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Descargá la App",
                description:
                  "Disponible en iOS y Android. Registrate con Google o tu correo en segundos.",
                icon: "📲",
              },
              {
                step: "02",
                title: "Creá o Unite a un Torneo",
                description:
                  "Elegí una competición oficial o creá un torneo personalizado e invitá a tus amigos.",
                icon: "🏟️",
              },
              {
                step: "03",
                title: "Predecí y Ganá",
                description:
                  "Hacé tus pronósticos antes de cada fecha. Resultado exacto = más puntos. ¡Demostrá quién manda!",
                icon: "🥇",
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
                  <span className="text-4xl">{item.icon}</span>
                </div>
                {/* Connector Line (desktop) */}
                {index < 2 && (
                  <div className="absolute top-10 left-[60%] hidden h-0.5 w-[80%] bg-gradient-to-r from-gold/30 to-transparent md:block" />
                )}
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">
                  Paso {item.step}
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-50">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS ═══════════════════════ */}
      <section className="border-y border-white/5 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "100%", label: "Pasión" },
              { value: "∞", label: "Torneos Ilimitados" },
              { value: "24/7", label: "Rankings en Vivo" },
              { value: "⚡", label: "Notificaciones Push" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-4xl font-black text-gold md:text-5xl">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA FINAL ═══════════════════════ */}
      <section className="relative py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-gold/8 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-6 text-4xl font-black md:text-5xl">
            ¿Listo para demostrar{" "}
            <span className="text-gold">quién manda</span>?
          </h2>
          <p className="mb-10 text-lg text-slate-400">
            Descargá Es Mi Prode y empezá a competir con tus amigos hoy
            mismo.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="flex items-center gap-3 rounded-2xl bg-gold px-8 py-4 font-bold text-gold-contrast shadow-lg shadow-gold/20 transition-all hover:bg-gold-light hover:shadow-gold/40 hover:-translate-y-1"
              id="cta-final-appstore"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-slate-50 transition-all hover:bg-white/10 hover:-translate-y-1"
              id="cta-final-googleplay"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814 13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199 2.302 2.302-2.302 2.302L15.397 12l2.301-2.492zM5.864 2.658 16.8 8.991l-2.302 2.302L5.864 2.658z" />
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
