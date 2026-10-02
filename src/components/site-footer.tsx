import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { HUB_INSTAGRAM_URL, HUB_LINKEDIN_URL, HUB_SITE_URL } from "@/lib/brand";

const linkClass = "text-white/75 transition-colors hover:text-white";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const dict = await getDictionary(locale);
  const f = dict.footer;

  return (
    <footer className="bg-brand-deep pt-14 text-white/75">
      <div className="mx-auto grid w-[min(100%-44px,1120px)] gap-10 md:grid-cols-[1.5fr_0.75fr_1fr]">
        <div>
          <a href={HUB_SITE_URL} target="_blank" rel="noopener" aria-label={f.hubSite}>
            <Image
              src="/brand/gs-logo-white.png"
              alt="Global Shapers Community Valencia"
              width={90}
              height={78}
              className="mb-5 h-[78px] w-auto opacity-90"
            />
          </a>
          <p className="max-w-[42ch] text-sm leading-7">{f.about}</p>
        </div>

        <nav aria-label={f.exploreTitle}>
          <h4 className="mb-4 font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-white uppercase">
            {f.exploreTitle}
          </h4>
          <ul className="grid gap-2.5 text-sm">
            <li>
              <Link href={`/${locale}`} className={linkClass}>
                {dict.common.siteName}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/publish`} className={linkClass}>
                {f.publish}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/legal`} className={linkClass}>
                {dict.common.legal}
              </Link>
            </li>
            <li>
              <a href={HUB_SITE_URL} target="_blank" rel="noopener" className={linkClass}>
                {f.hubSite}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h4 className="mb-4 font-sans text-[0.72rem] font-semibold tracking-[0.14em] text-white uppercase">
            {f.contactTitle}
          </h4>
          <ul className="grid gap-2.5 text-sm">
            <li>
              <a href={`mailto:${f.contactEmail}`} className={linkClass}>
                {f.contactEmail}
              </a>
            </li>
            <li>{f.contactCity}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto w-[min(100%-44px,1120px)]">
        <p className="mt-12 max-w-[72ch] border-t border-white/15 pt-6 text-[0.78rem] leading-7 text-white/50">
          {f.membershipNote}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 py-5 text-[0.78rem] text-white/50">
          <span>
            © {new Date().getFullYear()} {f.rights}
          </span>
          <span className="flex items-center gap-4">
            <a
              href={HUB_INSTAGRAM_URL}
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              className={linkClass}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </a>
            <a
              href={HUB_LINKEDIN_URL}
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn"
              className={linkClass}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="7.5" y1="10" x2="7.5" y2="17" />
                <circle cx="7.5" cy="6.8" r="1" />
                <path d="M11.5 17v-4.2c0-1.6 1-2.6 2.4-2.6 1.3 0 2.1.9 2.1 2.6V17" />
              </svg>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
