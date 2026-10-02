import { headers } from "next/headers";

/** Best-effort client IP behind a proxy/CDN. Falls back to "unknown". */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
