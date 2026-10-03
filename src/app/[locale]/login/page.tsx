import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  searchParams: Promise<{ next?: string; error?: string; signedout?: string }>;
}) {
  const { locale } = await params;
  const { next, error, signedout } = await searchParams;
  const dict = await getDictionary(locale);

  const target = next && next.startsWith("/") ? next : `/${locale}`;
  const current = await getCurrentProfile();
  // A used/expired link must stay visible even when a stale session exists;
  // otherwise we silently bounce home and the user has no way to understand it.
  if (current && error !== "link_invalid") redirect(target);

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
          {signedout === "1" ? (
            <p className="text-muted-foreground text-sm">{dict.auth.signedOut}</p>
          ) : null}
          {current ? (
            <div className="grid gap-3">
              <p className="text-muted-foreground text-sm">{dict.auth.alreadySignedIn}</p>
              <Button asChild>
                <Link href={target}>{dict.auth.continue}</Link>
              </Button>
            </div>
          ) : (
            <>
              <MagicLinkForm next={target} />
              {showEmailLogin ? <EmailSignInForm next={target} /> : null}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
