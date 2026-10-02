/**
 * RLS / transition smoke test against the local Supabase stack.
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

async function login(email) {
  const res = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
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

const pub = rest(await login("publisher@mylloguer.dev"));
const admin = rest(await login("admin@mylloguer.dev"));
const anon = rest(ANON);

// 1. publisher sees all own listings (all statuses)
{
  const { json } = await pub("listings?select=id,status,price");
  check(`publisher sees own listings (${json.length} = 40)`, json.length === 40);
  globalThis.__approved = json.find((l) => l.status === "approved");
  globalThis.__pending = json.find((l) => l.status === "pending");
}

// 2. owner edits approved listing -> back to pending + 'edited' event
{
  const id = __approved.id;
  await pub(`listings?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ price: 999 }),
  });
  const { json: after } = await pub(`listings?id=eq.${id}&select=status,price`);
  check(
    `owner edit of approved -> pending (got ${after[0].status})`,
    after[0].status === "pending",
  );
  const { json: events } = await pub(
    `moderation_events?listing_id=eq.${id}&action=eq.edited&select=action`,
  );
  check(`'edited' moderation event recorded`, events.length > 0);
}

// 3. owner cannot insert with status approved
{
  const { status } = await pub("listings", {
    method: "POST",
    body: JSON.stringify({
      type: "room",
      status: "approved",
      price: 400,
      municipality: "València",
      location: "SRID=4326;POINT(-0.37 39.47)",
      contact_whatsapp: "+34600000000",
      room_type: "single",
      description: "texto de prueba suficientemente largo",
    }),
  });
  check(`insert with status=approved rejected (got ${status})`, status >= 400);
}

// 4. deactivate approved -> draft
{
  const { json: rows } = await pub(
    "listings?status=eq.approved&select=id&limit=1",
  );
  const id = rows[0].id;
  await pub(`listings?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "draft" }),
  });
  const { json: after } = await pub(`listings?id=eq.${id}&select=status`);
  check(`deactivate approved -> draft (got ${after[0].status})`, after[0].status === "draft");

  // 5. owner cannot self-approve from draft
  const res = await pub(`listings?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved" }),
  });
  const { json: still } = await pub(`listings?id=eq.${id}&select=status`);
  check(
    `owner cannot self-approve (http ${res.status}, status ${still[0].status})`,
    still[0].status === "draft",
  );
}

// 6. anon reads: base table denied/empty, public view shows only live listings
{
  const { json: base } = await anon("listings?select=id");
  const baseRows = Array.isArray(base) ? base.length : 0;
  check(`anon base listings has no rows (got ${baseRows})`, baseRows === 0);
  const { json: approvedRows } = await admin(
    "listings?status=eq.approved&select=id&expires_at=gt.now()",
  );
  const { json: view } = await anon("public_listings?select=id");
  check(
    `anon public_listings = live listings (${view.length} = ${approvedRows.length})`,
    view.length === approvedRows.length,
  );
}

// 7. admin approves pending
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

// 8. publisher cannot read other users' data / profiles
{
  const { json: profiles } = await pub("profiles?select=id,email");
  check(
    `publisher sees only own profile (got ${profiles.length})`,
    profiles.length === 1,
  );
}

// 9. anonymous submission flow (no account): only via security-definer functions
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
    contact_email: email,
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
