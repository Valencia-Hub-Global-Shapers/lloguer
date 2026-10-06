"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SHORT_LABELS: Record<Locale, string> = { es: "ES", va: "VAL", en: "EN", pt: "PT" };

/** Language dropdown: shows the current language code and lists every locale. */
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const pathWithoutLocale = pathname.replace(/^\/(es|va|en|pt)/, "") || "/";
  const qs = searchParams.toString();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.language")}
        className="text-foreground hover:bg-accent flex items-center gap-1 rounded-sm px-2 py-1.5 text-[0.72rem] font-semibold tracking-[0.09em] outline-none transition-colors"
      >
        {SHORT_LABELS[locale]}
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link
              href={`/${l}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}${qs ? `?${qs}` : ""}`}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              className="justify-between"
            >
              {localeLabels[l]}
              {l === locale ? <Check aria-hidden /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
