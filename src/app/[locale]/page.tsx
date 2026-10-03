import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Map, ShieldCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
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

  const features = [
    { icon: Map, title: l.f1Title, body: l.f1Body },
    { icon: UserRoundX, title: l.f2Title, body: l.f2Body },
    {
      icon: ShieldCheck,
      title: l.f3Title,
      body: l.f3Body.replace("{days}", String(LISTING_TTL_DAYS)),
    },
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
            {l.eyebrow}
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

      <section className="border-b px-4 py-14">
        <div className="mx-auto grid w-full max-w-[1120px] gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <SectionEyebrow index={1}>{l.whatTitle}</SectionEyebrow>
            <p className="font-display mt-4 text-2xl leading-snug">{l.whatBody}</p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t pt-4">
                <Icon className="text-brand size-5" aria-hidden />
                <h3 className="font-display mt-3 text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b px-4 py-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={2}>{l.howTitle}</SectionEyebrow>
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
          <SectionEyebrow index={3}>{l.nonprofitTitle}</SectionEyebrow>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            {l.nonprofitBody}
          </p>
        </div>
      </section>
    </main>
  );
}
