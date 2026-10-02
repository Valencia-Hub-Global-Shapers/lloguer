import { headers } from "next/headers";

/**
 * Best-effort client IP behind a proxy/CDN. Falls back to "unknown".
 * Prefers x-real-ip (set by the platform proxy) and otherwise takes the LAST
 * x-forwarded-for entry, the one our own proxy appended. The first entry is
 * client-controlled and would let anyone dodge the per-IP rate limits.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = h.get("x-forwarded-for")?.split(",");
  return hops?.at(-1)?.trim() || "unknown";
}
