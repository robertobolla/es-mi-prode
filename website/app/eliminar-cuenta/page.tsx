import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminar Cuenta - Es Mi Prode",
  description:
    "Solicitá la eliminación de tu cuenta de Es Mi Prode y todos tus datos personales asociados.",
};

export default function EliminarCuentaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-block rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-400">
          Cuenta
        </span>
        <h1 className="text-4xl font-black md:text-5xl">
          Eliminar <span className="text-red-400">Cuenta</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
          Si deseás eliminar tu cuenta de Es Mi Prode, seguí los pasos que
          se indican a continuación.
        </p>
      </div>

      {/* Warning */}
      <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 text-2xl">⚠️</span>
          <div>
            <h3 className="mb-2 font-bold text-red-300">
              Esta acción es irreversible
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Al eliminar tu cuenta, se borrarán permanentemente todos tus
              datos, incluyendo: tu perfil, predicciones, historial de torneos,
              puntuaciones y cualquier otro dato asociado a tu cuenta. Esta
              acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>

      {/* What gets deleted */}
      <div className="mb-8 glass-card rounded-2xl p-8">
        <h2 className="mb-6 text-xl font-bold text-slate-50">
          ¿Qué datos se eliminan?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: "👤", text: "Información del perfil (nombre, email, foto)" },
            { icon: "⚽", text: "Todas tus predicciones y pronósticos" },
            { icon: "🏆", text: "Participaciones en torneos" },
            { icon: "📊", text: "Puntuaciones y posiciones en rankings" },
            { icon: "🔔", text: "Configuración de notificaciones push" },
            { icon: "🔑", text: "Credenciales de acceso y sesiones" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/50 p-4"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-slate-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How to delete */}
      <div className="mb-8 glass-card rounded-2xl p-8">
        <h2 className="mb-6 text-xl font-bold text-slate-50">
          ¿Cómo eliminar tu cuenta?
        </h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
              1
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-200">
                Enviá un email de solicitud
              </h3>
              <p className="text-sm text-slate-400">
                Escribinos a{" "}
                <a
                  href="mailto:soporte@esmiprode.com?subject=Solicitud%20de%20eliminación%20de%20cuenta&body=Hola,%20quiero%20eliminar%20mi%20cuenta%20de%20Es%20Mi%20Prode.%0A%0AMi%20email%20de%20registro:%20[TU_EMAIL_AQUÍ]%0A%0AGracias."
                  className="font-medium text-gold underline underline-offset-2 transition-colors hover:text-gold-light"
                >
                  soporte@esmiprode.com
                </a>{" "}
                con el asunto &ldquo;Solicitud de eliminación de cuenta&rdquo;.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
              2
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-200">
                Incluí tu email de registro
              </h3>
              <p className="text-sm text-slate-400">
                Para verificar tu identidad, indicá el correo electrónico con
                el que te registraste en la aplicación.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
              3
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-200">
                Esperá la confirmación
              </h3>
              <p className="text-sm text-slate-400">
                Procesaremos tu solicitud y eliminaremos todos tus datos en un
                plazo máximo de <strong className="text-slate-200">30 días hábiles</strong>. Recibirás un email de
                confirmación cuando el proceso se haya completado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="mailto:soporte@esmiprode.com?subject=Solicitud%20de%20eliminación%20de%20cuenta&body=Hola,%20quiero%20eliminar%20mi%20cuenta%20de%20Es%20Mi%20Prode.%0A%0AMi%20email%20de%20registro:%20[TU_EMAIL_AQUÍ]%0A%0AGracias."
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-8 py-4 font-bold text-red-400 transition-all hover:bg-red-500/20 hover:-translate-y-0.5"
          id="delete-account-btn"
        >
          📧 Solicitar Eliminación de Cuenta
        </a>
        <p className="mt-4 text-xs text-slate-600">
          También podés contactarnos en{" "}
          <a
            href="/soporte"
            className="text-slate-400 underline underline-offset-2 hover:text-gold"
          >
            nuestra página de soporte
          </a>
          .
        </p>
      </div>
    </div>
  );
}
