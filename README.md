# Lloguer

🏡 Lloguer nace de una iniciativa de Global Shapers Valencia para juntar jóvenes en búsqueda de alquiler, con los mejores caseros que puedan encontrar.

Mapa primero: habitaciones y pisos entre particulares en toda España. El mapa abre en València por defecto; el filtro «Ciudad o barrio» lista los lugares que tienen anuncios activos y lleva el mapa hasta ellos.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres/PostGIS, Auth, Storage) · MapLibre GL + OpenStreetMap (sin API key) · i18n es/ca/en

## Arranque local

El desarrollo usa el **proyecto cloud de Supabase** (sin Docker). Las claves viven en `.env` (no crees `.env.local`, tendría prioridad).

```bash
npm install
npx supabase link --project-ref oivdjumiwtppxuvpirab
npx supabase db push              # aplica las migraciones al proyecto cloud
npm run dev                       # http://localhost:3000
```

Datos demo opcionales: ejecuta `supabase/seed.sql` en el SQL Editor del dashboard (crea el usuario admin demo de `seed.sql` y 40 anuncios). Para el acceso con enlace mágico en local, añade `http://localhost:3000/auth/callback` en Authentication → URL Configuration del dashboard (o usa el formulario demo con contraseña, que solo aparece en desarrollo).

El stack local con Docker (`npm run supabase:start`, `db:reset`, `test:rls`) sigue disponible pero es opcional.

## Despliegue

Guía paso a paso para producción en Vercel + Supabase: [`docs/deployment-vercel.md`](docs/deployment-vercel.md).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` / `build` / `lint` / `typecheck` | Ciclo habitual Next.js |
| `npm test` | Tests unitarios (vitest) |
| `npm run test:rls` | Smoke test de RLS y transiciones (requiere Supabase local) |
| `npm run supabase:start` / `stop` | Stack local Supabase |
| `npm run db:reset` | Reaplica migraciones + seed |

## Publicar sin cuenta

Cualquiera puede publicar un anuncio sin registrarse (`/publish`). Cada anuncio entra en `pending` y un admin lo revisa a mano; al aprobarlo se activa **10 días** y después caduca solo.

- Al publicar se genera un **enlace privado de gestión** (`/manage/<id>/<token>`) que se muestra en pantalla y se envía por email (Resend) al **correo privado** del anuncio, que es independiente del correo de contacto público. Con él se edita, desactiva, republica o **borra definitivamente** el anuncio: se eliminan el anuncio, sus fotos y los datos de contacto (RGPD). En la base de datos solo se guarda el hash sha256 del token. Editar un anuncio aprobado lo devuelve a revisión.
- La escritura anónima pasa solo por funciones `security definer` (`submit_listing`, `update_listing_by_token`, `set_listing_status_by_token`, `get_listing_by_token`). `anon` no tiene permisos sobre las tablas.
- Contacto público: WhatsApp y/o correo (al menos uno); el enlace externo es opcional. El correo privado es obligatorio y nunca se publica.
- Antiabuso: captcha Cloudflare Turnstile, honeypot, límite por IP (Upstash) y máximo 5 envíos al día por correo privado o WhatsApp en la base de datos.
- El esquema vive en una única migración de referencia (`0001_init.sql`); mientras no haya despliegue se edita ahí en lugar de apilar migraciones.
- Los admins entran con un **enlace mágico** por correo en `/login` (no hay enlace en la cabecera ni cuentas de Google). Iniciar sesión solo crea la cuenta; no da ningún permiso hasta que se marca como admin en la base de datos (paso 4 de abajo).

### Puesta en producción

1. Aplica las migraciones sobre un proyecto Supabase nuevo (`npx supabase db push`).
2. Rellena las variables de `.env.example` (Turnstile, Resend, Upstash, `NEXT_PUBLIC_SITE_URL`).
3. Cierra la puerta directa a la API: elige un secreto y guárdalo en los dos sitios para que solo el servidor pueda enviar anuncios.

   ```sql
   insert into private_settings (key, value) values ('submit_gate', '<secreto>');
   ```

   y `SUBMIT_GATE_SECRET=<secreto>` en el hosting. Si no hay fila en `private_settings`, las funciones quedan abiertas (útil en local).
4. Correo de acceso de los admins: el servicio de correo integrado de Supabase solo envía a miembros de la organización y con un límite muy bajo. En Authentication → Emails → SMTP Settings configura tu propio SMTP (por ejemplo Resend, el mismo que usas para los enlaces de edición). En Authentication → URL Configuration pon la URL del sitio y añade `https://<tu-dominio>/auth/callback` a las redirecciones.
5. Da de alta a un admin: la persona entra en `/login`, pide el enlace y lo abre (verá la cuenta creada pero sin acceso). Después, en el SQL Editor: `update profiles set is_admin = true where email = '<su email>';`. Para quitarlo, `is_admin = false`. El cambio se aplica en su siguiente carga de página.
6. No ejecutes `supabase/seed.sql` en producción (crea usuarios demo con contraseña conocida).

### Mapa y OpenStreetMap

El mapa usa MapLibre GL con las teselas públicas de OpenStreetMap y Nominatim para obtener municipio y barrio al colocar el pin: no hace falta cuenta ni clave. Son servicios de uso ligero (Nominatim: máximo 1 petición por segundo; consulta la [política de teselas](https://operations.osmfoundation.org/policies/tiles/)). Si el tráfico crece, cambia la URL de teselas en `src/features/map/style.ts` por la de un proveedor (MapTiler, Stadia, Protomaps...) o por teselas propias. La atribución «© OpenStreetMap» debe seguir visible en el mapa.

Más detalles para agentes en [AGENTS.md](AGENTS.md).
