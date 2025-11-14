# Instrucciones para agentes AI (Copilot)

Resumen rápido
- Este repositorio contiene una app Next.js (App Router, TypeScript) bajo `app/` y un micro-servicio Java Spring Boot en `src/main/java` con su `pom.xml` en la raíz.
- El frontend Next usa acceso directo a Postgres desde el servidor (`postgres`), con consultas SQL en `app/lib/*.ts`. La variable de entorno crítica es `POSTGRES_URL`.

Puntos clave que deberías conocer
- Estructura relevante:
  - `app/` — Next.js App Router (layouts, rutas y componentes). Ver `app/layout.tsx` y `app/dashboard/layout.tsx`.
  - `app/lib/` — funciones de datos y acciones del servidor (ej.: `actions.ts`, `data.ts`, `definitions.ts`, `utils.ts`).
  - `app/ui/` — componentes reutilizables (ej.: `ui/dashboard/sidenav.tsx`, `ui/dashboard/nav-links.tsx`).
  - `src/main/java` y `pom.xml` — aplicación Spring Boot (separa responsabilidades; no asumas que Next.js llama a Spring Boot).

- Flujos de datos y decisiones de diseño:
  - Next.js ejecuta lógica de servidor y consulta Postgres directamente (ver `app/lib/data.ts` y `app/lib/actions.ts`).
  - Muchas consultas usan SQL crudo via `postgres` y esperan tablas: `invoices`, `customers`, `revenue`, `grades`.
  - Las cantidades (`amount`) se almacenan en centavos en la DB y se formatean/dividen en `data.ts`/`utils.ts` (cuidado con la conversión).
  - Las acciones de formulario usan patrones de Server Actions y `useActionState` (ej.: `createInvoice`, `updateInvoiceWithState`).

Convenciones y patrones del proyecto (ejemplos concretos)
- Tipos: `app/lib/definitions.ts` define los tipos principales (Invoice, Customer, Revenue). Usa estos tipos cuando generes o transformes datos.
- Paginación: `ITEMS_PER_PAGE = 6` en `app/lib/data.ts`; las consultas usan OFFSET calculado con la página.
- Revalidación: después de mutaciones se llama a `revalidatePath('/dashboard/invoices')` y/o `redirect(...)` en `actions.ts`.
- Datos de ejemplo: hay un conjunto de datos de placeholder en `app/lib/placeholder-data.ts` utilizado en capítulos de demostración — no lo sobreescribas sin confirmar.

Build, dev y variables de entorno
- Frontend (Next.js):
  - Instalar: usar pnpm (hay `pnpm-lock.yaml`) o npm/yarn si prefieres.
    - pnpm: `pnpm install`
  - Desarrollo: `pnpm dev` (alias `npm run dev`), que ejecuta `next dev --turbopack` según `package.json`.
  - Producción: `pnpm build` -> `pnpm start`.
  - Config: `next.config.ts` activa experimental `cacheComponents`.
- Backend (Java):
  - Usar Maven wrapper: `./mvnw.cmd spring-boot:run` en Windows o `./mvnw spring-boot:run` en Unix. El `pom.xml` muestra dependencias Spring Boot.
- Variables críticas:
  - POSTGRES_URL — URL de conexión para `postgres` (usada por Next.js en `app/lib/*`).

Precauciones específicas
- No asumas una API REST entre Next y Spring: Next.js está configurado para acceso directo a la DB en este repo. Ver `app/lib/*.ts` para confirmarlo.
- Queries SQL están en código: evita cambios de columna/tabla sin ajustar todas las consultas (buscar `FROM invoices`, `JOIN customers`, `SELECT * FROM revenue`).
- Hay una demora intencional en `fetchRevenue()` (3s) para propósitos didácticos — nótalo si optimizas rendimiento.

Cómo ayudar efectivamente (qué editar o sugerir)
- Para nuevas features, crea/editar: 1) tipos en `app/lib/definitions.ts`, 2) funciones de fetch/mutate en `app/lib/data.ts` o `actions.ts`, 3) componentes en `app/ui/*` y layouts en `app/*/layout.tsx`.
- Cuando sugieras cambios en SQL, incluye la ruta exacta y la consulta modificada (ej.: `app/lib/data.ts: fetchFilteredInvoices`), y añade pruebas manuales de ejemplo (consulta/resultado esperado).
- Si propones migrar a un ORM, documenta claramente: tablas afectadas (invoices, customers, revenue), y un plan de migración incremental.

Referencias rápidas (archivos ejemplares)
- Mutaciones de facturas: `app/lib/actions.ts`
- Fetches y paginación: `app/lib/data.ts`
- Tipos de dominio: `app/lib/definitions.ts`
- Componentes UI del dashboard: `app/ui/dashboard/*.tsx`
- Config Next: `next.config.ts`, `package.json`

Si algo está ambiguo, pregúntame: ¿quieres que priorice una fusión con un archivo existente o que genere un primer PR con estas instrucciones?
