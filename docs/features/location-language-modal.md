# Feature: Modal de primera visita — País > Ciudad > Idioma

## Resumen

Modal estilo aerolínea que aparece **solo en la primera visita** al
sitio público y permite elegir **país → ciudad → idioma**. El país se
pre-selecciona por el dominio (`.es`→ES, `.pt`→PT, `.com.ar`→AR,
`.br`→BR, `.fr`→FR; default ES) pero el usuario puede cambiarlo. La
selección afecta los servicios visibles, los **precios y la moneda**
(vía país/ciudad) y el **idioma** (vía locale next-intl). Tras
cerrarlo o confirmarlo no vuelve a aparecer (cookie). Siempre editable
después desde el header (`LocatorSelect`) y `LangSwitcher`.

## Decisiones (cerradas con el usuario)

1. Cambio de país = **solo cookie, sin redirect de dominio**. El
   cookie de ubicación manda sobre el dominio.
2. Supresión = **una sola vez**, al cerrarlo o confirmarlo.
3. **Skippable**: botón "Continuar con [país del dominio]" aplica
   defaults y marca visto. No bloqueante.
4. Ciudad **obligatoria** en el flujo explícito de selección
   (Confirmar deshabilitado sin país+ciudad).
5. Idioma **independiente del país**: pre-selecciona el locale
   actual; ofrece los 5 locales.

## Requisitos

### Funcionales

- Detectar primera visita = ausencia del cookie `55mas_geo_ack`
  (incluye usuarios previos al feature: ven el modal **una vez**).
- Render del modal decidido **en SSR** (sin flash; si ya visto, ni el
  modal ni su JS se envían).
- Si no hay ningún país activo con ≥1 ciudad activa
  (`getSelectedCity` → `null`): el gate **no renderiza nada**
  (degradación, igual que el header oculta el `LocatorSelect`); no
  se bloquea al usuario.
- Pasos: país (preselect = país **actualmente resuelto** por
  `getSelectedCity`; = dominio solo si no hay cookie) → ciudad
  (filtrada por país, obligatoria) → idioma (preselect locale
  actual, 5 opciones).
- Solo se ofrecen países con ≥1 ciudad activa (no dejar callejón sin
  salida dada la ciudad obligatoria).
- **Confirmar**: escribir `55mas_location`=cities.id +
  `55mas_geo_ack`; si el idioma cambió, navegar al nuevo locale
  (next-intl); si no, refrescar RSC.
- **Skip / cerrar (X, Esc, backdrop)**: botón "Continuar con
  [país actualmente resuelto]"; escribir solo `55mas_geo_ack` (no
  toca `55mas_location` → se mantiene la selección resuelta /
  defaults del resolver) → refrescar.
- Resolutor de ciudad pasa a **cookie-first**: si el cookie
  `55mas_location` referencia una ciudad activa, esa ciudad y su país
  mandan sobre el dominio.
- Desktop y mobile (un solo `Dialog` responsive).

### No funcionales

- Sin migración SQL (reusa tablas existentes).
- Reusar helpers/acciones existentes (no duplicar data actions).
- Archivos ≤300 LOC, funciones ≤60, feature ≤800.
- i18n: namespace nuevo en los 5 locales, keys idénticas (parity).
- TDD donde aplique (resolutor, helpers de cookie, lógica del gate).

## Esquema DB (existente, NO se modifica)

- `countries`: `id uuid`, `code text` (ISO-2), `currency text`,
  `is_active bool`, `i18n jsonb` (`{ "<locale>": { "name": … } }`).
- `cities`: `id uuid`, `country_id uuid`, `slug text`,
  `is_active bool`, `i18n jsonb`.
- `service_cities`: `service_id`, `city_id`, `base_price`,
  `is_active`.
- `service_countries`: `service_id`, `country_id`, `base_price`,
  `is_active`.

Precio/moneda: `load-service-detail.resolvePrice` toma `currency` de
`countries.id` y `base_price` de `service_cities` (exacta) con
fallback a `service_countries`. Todo se deriva del par
`(cityId, countryId)` que entrega `getSelectedCity`.

## Cookies

| Cookie | Valor | Vida | Flags | Estado |
|---|---|---|---|---|
| `55mas_location` | `cities.id` (uuid) | 1 año | `path=/; SameSite=Lax` | **existe** |
| `55mas_geo_ack` | `'1'` | 1 año | `path=/; SameSite=Lax` | **nuevo** |

Bridge legacy: cookies viejas con slug (`'barcelona'`) se resuelven
**dentro del país del dominio** (comportamiento actual literal).

## Cambio de resolutor (`select-city.ts`)

Orden de resolución de `_selectCityUncached(locale)`:

1. Cookie `55mas_location` con forma uuid (regex): **una query**
   join `cities`(id, activa) × `countries`(activa) → si fila,
   `SelectedCity` con ese país (cookie manda, ignora dominio).
2. Cookie presente no-uuid (slug legacy): path dominio +
   `_listCitiesUncached`, match por slug **dentro del país del
   dominio** (literal al actual).
3. Sin cookie: path dominio → 1ª ciudad alfabética (intacto).
4. Nada activo → `null`.

Firmas/exports intactos (`getSelectedCity`, `listCitiesForCountry`,
`SelectedCity`, `LOCATION_COOKIE`, `React.cache`). Nuevo helper
interno `_resolveCityByIdUncached(id, locale)`.

## Flujos

### Primera visita

1. `PublicShell` (RSC) lee `hasGeoAck()`. Si falso:
   `listActiveCountries(locale)` + `listActiveCities(locale)` +
   `getSelectedCity(locale)` (ya resuelto, dedup `React.cache`) →
   render `<LocationModalGate>` abierto.
   Si `getSelectedCity` → `null` (sin países/ciudades activos): el
   gate no renderiza nada.
2. Usuario elige país (preselect = país resuelto por
   `getSelectedCity`) → ciudad (filtrada por `countryId`) → idioma
   (preselect locale).
3. Confirmar → cookies + nav. Skip/cerrar → solo ack + refresh.

### Visitas siguientes

`hasGeoAck()` verdadero → el gate no renderiza nada (ni JS).

### Cambio posterior

Header `LocatorSelect` (ciudad) y `LangSwitcher` (idioma) siguen
funcionando sin cambios; el modal no los toca.

## Contratos

- `listActiveCountries(locale): Promise<{id,code,name}[]>` — existe,
  public-safe (solo activos, localizado, ordenado).
- `listActiveCities(locale): Promise<{id,countryId,name}[]>` —
  existe; el gate filtra por `countryId` en cliente.
- `getSelectedCity(locale): Promise<SelectedCity|null>` — existe;
  comportamiento cambia a cookie-first (mismo tipo de retorno).
- Cookie ack (nuevos): `writeGeoAckCookieClient()` (client),
  `hasGeoAck()` (server, `cookies()`), `GEO_ACK_COOKIE` const.
- Nav idioma: `useRouter`/`usePathname` de `@/lib/i18n/navigation`
  (igual que `lang-switcher.tsx`).

## Criterios de aceptación

1. Dominio `.es`, sin cookies → modal visible, país preseleccionado
   ES, ciudad = 1ª de ES, idioma = locale actual.
2. Elegir España/Barcelona/EN → `55mas_location`=id(Barcelona),
   `55mas_geo_ack` set, navega a locale `en`; recarga **no** muestra
   el modal.
3. Dominio `.es` + cookie `55mas_location` = ciudad de **PT** → una
   página de servicio renderiza precio+**moneda** de PT (test:
   `_selectCityUncached` resuelve `countryCode='PT'`).
4. Cookie `55mas_location` = uuid inexistente / ciudad o país
   inactivo → degrada al país del dominio (no throw).
5. Cookie legacy slug (`'barcelona'`) → resuelve dentro del país del
   dominio (comportamiento actual preservado).
6. Sin cookie → país del dominio, 1ª ciudad (comportamiento actual).
7. Skip "Continuar con [país resuelto]" → solo `55mas_geo_ack`; se
   mantiene la selección resuelta / defaults; no reaparece.
8. Cerrar por Esc/backdrop/X = mismo efecto que skip.
9. Países sin ciudad activa no aparecen como opción.
10b. Sin países/ciudades activos en DB → el gate no renderiza
    (no rompe la página).
10. Idioma cambia con next-intl (mismo pathname, otro locale), sin
    doble prefijo; país/ciudad por cookie no fuerzan idioma.
11. Header `LocatorSelect`/`LangSwitcher` siguen cambiando
    ubicación/idioma tras cerrar el modal.
12. Mobile (bottom-sheet) y desktop (centrado) renderizan **un solo**
    modal; focus-trap, autofocus al select de país.
13. locale-parity test verde (keys `LocationModal` en los 5 locales).

## Fuera de scope

- Redirect entre dominios (.es↔.pt) — descartado por decisión #1.
- Geolocalización por IP (solo dominio, como hoy).
- Selector de ciudad en el menú mobile (follow-up).
- Refactor de `LocatorSelect`/`LangSwitcher`/header.
- Shells autenticados (client/talent/admin).
- Versionar el ack para re-preguntar al cambiar el modal (YAGNI).
- Persistir la preferencia en DB (es cookie; no se pidió storage).
- Recuperación de migraciones / drift (plan separado acordado).
