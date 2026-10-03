import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/features/auth/components/user-menu";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { CurrentProfile } from "@/features/auth/server/session";

export async function SiteHeader({
  locale,
  profile,
}: {
  locale: Locale;
  profile: CurrentProfile;
}) {
  const dict = await getDictionary(locale);

  return (
    <header className="bg-background sticky top-0 z-40 flex h-14 items-center gap-1.5 border-b px-3 sm:gap-3 sm:px-4">
      <Link
        href={`/${locale}`}
        className="font-logo text-foreground flex shrink-0 items-center gap-1.5 text-[1.35rem] leading-none font-semibold tracking-tight sm:gap-2 sm:text-[1.6rem]"
      >
        <LogoMark className="size-7 shrink-0 sm:size-8" />
        <span className="text-primary">Lloguer</span>
      </Link>

      <div className="flex-1" />
      <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
        <Link href={`/${locale}/map`}>{dict.common.browseMap}</Link>
      </Button>
      <Button asChild size="sm">
        <Link href={`/${locale}/publish`} aria-label={dict.common.publish}>
          <Plus />
          <span className="hidden sm:inline">{dict.common.publish}</span>
        </Link>
      </Button>
      <LocaleSwitcher locale={locale} />
      {profile?.profile?.is_admin ? (
        <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
          <Link href={`/${locale}/admin/moderation`}>
            <ShieldCheck />
            {dict.common.moderation}
          </Link>
        </Button>
      ) : null}
      {profile ? (
        <UserMenu
          locale={locale}
          fullName={profile.profile?.full_name ?? null}
          avatarUrl={profile.profile?.avatar_url ?? null}
          isAdmin={profile.profile?.is_admin ?? false}
        />
      ) : null}
    </header>
  );
}
