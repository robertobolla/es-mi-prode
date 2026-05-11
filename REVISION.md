# Reporte de Revisión Técnica y Propuestas de Mejora 🛠️

He realizado un análisis profundo de la estructura actual de **Es Mi Prode** (Backend NestJS, Aplicación Móvil Expo y Dashboard Web). La aplicación cuenta con una base sólida, está muy bien segmentada por módulos y la integración con Supabase es limpia.

Sin embargo, para llevar la aplicación a un nivel de **producción robusto, escalable y seguro** que pueda soportar miles de usuarios concurrentes sin que se caiga o tenga vulnerabilidades graves, te propongo las siguientes mejoras divididas por áreas.

---

## 1. Backend & Base de Datos (NestJS / Prisma)

### 🚨 Seguridad Crítica en WebSockets (`ChatGateway`)
* **Problema:** En `chat.gateway.ts`, el método `sendMessage` y `joinTournamentChat` reciben el `userId` directamente desde el cuerpo del mensaje enviado por el cliente sin validar que ese socket realmente pertenezca a ese usuario. Un usuario malicioso podría abrir una consola de WebSocket e impersonar a cualquier otro miembro enviando mensajes en su nombre.
* **Propuesta:** Implementar un middleware de autenticación en Socket.io que lea el token JWT de Supabase en el handshake inicial, valide el token y guarde el `userId` autenticado en el objeto `client` (ej: `client.data.userId`). Luego, usar ese `userId` interno en vez de confiar en el que viene en el JSON.

### ⚡ Rendimiento de Base de Datos (Consultas Secuenciales)
* **Problema:** En el `ScoringService` y otros servicios, hay bucles `for...of` que ejecutan consultas individuales a la base de datos (por ejemplo, actualizando cada predicción una por una). Si una fecha oficial finaliza y hay 500 usuarios en 10 torneos distintos, el backend podría hacer miles de llamadas bloqueantes de red a la base de datos de manera consecutiva, provocando retrasos y posibles timeouts de API.
* **Propuesta:** 
  1. Usar operaciones masivas de Prisma como `updateMany` o transacciones `$transaction` para agrupar las consultas en un solo viaje a la base de datos.
  2. Implementar procesamiento asíncrono o en lotes para operaciones pesadas de scoring.

### 🛡️ Validación de Datos de Entrada (Inputs)
* **Problema:** Los controladores del backend reciben los objetos (`DTO`) directamente y en muchos casos se realiza un casteo como `any` (ej: `createCompetitionDto as any`). No se están utilizando los validadores automáticos de NestJS (`class-validator` y `class-transformer`). Esto puede provocar que si un cliente envía un tipo de dato erróneo (un texto en lugar de un entero), la API responda con un error interno `500` (error de base de datos) en vez de un prolijo `400 Bad Request`.
* **Propuesta:** Habilitar de manera global el `ValidationPipe` en `main.ts` y decorar los DTOs con decoradores como `@IsString()`, `@IsInt()`, `@IsOptional()`.

### 📦 Instanciación de Supabase Client en Controladores
* **Problema:** En `custom-tournament.controller.ts:72`, cada vez que un usuario sube un logo de equipo se instancia de cero un cliente de Supabase (`createClient(...)`). Esto es ineficiente y puede causar fugas de memoria por la acumulación de conexiones HTTP abiertas.
* **Propuesta:** Crear un servicio `SupabaseService` que actúe como un Provider Singleton inyectable dentro del `PrismaModule` o un módulo común, para reutilizar la misma instancia.

---

## 2. Aplicación Móvil (React Native / Expo)

### 🚀 Optimización del Estado de Red (TanStack Query / React Query)
* **Problema:** Actualmente la app móvil utiliza `useEffect` tradicionales con la utilidad `api.get` para traer información de torneos, rankings, partidos, etc. Esto tiene varias contras de experiencia de usuario:
  - Cada vez que navegás de una pestaña a otra, la app queda en blanco con un spinner de carga porque re-ejecuta la llamada de red.
  - No hay caché local automática (si se cae internet, la pantalla muestra error o se queda vacía en vez de mostrar los datos cargados hace 1 minuto).
* **Propuesta:** Integrar **@tanstack/react-query** (React Query). Esto permite:
  - Cachear los datos localmente al instante (el usuario entra y ve todo cargado de inmediato mientras la app actualiza en segundo plano).
  - Manejar los estados de `loading`, `error` y `refetching` de manera nativa sin declarar múltiples `useState` por pantalla.
  - Re-validaciones automáticas al recuperar conexión.

### 🔀 Notificaciones Push en Lote (Batching)
* **Problema:** En `notifications.service.ts` se envían notificaciones individuales. Expo recomienda agrupar los tokens de notificación en lotes (chunks) de máximo 100 destinatarios por petición para optimizar la velocidad y respetar los límites de tasa (rate limits) de sus servidores.
* **Propuesta:** Utilizar la función `expo.chunkPushNotifications()` incorporada en la librería para dividir los envíos masivos (como cuando hay un ganador de fecha y se notifica a todo un grupo de golpe).

### 🎨 Consistencia Visual y Estilos Duplicados
* **Problema:** Hay mucho código de estilo CSS inline o repetido en las vistas de `mobile/app`. Esto dificulta hacer un cambio global (por ejemplo, si querés cambiar el color de acento amarillo de la app por un dorado más claro, tenés que buscarlo en 20 pantallas distintas).
* **Propuesta:** Centralizar los tokens de diseño (colores, tipografías, bordes y espaciados comunes) en un archivo `mobile/constants/Theme.ts` e importarlo en cada componente.

---

## 3. Dashboard Web de Administrador (Next.js)

### 🔌 Variables de Entorno y Configuración de API
* **Problema:** En `competitions/page.tsx:6`, el `API_URL` está hardcodeado como `http://localhost:3001`. En el momento en que subas el panel a producción, la app web intentará conectarse a la computadora local del usuario final en lugar de a tu servidor desplegado.
* **Propuesta:** Mover `API_URL` a un archivo `.env` o `.env.local` y acceder mediante `process.env.NEXT_PUBLIC_API_URL` para que se adapte automáticamente al entorno (Desarrollo vs Producción).

---

## 📅 Resumen de Prioridades Sugeridas

| Prioridad | Tarea | Impacto | Dificultad |
| :--- | :--- | :--- | :--- |
| **Alta** 🚨 | Autenticación y Firma en WebSockets (`ChatGateway`) | Seguridad de Datos (Impedir impersonación en chats) | Media |
| **Alta** 🚨 | Variables de entorno en Dashboard Web | Portabilidad (Evita que se rompa al subir a producción) | Baja |
| **Media** ⚡ | Integrar TanStack Query en la App Móvil | UX Fluida (Elimina spinners molestos, añade caché) | Alta |
| **Media** 🛡️ | Validación con Class-Validator en Backend | Robustez de API (Evita respuestas de error 500) | Media |
| **Baja** 📦 | Optimizar queries en Prisma (Batching) | Escalabilidad (Mejor respuesta ante muchos usuarios) | Media |

---
*Este análisis es puramente informativo para que conozcas el estado de tu código. Contame por el chat qué opinás o cuál de estos puntos te gustaría que abordemos primero cuando me des autorización.*
