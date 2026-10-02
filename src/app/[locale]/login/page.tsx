import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { getCurrentProfile } from "@/features/auth/server/session";
import { MagicLinkForm } from "@/features/auth/components/magic-link-form";
import { EmailSignInForm } from "@/features/auth/components/email-signin-form";

export const dynamic = "force-dynamic";

/** Demo email/password login: dev only, unless ENABLE_EMAIL_LOGIN=1. */
const showEmailLogin =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_EMAIL_LOGIN === "1";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  const dict = await getDictionary(locale);

  const current = await getCurrentProfile();
  if (current) redirect(next && next.startsWith("/") ? next : `/${locale}`);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{dict.auth.loginTitle}</CardTitle>
          <CardDescription>{interpolate(dict.auth.loginDescription)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error === "link_invalid" ? (
            <p role="alert" className="text-destructive text-sm">
              {dict.auth.linkInvalid}
            </p>
          ) : null}
          <MagicLinkForm next={next ?? `/${locale}`} />
          {showEmailLogin ? <EmailSignInForm next={next ?? `/${locale}`} /> : null}
        </CardContent>
      </Card>
    </main>
  );
}
