import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail, ShieldCheck, Timer, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { HUB_SITE_URL } from "@/lib/brand";
import { LISTING_TTL_DAYS } from "@/lib/constants";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const l = dict.landing;
  const f = dict.footer;

  const trust = [
    { icon: UserRoundX, title: l.t1Title, body: l.t1Body },
    { icon: ShieldCheck, title: l.t2Title, body: l.t2Body },
    {
      icon: Timer,
      title: l.t3Title,
      body: l.t3Body.replace("{days}", String(LISTING_TTL_DAYS)),
    },
  ];
  const filters = [
    { title: l.fNeighborhood, body: l.fNeighborhoodBody },
    { title: l.fPrice, body: l.fPriceBody },
    { title: l.fFlatmates, body: l.fFlatmatesBody },
    { title: l.fGender, body: l.fGenderBody },
  ];
  const steps = [
    { title: l.s1Title, body: l.s1Body },
    { title: l.s2Title, body: l.s2Body },
    { title: l.s3Title, body: l.s3Body },
  ];

  return (
    <main className="flex-1">
      <section className="border-b px-4 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1120px]">
          <p className="text-brand text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
            {f.initiative.before}{" "}
            <a
              href={HUB_SITE_URL}
              target="_blank"
              rel="noopener"
              className="underline-offset-4 hover:underline"
            >
              {f.initiative.hub}
            </a>
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-6xl">
            {l.title}
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed">
            {l.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/${locale}/map`}>
                {l.ctaBrowse}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/${locale}/publish`}>{l.ctaPublish}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b px-4 py-10">
        <ul className="mx-auto grid w-full max-w-[1120px] gap-8 sm:grid-cols-3">
          {trust.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Icon className="text-brand size-5" aria-hidden />
              <h3 className="font-display mt-3 text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-b px-4 py-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={1}>{l.problemTitle}</SectionEyebrow>
          <p className="text-muted-foreground mt-4 max-w-3xl text-lg leading-relaxed">
            {l.problemBody}
          </p>
          <p className="font-display mt-4 max-w-3xl text-2xl leading-snug">{l.solutionBody}</p>
        </div>
      </section>

      <section className="border-b px-4 py-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={2}>{l.filtersTitle}</SectionEyebrow>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            {l.filtersIntro}
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((item) => (
              <li key={item.title} className="border-t pt-4">
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b px-4 py-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={3}>{l.howTitle}</SectionEyebrow>
          <ol className="mt-6 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="text-primary font-display text-3xl tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={4}>{l.partnersTitle}</SectionEyebrow>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            {l.partnersBody}
          </p>
          <Button asChild variant="brand" className="mt-6">
            <a href={`mailto:${f.contactEmail}`}>
              <Mail />
              {l.partnersCta}
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
