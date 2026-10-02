/**
 * Minimal transactional email via Resend's REST API. No-ops (returns false)
 * when RESEND_API_KEY is empty; the edit link is always shown on screen too.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "MyLloguer <onboarding@resend.dev>",
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) console.error("sendEmail failed:", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("sendEmail failed:", e);
    return false;
  }
}
