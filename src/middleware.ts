import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, isLocale } from "@/i18n/config";

const PROTECTED_SEGMENTS = ["admin"];

function detectLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.trim().split(";")[0]?.toLowerCase() ?? "";
    if (tag.startsWith("va")) return "va";
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // Locale prefix missing -> redirect with detected locale
  if (!first || !isLocale(first)) {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Refresh the auth session (also rotates cookies)
  const response = NextResponse.next({ request });
  const { user, response: sessionResponse } = await updateSession(request, response);

  // Session guard for protected sections; role checks happen in layouts/actions
  const section = segments[1];
  if (section && PROTECTED_SEGMENTS.includes(section) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Stick the detected locale on the response header for convenience
  sessionResponse.headers.set("x-locale", first);
  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Skip static assets, image optimizer, api routes and the auth callback.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|_vercel/|api/|auth/callback|maplibre/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
