# Spec: Modal de contratación de servicio (wizard 5 pasos)

## Contexto

En `/servicios/[slug]` el botón **"Reservar ahora"** es hoy inerte
(`ServiceDetailHero`, server component, `disabled`+`aria-disabled`).
El formulario de contratación ya existe (`ServiceHireForm`,
monolítico) y solo está embebido en `admin/test-service-hire`. Esta
feature lo abre desde un **modal agnóstico reusable** partido en un
**wizard de 5 pasos**, en el idioma del sitio, con la ubicación
precargada desde la cookie (`getSelectedCity`, cookie-first) pero
editable. Production-grade, sin parches.

## Decisiones (cerradas con el usuario)

1. **Modal agnóstico** `<Modal>` en `src/shared` (responsive,
   branded, base-ui) + **wizard del feature** como contenido
   inyectado. Reusable para futuros modales (contacto, sugerencia).
2. **5 pasos**:
   1. **Dirección** — País, Ciudad, Dirección (Mapbox), Código
      postal.
   2. **Detalles del servicio** — preguntas del cliente del admin
      (`service.questions` vía `ServiceQuestionsRenderer`).
   3. **Programación** — único/recurrente **+ Facturación**.
   4. **Identificación** — Guest / Login / Registro.
   5. **Confirmación** — Términos (condicional) + Confirmar.
3. **Notas**: el `<textarea>` libre `notes` **no se renderiza**; se
   conserva en estado/payload (`''`). No es una pregunta del admin.
   Borrado real = decisión futura del usuario.
4. **Paso 1**: País, Ciudad, Dirección y CP **precargados desde la
   cookie** (`SelectedCity`) pero **todos editables**.
5. **Validación guiada**: "Siguiente" bloqueado hasta completar los
   obligatorios del paso; "Confirmar" revalida todo y salta al
   primer paso con error.
6. **Facturación** (Paso 3): reusa el modelo actual = *otro titular
   fiscal* (`BillingChoiceValue` same/custom). Sin migración. Otra
   *dirección* de facturación = fuera de scope.
7. Formulario en el **idioma seleccionado** (next-intl, 5 locales).
8. **Términos en login**: el schema exige
   `terms_accepted: z.literal(true)`. En login NO se muestra
   checkbox; el wizard fija `terms_accepted: true`
   programáticamente (el cliente ya aceptó T&C en el registro;
   `ensureClientProfile` solo sube a true).

## Campos por paso

| Paso | Componente / campos | Obligatorio para "Siguiente" |
|------|---------------------|------------------------------|
| 1 Dirección | `País select` · `Ciudad select` · `AddressAutocomplete` (Mapbox) · `CP` | `country_code` + `raw_text`/`street` (+ `city_id` cuando hay selects, S4) |
| 2 Detalles | `ServiceQuestionsRenderer(service.questions)` | preguntas `required` respondidas (`isAnswerMissing`) |
| 3 Programación | `SchedulingBlock` (once/recurring; `timezone` = `service.countryTimezones[country_code]`) + `BillingChoiceFields` | `start_date`+`time_start`; recurrente: frecuencia + (weekly⇒weekdays \| monthly⇒day_of_month); billing custom completo |
| 4 Identificación | `AuthGate` (guest/login/signup; guest⇒`GuestContactFields`) | `authState.status==='authenticated'` |
| 5 Confirmación | resumen + checkbox Términos (solo guest/signup) + Confirmar | terms_accepted (guest/signup); login ⇒ auto-true |

## Esquema de datos

Reusa tablas/acciones existentes. **Sin migración SQL.**

- Estado cliente: `ServiceHireFormState = { address, scheduling,
  answers, notes, terms_accepted, billing }` + `authState`.
- `submitServiceHire(FormData)` ya inserta `orders` (+ `order_subtypes`,
  `order_schedules` recurrente), sube archivos a `order-attachments`,
  y garantiza `client_profiles`. Resuelve:
  - **País**: `countries.code == address.country_code.toUpperCase()`.
  - **Ciudad**: `cities` por `country_id` + `slug ILIKE
    slugify(address.city_name)` — matchea por **slug**.
- **Extensión aditiva (S4, no breaking)**: `AddressValue.city_id?:
  string|null` (+ `emptyAddress`, `addressSchema.city_id?`).
  `submitServiceHire`: si `address.city_id` → resuelve `cities` por
  `id` (verifica `country_id` + activa); si no → heurístico slug
  actual (path Mapbox sin regresión). `build-order-payload` sin
  cambios.

## Gap crítico (datos → submit)

Inyectar el **nombre localizado** de la ciudad ("Lisboa" es vs
"Lisbon" en) en `address.city_name` rompería el match por slug ⇒
`service_city_id = null` en silencio. Por eso el Ciudad select fija
`address.city_id` (uuid autoritativo) además de `city_name` (display
/ payload). El path Mapbox (sin selects) deja `city_id=null` y usa el
heurístico slug de hoy (sin regresión).

## Comportamiento

- **No-flash / SSG**: `ServiceDetailHero` y `page.tsx` siguen server;
  el botón pasa a ser un island (`hire-launcher`) inyectado vía
  `ctaSlot: ReactNode`. El modal y su JS no bloquean el HTML
  indexable.
- **Carga diferida**: `getServiceForHire` + `getHireLocationOptions`
  se ejecutan al primer click (no en cada render de la página).
- **i18n cliente**: `app/[locale]/layout.tsx` usa `getMessages()`
  (set completo) + `NextIntlClientProvider` global → `useTranslations`
  válido en el launcher. `buildServiceHireHints(t)` agnóstico
  (sirve `getTranslations` server y `useTranslations` client).
- **Cierre** (X / Esc / backdrop / Cancelar) = cerrar modal; el
  primitivo base-ui aporta focus-trap, scroll-lock y `finalFocus`
  (foco vuelve al botón "Reservar ahora").
- **A11y entre pasos**: al cambiar de paso, foco al encabezado del
  paso (tabIndex -1) + región `aria-live="polite"` anunciando
  "Paso N de 5". Indicador numerado **no clicable** (wizard guiado).
- **"Atrás"**: conserva el estado; volver a paso 4 y cambiar de
  método de identificación re-autentica (AuthGate gestiona su
  estado).

## Criterios de aceptación

- "Reservar ahora" (servicio publicado con ≥1 país activo) abre el
  modal con el wizard en el idioma actual.
- `activeCountryCodes` vacío ⇒ botón deshabilitado + mensaje (no
  modal sin salida).
- Paso 1 prefilled desde cookie: `getSelectedCity` resuelve país y
  ciudad; si `getSelectedCity=null` ⇒ 1º país activo, ciudad vacía
  (usuario elige). Cambiar país ⇒ resetea ciudad (`city_id=null`,
  `city_name=''`) + Mapbox + restringe Mapbox a ese país.
- Ciudad localizada (otro idioma) ⇒ la orden graba
  `service_city_id` correcto (resuelto por `city_id`, no por slug).
- "Siguiente" deshabilitado mientras el paso tenga obligatorios sin
  completar; "Confirmar" revalida todo y salta al primer paso con
  error.
- Guest ⇒ `GuestContactFields`; Login ⇒ form login (sin checkbox de
  términos, `terms_accepted=true`, orden creada OK); Registro ⇒
  checkbox de términos obligatorio.
- Recurrente weekly sin weekdays / monthly sin day_of_month ⇒ paso 3
  inválido. Billing custom incompleto ⇒ paso 3 inválido.
- Pregunta de tipo archivo ⇒ se sube en submit
  (`file:{key}:{idx}`).
- Submit OK ⇒ pantalla de confirmación in-modal (mensaje amable; no
  expone `order_id` crudo) + cerrar.
- 5 idiomas: parity de keys verde; strings traducidos
  (EN/PT/FR/CA por el asistente).
- Mobile (`<md`) bottom-sheet, desktop (`≥md`) centrado.

## Limitaciones declaradas (no son bugs)

- **Auth creada antes de Confirmar**: guest/signup crea el usuario
  en el paso 4 aunque se abandone en el paso 5 (comportamiento
  **preexistente** del monolito; no se cambia el contrato de
  `AuthGate`/auth-actions).
- **Sin emails**: `submitServiceHire` no envía notificación alguna
  hoy; la orden se ve en `/admin`. Emails = plan separado.

## Out of scope

- Migrar confirm-dialog/suggestion/sheet al nuevo `<Modal>`
  (follow-up).
- Cambios de tipo de input / nuevos "obligatorio" por campo
  (iteración posterior tras ver el diseño base).
- Otra *dirección* de facturación (requiere migración → plan
  aparte).
- Backend nuevo de orden / emails / notificaciones (plan separado).
- Borrar el campo `notes` (decisión futura del usuario).
- Modal de contacto / sugerencia (reusarán el shell).
- Recuperación de migraciones / drift (plan separado ya acordado).
