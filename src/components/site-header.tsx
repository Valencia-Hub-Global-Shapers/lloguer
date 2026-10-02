import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/features/auth/components/user-menu";
import { getDictionary } from "@/i18n/get-dictionary";
import { HUB_SITE_URL } from "@/lib/brand";
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
        className="font-display text-foreground text-[1.65rem] leading-none tracking-tight"
      >
        My<span className="text-brand">Lloguer</span>
      </Link>

      <span aria-hidden className="bg-border hidden h-7 w-px sm:block" />
      <a
        href={HUB_SITE_URL}
        target="_blank"
        rel="noopener"
        aria-label={dict.footer.initiative}
        title={dict.footer.initiative}
        className="hidden sm:block"
      >
        <Image
          src="/brand/logo-valencia.png"
          alt="Global Shapers Community Valencia"
          width={42}
          height={36}
          priority
          className="h-9 w-auto"
        />
      </a>

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
