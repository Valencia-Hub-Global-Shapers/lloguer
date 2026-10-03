const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token. Skipped (returns true) when
 * TURNSTILE_SECRET_KEY is empty, which keeps local development friction-free.
 * Fails closed on network errors.
 *
 * The client IP is intentionally NOT sent as `remoteip`: it is only an extra
 * check and a dual-stack visitor (IPv4 vs IPv6) can make it mismatch and fail
 * a legitimate submission. The token is already bound to the site key and
 * single-use.
 */
export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (json.success !== true) {
      console.error("captcha verification failed:", json["error-codes"]);
    }
    return json.success === true;
  } catch (e) {
    console.error("captcha verification failed:", e);
    return false;
  }
}
