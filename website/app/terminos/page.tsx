import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones - Es Mi Prode",
  description:
    "Términos y Condiciones de uso de la aplicación Es Mi Prode. Leé las reglas y condiciones para usar nuestro servicio.",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <div className="mb-12">
        <span className="mb-4 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
          Legal
        </span>
        <h1 className="text-4xl font-black md:text-5xl">
          Términos y <span className="text-gold">Condiciones</span>
        </h1>
        <p className="mt-4 text-sm text-slate-500">
          Última actualización: 5 de junio de 2026
        </p>
      </div>

      <div className="legal-content">
        <p>
          Bienvenido/a a <strong>Es Mi Prode</strong>. Al descargar, instalar o
          utilizar nuestra aplicación móvil, aceptás estos Términos y
          Condiciones en su totalidad. Si no estás de acuerdo, por favor no
          utilices la aplicación.
        </p>

        <h2>1. Definiciones</h2>
        <ul>
          <li>
            <strong>&ldquo;Aplicación&rdquo;</strong> o <strong>&ldquo;Es Mi Prode&rdquo;</strong>: la
            aplicación móvil de pronósticos deportivos desarrollada y operada
            por nosotros.
          </li>
          <li>
            <strong>&ldquo;Usuario&rdquo;</strong>: toda persona que se registre y utilice
            la Aplicación.
          </li>
          <li>
            <strong>&ldquo;Torneo&rdquo;</strong>: competición de pronósticos creada dentro
            de la Aplicación, ya sea oficial o personalizada.
          </li>
          <li>
            <strong>&ldquo;Predicción&rdquo;</strong> o <strong>&ldquo;Pronóstico&rdquo;</strong>:
            la estimación del resultado de un partido de fútbol realizada por
            un Usuario.
          </li>
        </ul>

        <h2>2. Descripción del Servicio</h2>
        <p>
          Es Mi Prode es una plataforma de entretenimiento que permite a los
          usuarios crear y participar en torneos de pronósticos deportivos.
          Los usuarios pueden predecir resultados de partidos de fútbol y
          competir por puntos con otros participantes.
        </p>
        <p>
          <strong>Es Mi Prode NO es una plataforma de apuestas.</strong> No se
          involucra dinero real en ningún aspecto de la aplicación. Los puntos
          y rankings son exclusivamente con fines de entretenimiento y
          competencia amistosa.
        </p>

        <h2>3. Registro y Cuenta</h2>
        <ul>
          <li>
            Para usar la Aplicación debés registrarte proporcionando
            información veraz y actualizada.
          </li>
          <li>
            Podés registrarte mediante correo electrónico y contraseña o
            utilizando tu cuenta de Google.
          </li>
          <li>
            Sos responsable de mantener la confidencialidad de tus
            credenciales de acceso.
          </li>
          <li>
            Debés tener al menos <strong>13 años</strong> para crear una
            cuenta.
          </li>
          <li>
            Nos reservamos el derecho de suspender o eliminar cuentas que
            violen estos términos.
          </li>
        </ul>

        <h2>4. Uso Aceptable</h2>
        <p>Al usar Es Mi Prode, te comprometés a:</p>
        <ul>
          <li>No utilizar la aplicación para actividades ilegales.</li>
          <li>
            No crear cuentas falsas ni suplantar la identidad de otra persona.
          </li>
          <li>
            No intentar manipular los resultados, rankings o sistemas de
            puntos.
          </li>
          <li>
            No utilizar bots, scripts automatizados o herramientas para
            interactuar con la aplicación de forma no autorizada.
          </li>
          <li>
            No publicar contenido ofensivo, discriminatorio o inapropiado en
            nombres de torneos o nombres de usuario.
          </li>
          <li>
            Respetar a los demás usuarios y mantener un ambiente deportivo y
            amigable.
          </li>
        </ul>

        <h2>5. Torneos y Predicciones</h2>
        <ul>
          <li>
            Los usuarios pueden crear torneos personalizados o unirse a
            torneos existentes.
          </li>
          <li>
            La creación de un torneo propio tiene un costo único de USD $8.
            Una vez creado, no existen costos adicionales por cantidad de
            participantes invitados.
          </li>
          <li>
            El creador de un torneo puede definir reglas personalizadas,
            incluyendo sistema de puntos, formato (Copa o Liga) y
            restricciones de acceso.
          </li>
          <li>
            Las predicciones deben realizarse antes del inicio de cada partido.
            Una vez comenzado el partido, no se podrán modificar los
            pronósticos.
          </li>
          <li>
            Los puntos se calculan automáticamente según las reglas definidas
            en cada torneo.
          </li>
          <li>
            Los resultados oficiales de los partidos son ingresados por los
            administradores de la plataforma y son definitivos.
          </li>
        </ul>

        <h2>6. Propiedad Intelectual</h2>
        <p>
          Todo el contenido de la Aplicación, incluyendo pero no limitado a:
          diseño, logos, código fuente, textos e imágenes, es propiedad
          exclusiva de Es Mi Prode y está protegido por las leyes de
          propiedad intelectual aplicables.
        </p>
        <p>
          No está permitido copiar, modificar, distribuir ni crear obras
          derivadas de ningún elemento de la Aplicación sin autorización
          previa por escrito.
        </p>

        <h2>7. Contenido del Usuario</h2>
        <p>
          Los usuarios son responsables del contenido que generan (nombres de
          torneos, nombres de usuario, fotos de perfil). Nos reservamos el
          derecho de eliminar contenido que consideremos inapropiado sin
          previo aviso.
        </p>

        <h2>8. Disponibilidad del Servicio</h2>
        <ul>
          <li>
            Nos esforzamos por mantener la Aplicación disponible las 24 horas
            del día, los 7 días de la semana.
          </li>
          <li>
            No garantizamos que el servicio sea ininterrumpido o libre de
            errores.
          </li>
          <li>
            Podemos realizar mantenimientos programados o de emergencia que
            afecten temporalmente la disponibilidad.
          </li>
          <li>
            Nos reservamos el derecho de modificar, suspender o discontinuar
            cualquier funcionalidad de la Aplicación en cualquier momento.
          </li>
        </ul>

        <h2>9. Limitación de Responsabilidad</h2>
        <p>
          Es Mi Prode se proporciona &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;.
          En la máxima medida permitida por la ley:
        </p>
        <ul>
          <li>
            No nos hacemos responsables de daños directos, indirectos,
            incidentales o consecuentes derivados del uso de la Aplicación.
          </li>
          <li>
            No garantizamos la exactitud o actualidad de los resultados
            deportivos mostrados.
          </li>
          <li>
            No somos responsables de la pérdida de datos o puntuaciones
            debido a fallos técnicos.
          </li>
        </ul>

        <h2>10. Cancelación y Eliminación de Cuenta</h2>
        <p>
          Podés solicitar la eliminación de tu cuenta en cualquier momento a
          través de:
        </p>
        <ul>
          <li>
            Nuestra{" "}
            <a href="/eliminar-cuenta">página de eliminación de cuenta</a>.
          </li>
          <li>
            Enviando un correo a{" "}
            <a href="mailto:soporte@esmiprode.com">soporte@esmiprode.com</a>.
          </li>
        </ul>
        <p>
          Al eliminar tu cuenta, se borrarán todos tus datos personales,
          predicciones e historial en un plazo máximo de 30 días hábiles.
          Esta acción es irreversible.
        </p>

        <h2>11. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos Términos y Condiciones
          en cualquier momento. Los cambios serán notificados a través de la
          Aplicación. El uso continuado de la Aplicación después de la
          publicación de cambios constituye la aceptación de los nuevos
          términos.
        </p>

        <h2>12. Ley Aplicable</h2>
        <p>
          Estos Términos se rigen por las leyes de la República Argentina.
          Cualquier controversia será sometida a los tribunales ordinarios
          competentes de la Ciudad Autónoma de Buenos Aires.
        </p>

        <h2>13. Contacto</h2>
        <p>
          Si tenés preguntas sobre estos Términos y Condiciones, contactanos:
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
