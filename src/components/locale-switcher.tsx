"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Compact ES | VAL | EN switch, as on the Global Shapers Valencia site. */
const SHORT_LABELS: Record<Locale, string> = { es: "ES", va: "VAL", en: "EN" };

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const pathWithoutLocale = pathname.replace(/^\/(es|va|en)/, "") || "/";
  const qs = searchParams.toString();

  return (
    <div role="group" aria-label={t("common.language")} className="flex items-center">
      {locales.map((l, i) => (
        <Link
          key={l}
          href={`/${l}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}${qs ? `?${qs}` : ""}`}
          hrefLang={l}
          title={localeLabels[l]}
          aria-current={l === locale ? "true" : undefined}
          className={cn(
            "px-1.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.09em] transition-colors sm:px-2",
            i > 0 && "border-input border-l",
            l === locale ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {SHORT_LABELS[l]}
        </Link>
      ))}
    </div>
  );
}
