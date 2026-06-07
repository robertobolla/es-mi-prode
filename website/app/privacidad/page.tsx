import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad - Es Mi Prode",
  description:
    "Política de Privacidad de la aplicación Es Mi Prode. Conocé cómo recopilamos, usamos y protegemos tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <div className="mb-12">
        <span className="mb-4 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
          Legal
        </span>
        <h1 className="text-4xl font-black md:text-5xl">
          Política de <span className="text-gold">Privacidad</span>
        </h1>
        <p className="mt-4 text-sm text-slate-500">
          Última actualización: 5 de junio de 2026
        </p>
      </div>

      <div className="legal-content">
        <p>
          En <strong>Es Mi Prode</strong> (&ldquo;nosotros&rdquo;, &ldquo;la aplicación&rdquo;), nos
          comprometemos a proteger la privacidad de nuestros usuarios. Esta
          Política de Privacidad describe cómo recopilamos, usamos,
          almacenamos y protegemos tu información personal cuando utilizás
          nuestra aplicación móvil.
        </p>

        <h2>1. Información que Recopilamos</h2>

        <h3>1.1 Información proporcionada por el usuario</h3>
        <ul>
          <li>
            <strong>Datos de registro:</strong> nombre completo, nombre de
            usuario, dirección de correo electrónico y foto de perfil (opcional).
          </li>
          <li>
            <strong>Autenticación:</strong> si iniciás sesión con Google, recibimos
            tu nombre, correo electrónico y foto de perfil de tu cuenta de
            Google. No accedemos a tu contraseña de Google.
          </li>
          <li>
            <strong>Contenido generado:</strong> predicciones de resultados de
            partidos, torneos creados y participaciones.
          </li>
        </ul>

        <h3>1.2 Información recopilada automáticamente</h3>
        <ul>
          <li>
            <strong>Token de notificaciones push:</strong> para enviarte
            recordatorios y actualizaciones relevantes del torneo.
          </li>
          <li>
            <strong>Datos de uso:</strong> información sobre cómo interactuás
            con la aplicación (pantallas visitadas, acciones realizadas).
          </li>
          <li>
            <strong>Información del dispositivo:</strong> tipo de dispositivo,
            sistema operativo y versión de la aplicación.
          </li>
        </ul>

        <h2>2. Cómo Usamos tu Información</h2>
        <p>Utilizamos tu información personal para:</p>
        <ul>
          <li>Crear y mantener tu cuenta de usuario.</li>
          <li>
            Permitirte participar en torneos de pronósticos y mostrar tu
            posición en los rankings.
          </li>
          <li>
            Enviarte notificaciones push sobre fechas próximas, resultados y
            actualizaciones de torneos.
          </li>
          <li>Mejorar la experiencia de la aplicación y corregir errores.</li>
          <li>Comunicarnos contigo en relación con el soporte técnico.</li>
        </ul>

        <h2>3. Compartir Información</h2>
        <p>
          <strong>No vendemos ni compartimos</strong> tu información personal con
          terceros con fines comerciales o publicitarios.
        </p>
        <p>Tu información puede ser compartida únicamente en los siguientes casos:</p>
        <ul>
          <li>
            <strong>Otros usuarios de la app:</strong> tu nombre de usuario, foto
            de perfil y puntuaciones son visibles para otros participantes de
            tus torneos (ranking público).
          </li>
          <li>
            <strong>Proveedores de servicios:</strong> utilizamos servicios de
            terceros (como Supabase para autenticación y almacenamiento, y Expo
            para notificaciones push) que procesan datos en nuestro nombre
            bajo estrictas políticas de privacidad.
          </li>
          <li>
            <strong>Requerimiento legal:</strong> si la ley nos obliga a divulgar
            información para cumplir con una orden judicial o proceso legal.
          </li>
        </ul>

        <h2>4. Almacenamiento y Seguridad</h2>
        <p>
          Tus datos se almacenan en servidores seguros proporcionados por
          <strong> Supabase</strong> (infraestructura de AWS). Implementamos
          medidas de seguridad técnicas y organizativas para proteger tu
          información, incluyendo:
        </p>
        <ul>
          <li>Cifrado de datos en tránsito mediante HTTPS/TLS.</li>
          <li>Tokens de autenticación seguros con renovación automática.</li>
          <li>Acceso restringido a los datos del servidor.</li>
        </ul>

        <h2>5. Retención de Datos</h2>
        <p>
          Conservamos tu información personal mientras mantengas una cuenta
          activa en la aplicación. Si solicitás la eliminación de tu cuenta,
          eliminaremos tus datos personales en un plazo máximo de 30 días
          hábiles.
        </p>

        <h2>6. Tus Derechos</h2>
        <p>Como usuario, tenés derecho a:</p>
        <ul>
          <li>
            <strong>Acceder</strong> a tus datos personales desde la sección
            &ldquo;Perfil&rdquo; de la aplicación.
          </li>
          <li>
            <strong>Modificar</strong> tu nombre, nombre de usuario y foto de
            perfil en cualquier momento.
          </li>
          <li>
            <strong>Eliminar tu cuenta</strong> y todos tus datos asociados
            contactándonos a{" "}
            <a href="mailto:soporte@esmiprode.com">soporte@esmiprode.com</a> o
            usando la opción disponible en{" "}
            <a href="/eliminar-cuenta">nuestra página de eliminación de cuenta</a>.
          </li>
          <li>
            <strong>Revocar permisos</strong> de notificaciones push desde la
            configuración de tu dispositivo.
          </li>
        </ul>

        <h2>7. Servicios de Terceros</h2>
        <p>Utilizamos los siguientes servicios de terceros:</p>
        <ul>
          <li>
            <strong>Supabase:</strong> autenticación de usuarios y
            almacenamiento de datos (
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>
            ).
          </li>
          <li>
            <strong>Google OAuth:</strong> inicio de sesión con cuenta de Google
            (
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>
            ).
          </li>
          <li>
            <strong>Expo Push Notifications:</strong> envío de notificaciones
            push (
            <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>
            ).
          </li>
        </ul>

        <h2>8. Menores de Edad</h2>
        <p>
          Es Mi Prode no está dirigida a menores de 13 años. No recopilamos
          intencionalmente información de menores de 13 años. Si descubrimos
          que hemos recopilado datos de un menor, procederemos a eliminar
          dicha información.
        </p>

        <h2>9. Cambios en esta Política</h2>
        <p>
          Nos reservamos el derecho de actualizar esta Política de Privacidad
          en cualquier momento. Te notificaremos sobre cambios significativos
          a través de la aplicación o por correo electrónico. La fecha de
          &ldquo;Última actualización&rdquo; al inicio de este documento refleja la
          versión más reciente.
        </p>

        <h2>10. Contacto</h2>
        <p>
          Si tenés preguntas o inquietudes sobre esta Política de Privacidad,
          podés contactarnos en:
        </p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:soporte@esmiprode.com">soporte@esmiprode.com</a>
          </li>
          <li>
            <strong>Página de soporte:</strong>{" "}
            <a href="/soporte">esmiprode.com/soporte</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
