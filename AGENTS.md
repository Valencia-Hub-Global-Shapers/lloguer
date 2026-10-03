# Lloguer — agent guide

Map-first, open shared-flat classifieds for all of Spain (the map opens on València by default). Anyone can publish without an account; every listing is manually moderated and expires 10 days after approval. Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase (Postgres/PostGIS, Auth, Storage) + MapLibre GL (OpenStreetMap tiles, no API key).

## Commands

```bash
npm run dev            # Next dev server
npm run build          # production build (must stay green)
npm run typecheck      # tsc --noEmit (must stay green)
npm run lint           # eslint
npm test               # vitest unit tests (schemas, params, geocode)
npm run test:rls       # RLS/transition smoke test — needs local supabase running + seeded
npm run supabase:start # local stack (Docker required)
npm run db:reset       # re-apply migrations + seed
```

## Local setup

Dev runs against the **cloud Supabase project** — no Docker required. `.env` holds the cloud keys (Supabase URL/anon key, Upstash). Do not create `.env.local` (it would override `.env`).

1. Apply migrations to the cloud project (one time, or after adding migrations):
   `npx supabase link --project-ref oivdjumiwtppxuvpirab && npx supabase db push`
2. Optional demo data: run `supabase/seed.sql` in the dashboard SQL Editor (creates the demo admin user from `seed.sql` and 40 listings).
3. In the cloud dashboard (Authentication → URL Configuration) add `http://localhost:3000/auth/callback` to the redirect URLs so magic links work. Supabase's built-in mailer only delivers to organization members at a very low rate, so locally the dev password form on `/login` (needs the seed users) is easier.
4. `npm run dev`.
5. The Docker-based local stack (`npm run supabase:start`, `db:reset`, `test:rls`) still works but is optional; `test:rls` assumes the local stack.

## Architecture

- `src/app` — routing only (thin). Locale segment `[locale]` (es default, va = "Valencià", en). Pages/layouts are RSC; `"use client"` only at leaves (map, filters, forms, sheets).
- `src/features/<name>/{components,server,schemas.ts,types.ts}` — features never import each other's `server/` modules; shared code lives in `src/lib`.
- `src/lib/supabase/{server,client,middleware}.ts` — single entry points. **No service-role key anywhere**; privileged work runs in security-definer DB functions.
- `src/components/ui` — shadcn-style primitives (Tailwind v4, CSS vars in `globals.css`).
- Branding follows the Global Shapers Valencia Hub site (valencia-hub-global-shapers.github.io): warm paper ground (`--background`), flat brand blue (`--brand`, from the official mark) for links, badges and clusters, and ONE burnt-orange accent (`--primary` `#d6521d`) reserved for the wordmark (the single word "Lloguer"), CTAs, prices and active markers. Hairline borders instead of shadows, 3px corners, Newsreader (display, headings) + Work Sans (text) + Fraunces (wordmark only, `font-logo`) loaded from Google Fonts in `src/app/layout.tsx`. No Global Shapers logo in the UI: the hub is credited only in a quiet footer line (hub URLs in `src/lib/brand.ts`); the favicon is a neutral Lloguer mark (white key with a house-shaped bow on an orange tile). Global element styles go in `@layer base` so Tailwind utilities can override them. Numbered form sections use `SectionEyebrow`. The slim footer shows on every page except the full-screen map (`/[locale]/map`). The home `/[locale]` is a static landing page explaining what Lloguer is (copy in the `landing` dictionary section).
- Server actions return `Result<T>` (`src/lib/result.ts`) with i18n error keys — never throw to the client. Validate with the Zod schema from `features/*/schemas.ts` (same schema shared with react-hook-form).

## Data & security (critical invariants)

- Posters have **no accounts**. Anonymous writes go only through security-definer functions (`submit_listing`, `update_listing_by_token`, `set_listing_status_by_token`, `get_listing_by_token`, all in `0001_init.sql`); `anon` has no table privileges. Ownership = a random edit token shown/emailed once; only its sha256 is stored (`listings.edit_token_hash`). Listings have no owner column. Admin writes go through server actions + RLS (admin only).
- The optional `submit_gate` secret (`private_settings` row + `SUBMIT_GATE_SECRET` env) makes the functions callable only from the server actions (captcha + IP rate limit). Without the row they are open (local dev).
- Public reads use the `public_listings` / `public_profiles` **security-definer views**; the base `listings` table is admin only. `location` (exact coords), `internal_email` and `edit_token_hash` must never appear in public queries; only `public_lat/lng` (snapped to 3 decimals by trigger at write time).
- Any poster edit or republish sends the listing back to `pending`; that and the allowed poster transitions (deactivate approved, republish draft/rejected/expired, delete) are enforced inside the token functions, since only they can write on a poster's behalf.
- `database.types.ts` is hand-maintained to match `supabase/migrations` (use `type`, not `interface` — Supabase's `GenericSchema` constraint requires implicit index signatures). Regenerate with `npx supabase gen types typescript --local` when the schema changes, then reconcile.
- Rate limiting (Upstash) in `src/lib/rate-limit.ts`, keyed by IP for posters: publish 5/day, edits 20/day, views 30/min. No-ops when env vars are empty (local dev). Fail closed on mutations, fail open on views. Also: Turnstile captcha (`src/lib/captcha.ts`, skipped without keys), honeypot field, and 5 submissions/email/day inside `submit_listing`.
- Contact rules: two independent things. (1) Public contact: WhatsApp and/or a public email (`contact_email`), at least one required, both shown on the listing; the external link is always optional. (2) `internal_email`: mandatory, private, never in public views, and the only place the edit link is emailed; it can differ from the public email. The 5/day throttle in `submit_listing` is per internal email or WhatsApp. Enforced by the zod schema and the `listings_contact_required` constraint. Every form field is marked required (`*`) or optional via `FieldLabel`; keep that when adding fields.
- Erasure (GDPR): a poster's "delete" is a real delete. `set_listing_status_by_token('delete')` removes the `listings` row (moderation events and view counts cascade) and queues its photo paths in `photo_deletion_queue`; dropping a photo in an edit queues it too. Only the Storage API really deletes a file (SQL deletes on `storage.objects` leave the blob), and there is no service-role key, so the server action calls `storage.remove()` for the returned paths, which a narrow storage policy (`photo_pending_deletion`) allows for queued paths only, then `ack_photo_deletion()` clears the queue. If the Storage call fails, the paths stay queued. Known gaps: there is no retry job for queued paths, no sweeper for photos uploaded but never submitted, and nothing yet purges old expired listings.
- Admin login is a passwordless magic link (`MagicLinkForm` -> `signInWithOtp` -> `/auth/callback` code exchange); there is no Google/OAuth. Signing in only creates an auth user (and a `profiles` row via trigger); admin rights exist solely as `profiles.is_admin`, set by hand in the SQL Editor, never through the app. Production needs custom SMTP (e.g. Resend) in Supabase Auth settings, since the built-in mailer only reaches organization members.
- Photos: Supabase Storage bucket `listing-photos` (public read, anonymous writes only under `anon/<draft-uuid>/<file>.webp`), ≤8 photos, ≤5 MB, client downscales to ≤1600 px WebP. Anonymous uploads cannot be deleted by posters; removed photos are just unreferenced.

## Conventions

- i18n: all UI copy via dictionaries in `src/i18n/*.json` (same keys in all three). Server components use `getDictionary`, client components `useI18n()` (`t("a.b", { var })`). Descriptions render as plain text only. Counts use `plural(key, count)` (`useI18n()`): it picks `${key}One` when count is 1 and that key exists, else the base key (e.g. `home.results` / `home.resultsOne`); add the `...One` key in all three dictionaries.
- Filter state lives only in URL searchParams (`src/features/search/params.ts`). The gender filter means "listings that accept my gender" (`preferred_gender` is `any` or the chosen value).
- Listing TTL is `LISTING_TTL_DAYS` (`src/lib/constants.ts`, 10 days), applied on approval.
- Schema baseline is the single `supabase/migrations/0001_init.sql`. Nothing is deployed yet, so edit it in place and reset the DB; once a production database exists, switch to append-only migrations. `supabase/seed.sql` must stay reproducible via `db reset`.
- Places are free text on each listing (`municipality` required, `neighborhood` optional), filled at publish time by OpenStreetMap Nominatim reverse geocoding with `accept-language=es` (`src/features/map/geocode.ts`) and editable by the poster. There is no neighborhoods table: the `public_places` view lists places with live listings (plus their bounding box) and drives the "city or neighborhood" filter (`city` / `hood` URL params) and the map fly-to.
- Geography is Spain only. `src/lib/geo.ts` and the `listings_in_spain` constraint hold the same COARSE bounding boxes (they cannot follow the border, so they still cover Portugal and southern France); the form also rejects pins whose reverse-geocoded country is not ES, and moderators review everything.
- Maps use MapLibre GL with the public OpenStreetMap raster tiles (no API key). The basemap style is the single `MAP_STYLE` in `src/features/map/style.ts`, shared by the explorer, the pin picker and the mini map; its source carries the required OSM attribution, so keep it visible. The public tile server and Nominatim are donated infrastructure meant for light use: Nominatim allows max 1 request/second, so geocode only on an explicit pin drop (never on every map move or keystroke), and before serving heavy traffic switch the tile URL in `style.ts` to a tile provider or self-hosted tiles (tile policy: operations.osmfoundation.org/policies/tiles).
- Map pins are clustered on the server: `browse_pins()` (SQL) snaps live listings to a grid sized for the client's zoom (`src/features/map/clustering.ts`, clustered at zoom <= 13) and returns single listings or `{count, lat, lng}` cells. The client sends `zoom` with the bounds and just draws what it gets, so payload size does not grow with the number of listings. Its filters mirror `getPublicListings`; keep both in sync when adding a filter. Public coords are snapped to ~100 m, so many listings can share one point even at max zoom (they still overlap there).

## Known MVP shortcuts

- Detail page is a full page, not the panel overlay from the UX blueprint (still deep-linkable).
- Admin notifications = pending-count badge on the moderation nav link. Admins sign in at `/login` (no header link); the demo email login form only shows outside production unless `ENABLE_EMAIL_LOGIN=1`.
- pg_cron is optional locally; public reads also filter `expires_at` as belt-and-braces. `expire_listings()` can be called manually.
- The email + password form on `/login` exists for local dev/demo accounts only; production login (admins only) is the magic link.
