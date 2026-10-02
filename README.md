# MyLloguer

🏡 MyLloguer nace de una iniciativa de Global Shapers Valencia para juntar jóvenes en búsqueda de alquiler, con los mejores caseros que puedan encontrar.

Mapa primero: habitaciones y pisos entre particulares en toda España. El mapa abre en València por defecto; el filtro «Ciudad o barrio» lista los lugares que tienen anuncios activos y lleva el mapa hasta ellos.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres/PostGIS, Auth, Storage) · MapLibre GL + OpenStreetMap · i18n es/ca/en

## Arranque local

El desarrollo usa el **proyecto cloud de Supabase** (sin Docker). Las claves viven en `.env` (no crees `.env.local`, tendría prioridad).

```bash
npm install
npx supabase link --project-ref oivdjumiwtppxuvpirab
npx supabase db push              # aplica las migraciones al proyecto cloud
npm run dev                       # http://localhost:3000
```

Datos demo opcionales: ejecuta `supabase/seed.sql` en el SQL Editor del dashboard (crea el usuario admin demo de `seed.sql` y 40 anuncios). Para Google OAuth en local, añade `http://localhost:3000/auth/callback` en Authentication → URL Configuration del dashboard.

El stack local con Docker (`npm run supabase:start`, `db:reset`, `test:rls`) sigue disponible pero es opcional.

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
- Los admins siguen entrando con Google en `/login` (no hay enlace en la cabecera).

### Puesta en producción

1. Aplica las migraciones sobre un proyecto Supabase nuevo (`npx supabase db push`).
2. Rellena las variables de `.env.example` (Turnstile, Resend, Upstash, `NEXT_PUBLIC_SITE_URL`).
3. Cierra la puerta directa a la API: elige un secreto y guárdalo en los dos sitios para que solo el servidor pueda enviar anuncios.

   ```sql
   insert into private_settings (key, value) values ('submit_gate', '<secreto>');
   ```

   y `SUBMIT_GATE_SECRET=<secreto>` en el hosting. Si no hay fila en `private_settings`, las funciones quedan abiertas (útil en local).
4. Marca tu usuario como admin: `update profiles set is_admin = true where email = '<tu email>';`
5. No ejecutes `supabase/seed.sql` en producción (crea usuarios demo con contraseña conocida).

Más detalles para agentes en [AGENTS.md](AGENTS.md).
