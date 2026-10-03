import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";
import { defaultLocale } from "@/i18n/config";

/** A bare locale root, e.g. "/es". */
const HOME_PATH = /^\/[a-z]{2}$/;

/**
 * Where to send the user after a successful magic-link sign-in. Admins who
 * just wanted to log in land straight in the moderation panel; a deep link
 * (for example a protected page captured before login) is always honoured.
 */
async function landingFor(
  next: string,
  supabase: SupabaseClient<Database>,
): Promise<string> {
  if (next !== "/" && !HOME_PATH.test(next)) return next;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return next;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return next;

  const locale = next.split("/")[1] || defaultLocale;
  return `/${locale}/admin/moderation`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : `/${defaultLocale}`;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${await landingFor(next, supabase)}`);
    }
  }

  return NextResponse.redirect(`${origin}/${defaultLocale}/login?error=link_invalid`);
}
