import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const t = (key: string) => {
    const [a, b] = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((dict as any)[a]?.[b] as string) ?? key;
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur">
      <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
        My<span className="text-primary">Lloguer</span>
      </Link>
      <div className="flex-1" />
      <Button asChild size="sm">
        <Link href={`/${locale}/publish`}>
          <Plus />
          {t("common.publish")}
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
