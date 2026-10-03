# Deploying Lloguer on Vercel

A step-by-step checklist for the first production deploy. Work through it in order; the
order matters (for example the database must exist before the app's env vars can be filled in).

Terms: **prod** = the live site and its own Supabase project. **dev** = the existing cloud
project used for local development and previews (`oivdjumiwtppxuvpirab`).

## 0. Decisions to make first

- [ ] **Production domain** (for example `lloguer.example`). It is needed for Supabase redirects,
      Turnstile, Resend and `NEXT_PUBLIC_SITE_URL`.
- [ ] **Region.** Pick one EU region and use it for both Supabase and Vercel functions (see 1 and 4).
      Pages are server-rendered on every request, so distance between the two is user-visible latency.
- [ ] **Vercel plan.** The free Hobby plan is limited to personal, non-commercial use. A non-profit
      initiative should check with Vercel whether it qualifies, or use Pro.
- [ ] **Who owns the accounts** (Vercel, Supabase, Resend, Upstash, Cloudflare). Use a shared
      hub mailbox, not a personal email, so the project survives people moving on.

## 1. Supabase (production project)

Create a **new** project. Do not reuse dev: it holds demo data and the demo admin from `seed.sql`.

- [ ] Create the project in the EU region chosen above. Save the database password.
- [ ] Apply the schema from your machine:
      ```bash
      npx supabase link --project-ref <PROD_REF>
      npx supabase db push
      ```
      This applies `supabase/migrations/0001_init.sql`, which also creates the `listing-photos`
      storage bucket and its policies.
- [ ] Database, Extensions: confirm `pg_cron` is enabled, then run in the SQL Editor:
      `select jobname, schedule from cron.job;` and check `expire-listings-hourly` is listed.
      If it is missing, enable the extension and re-run the `cron.schedule` line from the migration.
- [ ] **Do not run `supabase/seed.sql`.**
- [ ] Close the direct API door. Generate a long random secret (`openssl rand -hex 32`) and run:
      ```sql
      insert into private_settings (key, value) values ('submit_gate', '<SECRET>');
      ```
      Keep the same value for `SUBMIT_GATE_SECRET` in Vercel (step 4). Without this row the submit
      functions are callable straight from the public API, bypassing captcha and rate limits.
- [ ] Project Settings, API: copy the **Project URL** and the **anon public** key. Never use or
      store the `service_role` key anywhere in this project.
- [ ] Authentication, SMTP Settings: enable custom SMTP (Resend works). The built-in mailer only
      reaches organisation members and is heavily rate limited, so admin magic links would not arrive.
- [ ] Authentication, URL Configuration:
      - Site URL: `https://<DOMAIN>`
      - Redirect URLs: `https://<DOMAIN>/auth/callback`
- [ ] Authentication, Providers: leave email (magic link) enabled and everything else disabled.
      There is no Google or OAuth login.

## 2. Resend (transactional email)

Used to email posters their private edit link and, through Supabase SMTP, admin magic links.

- [ ] Create an account and add your sending domain.
- [ ] Add the DNS records Resend shows (SPF, DKIM, optionally DMARC) and wait until the domain
      shows as verified.
- [ ] Create an API key, sending access only. This is `RESEND_API_KEY`.
- [ ] Decide `EMAIL_FROM`, for example `Lloguer <no-reply@<DOMAIN>>`. It must be on the verified domain.
- [ ] Use the same Resend account for the SMTP settings in Supabase (step 1).

## 3. Turnstile and Upstash

- [ ] **Cloudflare Turnstile:** create a widget, add `<DOMAIN>` (and `www.` if used) as allowed
      hostnames. Copy the site key (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and secret (`TURNSTILE_SECRET_KEY`).
      Without these the publish form has no captcha.
- [ ] **Upstash Redis:** create a database in the same region family, copy the REST URL and token
      (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Without them rate limiting silently
      does nothing (publish 5/day, edits 20/day, views 30/min per IP).

## 4. Vercel project

- [ ] Import the GitHub repository. Framework preset: Next.js (auto-detected). Build command
      and output directory: leave the defaults.
- [ ] **Project Settings, Functions, Function Region:** set it to the EU region matching Supabase
      (for example Frankfurt `fra1` or Paris `cdg1`). The default is Washington D.C., which would add
      a transatlantic hop to every database call.
- [ ] **Project Settings, Git, Production Branch:** `main`. Until the PR is merged you can set it to
      `Javi-additions` for a live URL, then switch it back (see "Switching branches" below).
- [ ] **Environment Variables, scope = Production:**

      | Variable | Value |
      | --- | --- |
      | `NEXT_PUBLIC_SUPABASE_URL` | prod Project URL |
      | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod pub key |
      | `NEXT_PUBLIC_SITE_URL` | `https://<DOMAIN>` (no trailing slash) |
      | `SUBMIT_GATE_SECRET` | the exact value inserted in `private_settings` |
      | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key |
      | `TURNSTILE_SECRET_KEY` | Turnstile secret |
      | `RESEND_API_KEY` | Resend key |
      | `EMAIL_FROM` | `Lloguer <no-reply@<DOMAIN>>` |
      | `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
      | `UPSTASH_REDIS_REST_TOKEN` | Upstash token |

      **Do not set `ENABLE_EMAIL_LOGIN`.** It would expose the demo email and password form in production.
      Variables starting with `NEXT_PUBLIC_` are baked in at build time, so changing one needs a redeploy.
- [ ] **Environment Variables, scope = Preview:** point these at the **dev** Supabase project (and
      leave captcha, email and Upstash empty if you like), so test submissions on preview URLs never
      land in the production database. Leave `NEXT_PUBLIC_SITE_URL` unset or set to a dev URL; it only
      affects the link inside the poster email, and the link is always shown on screen too.
- [ ] Deploy.

## 5. Domain

- [ ] Project Settings, Domains: add `<DOMAIN>` and `www.<DOMAIN>`, follow Vercel's DNS instructions,
      and make one redirect to the other.
- [ ] Wait for the certificate, then confirm `https://<DOMAIN>` loads (it redirects to `/es`, `/ca` or
      `/en` by browser language).
- [ ] If the domain changed after step 1, update Supabase URL Configuration, Turnstile hostnames,
      `NEXT_PUBLIC_SITE_URL` and redeploy.

## 6. First admin

- [ ] Open `https://<DOMAIN>/es/login` (there is no header link on purpose), enter your email,
      and click the magic link. This only creates your account.
- [ ] In the Supabase SQL Editor:
      ```sql
      update profiles set is_admin = true where email = '<YOUR_EMAIL>';
      ```
- [ ] Reload: the moderation area (`/es/admin/moderation`) should now open. Admin rights exist only
      as this flag, never through the app.

## 7. Smoke test (do all of it before promoting)

- [ ] Landing page loads in es, ca and en; the hero animation plays; "Explore the map" goes to `/map`.
- [ ] `/login` shows **only** the magic-link form (no email and password form).
- [ ] **Publish** a real listing with photos: captcha shows, submit succeeds, the edit link appears
      on screen **and** arrives by email, and the email link opens `/manage/...`.
- [ ] The listing shows as pending in the admin moderation queue, and **approve** makes it appear
      on `/map` and in the list. Its expiry date is 10 days out.
- [ ] Edit it through the edit link: it goes back to pending. Deactivate and republish work.
- [ ] **Delete** it through the edit link, then confirm in Supabase that the row is gone and the
      photo files are gone from Storage (`listing-photos`), and `photo_deletion_queue` is empty.
- [ ] **Submit gate:** a direct call to the public API, `POST <SUPABASE_URL>/rest/v1/rpc/submit_listing`
      using only the anon key, must be **rejected**. If it succeeds, the `submit_gate` row is missing
      or does not match.
- [ ] Rate limit: submitting more than 5 times in a day from one IP is refused.
- [ ] Response headers on any page include `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- [ ] Map and place search: OpenStreetMap tiles load with the attribution visible, and picking a
      pin on the publish form fills the municipality (Nominatim). Check on a phone too.
- [ ] Expiry job: after the first hour, `select * from cron.job_run_details order by start_time desc limit 5;`
      shows successful runs.
- [ ] Footer and `/legal` show the hub's real contact address.

## 8. Before you promote it

- [ ] **Seed real listings.** Publish and approve a handful of genuine listings (ideally in Madrid and
      Barcelona as well as València) through the normal form. Never use `seed.sql`. An empty map
      loses people in the first ten seconds.
- [ ] **The map always opens on València.** For a push aimed at another city, share a link that
      opens on that place (`/es/map?city=<name>`), or add a default-view-by-location change first.
- [ ] **Moderation capacity.** Agree who reviews, how often, and the target turnaround, so a spike
      of submissions does not pile up unreviewed.
- [ ] **Legal text.** Check `/legal` names the services that process data (Vercel, Supabase, Resend,
      Upstash, Cloudflare Turnstile) and where. At the time of writing it does not list them.
- [ ] **OpenStreetMap limits.** The public tile server and Nominatim are for light use. Before a large
      push, switch the tile URL in `src/features/map/style.ts` to a tile provider or self-hosted tiles.
- [ ] Known gaps still open (not blockers, but know them): expired listings are never purged, failed
      photo deletions are not retried, and photos uploaded but never submitted are not swept.

## Switching branches (Javi-additions to main)

Nothing about the deployment depends on which branch is live. The env vars, domain, Supabase
project and third-party accounts all stay put.

1. Merge the PR into `main`.
2. Vercel, Project Settings, Git, **Production Branch**: set it to `main` (if it was set to
   `Javi-additions`).
3. Redeploy from `main` (Deployments, the latest `main` build, Promote or Redeploy).
4. Confirm the production URL serves the new deployment, then delete the old branch if you want.

If you only used preview deployments from the branch, step 2 is not needed: pushing to `main`
becomes the production deployment on its own.

## Database changes after launch

`0001_init.sql` is only editable in place while no production database exists. **Once the production
project is created, treat it as frozen.** Every later schema change must be a new, append-only
migration file (`0002_...sql`, and so on) applied with `npx supabase db push`. An edit to
`0001_init.sql` after that point will not reach production and fails silently. Also update
`src/lib/types/database.types.ts` by hand when the schema changes.

## Rollback

- **Bad deploy:** Vercel, Deployments, pick the last good one, Promote to Production. Instant, no rebuild.
- **Bad env var:** fix it and redeploy (public variables are baked in at build time).
- **Bad migration:** there is no automatic down-migration. Write a new migration that reverses it.
