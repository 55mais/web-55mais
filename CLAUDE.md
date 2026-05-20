# 55mas

Marketplace donde personas mayores de 55 años ofrecen servicios profesionales. Los clientes contratan a través de formularios estáticos y un equipo administrativo coordina asignaciones, cobros y seguimiento. Opera en múltiples países e idiomas.

## Stack y tecnologías

- **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
- **Lenguaje:** TypeScript (strict mode)
- **Base de datos y auth:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Estilos:** Tailwind CSS + shadcn/ui
- **Formularios:** Zod (validación) + componentes hardcodeados por flujo
- **Internacionalización:** next-intl
- **Email:** Resend (o equivalente via Supabase Edge Functions)
- **Paradigma:** Feature-Folder Architecture, ~200 LOC máximo por archivo

## Documentos de referencia

- architecture.md — Decisiones técnicas, estructura de capas, convenciones
- blueprint.md — Reglas de negocio, flujos, roles, estados de pedidos
- docs/features/ — Un archivo por feature con requisitos, esquema DB y criterios de aceptación

## Estructura de directorios

- src/app/[locale]/(public)/ — Catálogo, páginas de servicio, contratación
- src/app/[locale]/(auth)/ — Login, registro, recuperación (clientes y talentos)
- src/app/[locale]/(client)/ — Zona personal del cliente
- src/app/[locale]/(talent)/ — Portal del talento (perfil, documentación)
- src/app/[locale]/(admin)/ — Panel de administración
- src/features/ — Lógica por feature: services/, orders/, talents/, clients/, subtypes/, survey-questions/, migration/, notifications/
- src/shared/ — Componentes UI compartidos, hooks, utils, tipos globales
- src/lib/supabase/ — Cliente Supabase, helpers, tipos generados de DB
- src/lib/i18n/ — Configuración next-intl, diccionarios
- supabase/migrations/ — Migraciones SQL versionadas

## Comandos útiles

- pnpm dev → Servidor de desarrollo
- pnpm build → Build de producción
- pnpm lint → ESLint + TypeScript check
- supabase start → Levantar Supabase local (Docker)
- supabase db push → Aplicar migraciones a Supabase local
- supabase gen types typescript --local > src/lib/supabase/database.types.ts → Regenerar tipos de DB
- pnpm dlx shadcn@latest add [componente] → Agregar componente de shadcn/ui

## Gotchas

- **Build requiere NODE_ENV=production:** `NODE_ENV=production pnpm build`. Sin esto, falla con `useContext` null errors en páginas internas de Next.js (_not-found, _error).
- **next-intl v3 (no v4):** Se usa v3.26.x porque v4 tiene el mismo useContext bug con Next.js 14 + React 18. La API usa `unstable_setRequestLocale` (no `setRequestLocale`).
- **Tailwind v4 + shadcn base-nova:** shadcn@latest genera componentes para Tailwind v4 (`@base-ui/react`, no `@radix-ui/react`). CSS usa `@import "tailwindcss"` en vez de `@tailwind base/components/utilities`. No hay `tailwind.config.ts` — la config es vía CSS.
- **Route groups no pueden tener page.tsx en la raíz:** Todas las route groups resuelven a `/{locale}/`, causando conflicto. Cada group necesita segmentos únicos (e.g., `(admin)/admin/`, `(auth)/login/`).
- **Server Components usan `getTranslations` (async):** En pages, usar `getTranslations` de `next-intl/server` (no `useTranslations`). `useTranslations` es para Client Components.
- **`Link` vs `useRouter`/`redirect` (locale duplicado):** `@/lib/i18n/navigation` antepone el locale automáticamente. `Link` siempre se importa de ahí (paths canónicos sin locale: `/registro`, `/servicios/...`). Pero los redirects post-auth (`useRouter().push`, `redirect()` server-side) reciben paths que YA tienen locale (`safeNext` devuelve `/{locale}/...`, callback handlers también), así que se importan de `next/navigation` — si no, queda `/es/es/...` y 404. Detalle en `docs/I18N.md` → "Navegación".

## Límites de tamaño

- Archivos: máximo 300 líneas
- Funciones: máximo 60 líneas
- Feature completo: máximo 1500 líneas
- Servicio/módulo: máximo 800 líneas

## Reglas de vibecoding

- Diagnosticar antes de implementar: leer archivos, reportar estado actual, NO asumir
- TDD obligatorio: escribir tests → verificar que fallan → implementar → verificar que pasan
- Spec antes de código: features nuevas requieren spec en docs/features/ antes de implementar
- Un prompt por responsabilidad: si un cambio toca >5 archivos o mezcla backend/renderer, dividir en sesiones
- Cada sesión se auto-verifica: tests + typecheck + reportar líneas de archivos tocados
- Documentar decisiones: cambios arquitectónicos se registran en docs/ para que el contexto persista
- Nunca asumir el estado del código: siempre leer el archivo antes de modificarlo
