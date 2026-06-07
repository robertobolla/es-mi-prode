import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte - Es Mi Prode",
  description:
    "Centro de ayuda y soporte técnico de Es Mi Prode. Contactanos si tenés algún problema o consulta.",
};

export default function SoportePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-32">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
          Ayuda
        </span>
        <h1 className="text-4xl font-black md:text-5xl">
          Centro de <span className="text-gold">Soporte</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
          ¿Tenés alguna duda o problema? Estamos acá para ayudarte.
        </p>
      </div>

      {/* Contact Card */}
      <div className="mb-12 glass-card rounded-2xl p-8 text-center">
        <div className="mb-4 text-5xl">📧</div>
        <h2 className="mb-2 text-2xl font-bold text-slate-50">
          Contactanos por Email
        </h2>
        <p className="mb-6 text-slate-400">
          Respondemos dentro de las 24-48 horas hábiles.
        </p>
        <a
          href="mailto:soporte@esmiprode.com"
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-4 font-bold text-gold-contrast shadow-lg shadow-gold/20 transition-all hover:bg-gold-light hover:-translate-y-0.5"
          id="support-email-btn"
        >
          soporte@esmiprode.com
        </a>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
          Preguntas Frecuentes
        </h2>

        <div className="space-y-4">
          {[
            {
              question: "¿Cuánto cuesta Es Mi Prode?",
              answer:
                "La app es gratuita para descargar. Crear un torneo tiene un costo de USD $8. Una vez creado, podés invitar a todos los participantes que quieras sin costos adicionales.",
            },
            {
              question: "¿Cómo creo un torneo?",
              answer:
                'Desde la pestaña "Torneos" en la app, tocá el botón "+ NUEVO". Elegí una competición oficial o creá un torneo personalizado. Definí las reglas y compartí el código con tus amigos.',
            },
            {
              question: "¿Cómo me uno a un torneo existente?",
              answer:
                "Podés buscar torneos públicos desde la pantalla de inicio o usar un código de invitación que te haya compartido el creador del torneo.",
            },
            {
              question: "¿Hasta cuándo puedo hacer mis predicciones?",
              answer:
                "Las predicciones se cierran cuando empieza el primer partido de la fecha. Asegurate de completar tus pronósticos antes del inicio.",
            },
            {
              question: "¿Cómo funciona el sistema de puntos?",
              answer:
                "Cada torneo puede tener su propio sistema de puntos. Por defecto: resultado exacto (5 pts), resultado correcto sin goles exactos (3 pts). El creador del torneo puede personalizar estos valores.",
            },
            {
              question: "¿Puedo eliminar mi cuenta?",
              answer:
                'Sí, podés solicitar la eliminación de tu cuenta en cualquier momento desde nuestra página de eliminación de cuenta o enviándonos un email a soporte@esmiprode.com. Todos tus datos serán eliminados en un plazo de 30 días hábiles.',
            },
            {
              question: "¿Es Mi Prode es una casa de apuestas?",
              answer:
                "No. Es Mi Prode es una plataforma de entretenimiento. No se involucra dinero real en ningún aspecto. Los puntos y rankings son exclusivamente para diversión y competencia amistosa entre amigos.",
            },
            {
              question: "¿Cómo recibo notificaciones?",
              answer:
                'La app te enviará recordatorios antes de cada fecha para que no te olvides de hacer tus pronósticos. Podés activar o desactivar las notificaciones desde la configuración de tu dispositivo.',
            },
          ].map((faq, index) => (
            <details
              key={index}
              className="group glass-card rounded-xl overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-semibold text-slate-50 transition-colors hover:text-gold">
                <span>{faq.question}</span>
                <span className="ml-4 text-gold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-white/5 px-6 pb-6 pt-4">
                <p className="text-sm leading-relaxed text-slate-400">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Additional Help */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-8 text-center">
        <h3 className="mb-2 text-lg font-bold text-slate-50">
          ¿No encontraste lo que buscabas?
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Escribinos y te respondemos lo antes posible.
        </p>
        <a
          href="mailto:soporte@esmiprode.com"
          className="text-sm font-semibold text-gold transition-colors hover:text-gold-light"
        >
          soporte@esmiprode.com →
        </a>
      </div>
    </div>
  );
}
