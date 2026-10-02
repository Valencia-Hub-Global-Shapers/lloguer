/**
 * RLS / anonymous-submission smoke test against the local Supabase stack.
 * Run: node scripts/rls-smoke.mjs  (requires `supabase start` + seeded db)
 */
const API = "http://127.0.0.1:54321";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "OK  " : "FAIL"} ${name}`);
  if (!cond) failures++;
}

async function login(email, password) {
  const res = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`login ${email}: ${JSON.stringify(json)}`);
  return json.access_token;
}

const rest = (jwt) => async (path, init = {}) => {
  const res = await fetch(`${API}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
};

// Demo admin created by supabase/seed.sql
const admin = rest(await login("admin@mylloguer.com", "globalsh4pers!"));
const anon = rest(ANON);

// 1. admin sees every listing, all statuses
{
  const { json } = await admin("listings?select=id,status");
  check(`admin sees all listings (${json.length} = 40)`, json.length === 40);
}

// 2. anon reads: base table denied, public view shows only live listings
{
  const base = await anon("listings?select=id");
  check(`anon cannot read the base listings table (http ${base.status})`, base.status >= 400);
  const { json: live } = await admin(
    "listings?status=eq.approved&select=id&expires_at=gt.now()",
  );
  const { json: view } = await anon("public_listings?select=id");
  check(`anon public_listings = live listings (${view.length} = ${live.length})`, view.length === live.length);
  const hidden = await anon("public_listings?select=edit_token_hash");
  check(`public view does not expose edit_token_hash (http ${hidden.status})`, hidden.status >= 400);
  const settings = await anon("private_settings?select=*");
  check(`anon cannot read private_settings (http ${settings.status})`, settings.status >= 400);
}

// 3. admin approves a pending listing
{
  const { json: rows } = await admin("listings?status=eq.pending&select=id&limit=1");
  const id = rows[0].id;
  await admin(`listings?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "approved",
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 864e5).toISOString(),
    }),
  });
  const { json: after } = await admin(`listings?id=eq.${id}&select=status`);
  check(`admin approve works (got ${after[0].status})`, after[0].status === "approved");
}

// 4. anonymous submission flow (no account): only via security-definer functions
{
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const email = `smoke-${Date.now()}@example.com`;
  const payload = {
    type: "room",
    price: 380,
    neighborhood: "Russafa",
    municipality: "València",
    lat: 39.46,
    lng: -0.37,
    description: "Habitación de prueba para el smoke test anónimo",
    room_type: "single",
    contact_whatsapp: "+34600000000",
    internal_email: email,
    photos: [],
  };

  const direct = await anon("listings", {
    method: "POST",
    body: JSON.stringify({
      type: "room",
      price: 400,
      location: "SRID=4326;POINT(-0.37 39.47)",
      contact_whatsapp: "+34600000000",
      room_type: "single",
      description: "directo",
    }),
  });
  check(`anon cannot insert into listings directly (http ${direct.status})`, direct.status >= 400);

  const submitted = await anon("rpc/submit_listing", {
    method: "POST",
    body: JSON.stringify({ p_gate: "", p_token_hash: hash, p_payload: payload }),
  });
  const id = submitted.json;
  check(`anon submit_listing returns an id (http ${submitted.status})`, typeof id === "string");

  const { json: pubRows } = await anon(`public_listings?id=eq.${id}&select=id`);
  check(`new anonymous listing is not public before approval`, pubRows.length === 0);

  const mine = await anon("rpc/get_listing_by_token", {
    method: "POST",
    body: JSON.stringify({ p_id: id, p_token_hash: hash }),
  });
  check(
    `poster reads own listing with the token (status ${mine.json?.status})`,
    mine.json?.status === "pending" && mine.json?.edit_token_hash === undefined,
  );

  const wrong = await anon("rpc/get_listing_by_token", {
    method: "POST",
    body: JSON.stringify({ p_id: id, p_token_hash: "0".repeat(64) }),
  });
  check(`wrong token reads nothing`, wrong.json === null);

  const badEdit = await anon("rpc/update_listing_by_token", {
    method: "POST",
    body: JSON.stringify({ p_gate: "", p_id: id, p_token_hash: "0".repeat(64), p_payload: payload }),
  });
  check(`wrong token cannot edit (http ${badEdit.status})`, badEdit.status >= 400);

  const del = await anon("rpc/set_listing_status_by_token", {
    method: "POST",
    body: JSON.stringify({ p_gate: "", p_id: id, p_token_hash: hash, p_action: "delete" }),
  });
  check(`poster can delete with the token (http ${del.status})`, del.status < 300);
}

process.exit(failures ? 1 : 0);
