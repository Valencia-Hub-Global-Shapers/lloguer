import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { HUB_INSTAGRAM_URL, HUB_LINKEDIN_URL, HUB_SITE_URL } from "@/lib/brand";

const linkClass = "hover:text-foreground transition-colors";

/** Quiet credit line: the hub is named here, not repeated across the app. */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const dict = await getDictionary(locale);
  const f = dict.footer;

  return (
    <footer className="text-muted-foreground mt-auto border-t px-4 py-6 text-xs">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p>
          {f.madeIn}{" "}
          <a
            href={HUB_SITE_URL}
            target="_blank"
            rel="noopener"
            className="text-brand font-medium hover:underline"
          >
            {f.initiative.hub}
          </a>
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Footer">
          <Link href={`/${locale}/legal`} className={linkClass}>
            {dict.common.legal}
          </Link>
          <a href={`mailto:${f.contactEmail}`} className={linkClass}>
            {f.contactEmail}
          </a>
          <a href={HUB_INSTAGRAM_URL} target="_blank" rel="noopener" className={linkClass}>
            Instagram
          </a>
          <a href={HUB_LINKEDIN_URL} target="_blank" rel="noopener" className={linkClass}>
            LinkedIn
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-4 w-full max-w-[1120px] text-[0.7rem] leading-relaxed opacity-80">
        {f.membershipNote}
      </p>
    </footer>
  );
}
