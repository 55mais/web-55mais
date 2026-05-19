# Auth Pages — Login / Registro / Recuperar contraseña

## Context

El link "Iniciar sesión" del header público apunta a `/login`
desde hace tiempo pero la página es solo un placeholder. Toda la
lógica de autenticación vive embebida en el modal de contratación
(`AuthGate` en service-hire) y exige fiscal_id porque crea
`client_profiles` en el mismo paso. No hay registro standalone,
ni recuperación de contraseña, ni callback handler para
verificación de email.

Se construyen 4 páginas + 1 placeholder + 1 callback handler
production-grade para cubrir el surface de acceso:

1. **`/login`** — email + contraseña, toggle eye en password, link
   "¿Olvidó su contraseña?", botón "Iniciar sesión con Google"
   visible pero **deshabilitado** (OAuth queda fuera), link
   "Crear una cuenta".
2. **`/registro`** — crea **usuario + perfil base** (sin
   `client_profiles` ni `talent_profiles`). Pide: nombre completo,
   teléfono, país (pre-llenado por cookie), ciudad (pre-llenada),
   email, contraseña. País y ciudad editables.
3. **`/recuperar`** — pide email; Supabase envía un link de
   recuperación. UI always-ok (anti email-enumeration).
4. **`/recuperar/nueva-contrasena`** — después del callback
   recovery, el usuario setea su nueva contraseña.
5. **`/mi-cuenta`** — placeholder gated; sin diseño todavía.
6. **`/auth/callback`** — route handler GET que cambia
   `?code=` por sesión y redirige según `type`. **Vive fuera de
   `[locale]`** para evitar interferencia del middleware next-intl
   con el query param.

Diseño: card centrada minimal sobre fondo crema (`brand-cream`
ya existente en `globals.css`), logo arriba, sin nav/footer.
Coincide con la captura del usuario.

5 locales (es default + en/pt/fr/ca), parity test verde.

## Decisiones del usuario (cerradas)

1. **Modelo de roles aditivo, no excluyente.** Cada usuario es un
   "user base" que puede acumular roles: client, talent o ambos.
   `user_roles` es aditivo. `active_role` es preferencia de UI
   (qué dashboard ver), NO autorización. El trigger
   `handle_new_user` granting `'client'` por default es el
   bootstrap razonable; talent registration añade `'talent'`
   sin quitar `'client'`. Futuro: switch UI para alternar entre
   "vista cliente" y "vista talento". No hay deuda técnica. El
   registro del scope crea `profiles` + `user_roles('client')`
   por el trigger; el form NO crea `client_profiles` ni
   `talent_profiles`.

2. **Verificación de email vía SendGrid.** Implementamos el flujo
   completo: `signUp` con `emailRedirectTo`, callback handler,
   pantalla "revisá tu email". El SMTP de SendGrid se configura
   en Supabase Dashboard (Auth → SMTP) sin tocar código; mientras
   tanto Supabase usa su SMTP default (rate-limited en
   producción, suficiente para dev).

3. **Post-login → `/mi-cuenta`** placeholder. Honra `?next=` con
   whitelist anti open-redirect.

4. **Layout auth = minimal centrado** (logo + card sobre fondo
   crema, sin header/nav/footer).

5. **Google OAuth deshabilitado** (botón visible con
   `disabled` + tooltip "Próximamente").

6. **Logout fuera de scope** (follow-up separado).

## Gaps revisados (resumen — detalle completo en el plan)

- **G1** SendGrid se configura en dashboard, no en código.
- **G2** Modelo aditivo de roles: documentado arriba.
- **G3** Anti email-enumeration en forgot password: always-ok
  con error-swallow + constant-time.
- **G4** Anti open-redirect: `safeNext` valida path interno +
  blocklist `/api/`, `/_next/`, `/_vercel/`, `/auth/`.
- **G5** Prefill país/ciudad sin cookie: primer país activo
  con ciudades.
- **G6** Password strength: min 8 chars (override del default 6
  de Supabase).
- **G7** UX email confirmation: pantalla "Te enviamos un email a
  {email}" tras signup exitoso.
- **G8** Templates de email por locale: fuera de scope; Supabase
  default por ahora.
- **G9** Login con `email_not_confirmed`: mensaje específico.
- **G10** `/mi-cuenta` gated (redirect a `/login?next=` si no
  hay sesión).
- **G11** Post-login redirect = `safeNext(searchParams.next,
  locale)`.
- **G12** Logout NO en scope.
- **G13** Boundaries ESLint respetadas: `features/auth →
  shared|lib|components-ui`.
- **G14** Tests con mocked supabase: mismo harness que `get-
  hire-bootstrap.test.ts`.
- **G15** `emailRedirectTo` debe estar en Site URL +
  Additional Redirect URLs del dashboard. Requisito de deploy.
- **G16** Sesión de recovery efímera (3600s default).
- **G17** País sin ciudades activas → select deshabilitado;
  `register-prefill` prefiere países con ciudades.
- **G18** Enumeración en registro aceptada (sin UX alternativa
  razonable).
- **G19** Focus al primer campo inválido al submit con errores.
- **G20** `registerUser` usa `createAdminClient()` para el
  UPDATE post-signUp (sesión nula con email_confirm ON).
- **G21** Rate limit del SMTP default de Supabase (~4/hora).
- **G22** Locale viaja al callback como query param `?locale=`.
- **G23** `User already registered` cortocircuita la UPDATE.
- **G24** Enumeración via RPC público `is_email_registered` =
  trade-off aceptado; hardening = follow-up.
- **G25** Reset password con link pre-consumido por scanner:
  detecta `code_already_used` y redirige a `/recuperar`.
- **G26** Redirect-if-authed en `/login`, `/registro`,
  `/recuperar` (UX wart prevention).

## Criterios de aceptación

- "Iniciar sesión" del header → `/login` → form se ve igual a
  la captura del usuario en los 5 idiomas.
- Registro completo crea `auth.users` + `profiles` con
  `phone/preferred_country/preferred_city` poblados; NO crea
  `client_profiles` ni `talent_profiles`.
- Click en email de confirmación → callback → `/mi-cuenta`
  logueado.
- Login con credenciales correctas → `safeNext(next, locale)` o
  `/mi-cuenta`.
- Forgot password → siempre dice "te enviamos un email si esa
  dirección está registrada" (no leak).
- Reset password con link válido → set new password → `/mi-cuenta`.
- País/Ciudad pre-cargadas desde la cookie (cuando seteada) y
  editables; si el país no tiene ciudades activas, el form
  prefiere otro país y muestra mensaje.
- `/mi-cuenta` sin sesión → redirect a
  `/login?next=/{locale}/mi-cuenta`.
- `/login`, `/registro`, `/recuperar` con sesión ya activa →
  redirect a `safeNext` o `/mi-cuenta`.
- Mobile: card centrada, full-width responsivo.
- Parity i18n verde tras agregar el namespace `Auth`.
- Boundaries lint verde.

## Out of scope (declarado)

- **Logout** (follow-up: dropdown del usuario en el nav).
- **OAuth Google** real (botón disabled; follow-up cuando haya
  credentials).
- **Email templates per-locale** (Supabase usa default).
- **Botón "Reenviar email de verificación"** (follow-up).
- **Cambio de email** (follow-up).
- **Switch UI cliente↔talento** (futuro; cambia `active_role`).
- **Migración del trigger `handle_new_user`** (modelo aditivo
  lo deja como está).
- **Diseño de `/mi-cuenta`** más allá del placeholder.
- **Hardening del RPC `is_email_registered`** (G24): se acepta
  como público para esta fase.

## Referencias

- Plan: `/Users/maxi/.claude/plans/hashed-greeting-curry.md`
- Captura del diseño: `glados-images/Captura-de-pantalla-2026-
  05-19-a-las-4.21.42-p.-m..png`
- Auth surface existente: `src/features/service-hire/actions/
  auth-actions.ts` (AuthGate del wizard; se conserva intacto).
- Helpers cookie ubicación: `src/shared/lib/country/select-
  city.ts`.
- Patrón País/Ciudad selects: `src/features/service-hire/
  components/wizard/step-one-location.tsx`.
- Tokens de marca: `src/app/globals.css:7-59`.
- Memory: [project_role_model.md] (modelo aditivo de roles).
