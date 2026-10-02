import Link from "next/link";
import { Plus } from "lucide-react";
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
    <header className="bg-background sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4">
      <Link
        href={`/${locale}`}
        className="font-logo text-foreground flex items-center gap-2 text-[1.6rem] leading-none font-semibold tracking-tight"
      >
        <LogoMark className="size-8 shrink-0" />
        <span>
          My<span className="text-primary">Lloguer</span>
        </span>
      </Link>

      <div className="flex-1" />
      <Button asChild size="sm">
        <Link href={`/${locale}/publish`}>
          <Plus />
          {dict.common.publish}
        </Link>
      </Button>
      <LocaleSwitcher locale={locale} />
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
