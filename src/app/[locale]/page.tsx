import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  HandCoins,
  Hourglass,
  Mail,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  Timer,
  UserRoundX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingMapDemo } from "@/components/landing-map-demo";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { isLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
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
  const days = (s: string) => interpolate(s, { days: LISTING_TTL_DAYS });

  const sourceIcons = [Hourglass, MessagesSquare, Megaphone];
  const trust = [
    { icon: UserRoundX, title: l.t1Title, body: l.t1Body },
    { icon: ShieldCheck, title: l.t2Title, body: l.t2Body },
    { icon: Timer, title: days(l.t3Title), body: days(l.t3Body) },
    { icon: HandCoins, title: l.t4Title, body: l.t4Body },
  ];
  const tracks = [
    {
      title: l.howSearchTitle,
      steps: l.howSearchSteps,
      href: `/${locale}/map`,
      cta: l.ctaBrowse,
    },
    {
      title: l.howPostTitle,
      steps: l.howPostSteps,
      href: `/${locale}/publish`,
      cta: l.ctaPublish,
    },
  ];

  return (
    <main className="flex-1">
      <section className="border-b px-4 py-14 sm:py-20">
        <div className="mx-auto grid w-full max-w-[1120px] items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <a
              href={HUB_SITE_URL}
              target="_blank"
              rel="noopener"
              className="group inline-flex items-center gap-3"
            >
              <Image
                src="/global-shapers-valencia.png"
                alt=""
                width={231}
                height={200}
                priority
                className="h-16 w-auto shrink-0 sm:h-[4.5rem]"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-muted-foreground text-[0.68rem] font-semibold tracking-[0.16em] text-balance uppercase">
                  {f.initiative.before}
                </span>
                <span className="text-brand text-sm font-semibold underline decoration-1 underline-offset-4 group-hover:decoration-2">
                  {f.initiative.hub}
                </span>
              </span>
            </a>
            <p className="text-brand mt-8 text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
              {l.kicker}
            </p>
            <h1 className="font-display mt-3 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-[3.4rem]">
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
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              {l.heroPoints.map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5">
                  <Check className="text-brand size-4" aria-hidden />
                  {days(point)}
                </li>
              ))}
            </ul>
          </div>
          <figure>
            <LandingMapDemo
              labels={{
                perMonth: dict.listing.perMonth,
                billsIncluded: dict.listing.billsIncluded,
                billsNotIncluded: dict.listing.billsNotIncluded,
                flatmates: dict.listing.flatmates,
                room: dict.listing.typeRoom,
                double: dict.listing.roomDouble,
                single: dict.listing.roomSingle,
                filters: l.demoFilters,
                reviewed: l.demoReviewed,
                expires: days(l.demoExpires),
                storyUser: l.demoStoryUser,
                storyAge: l.demoStoryAge,
                storyText: l.demoStoryText,
                storyMore: l.demoStoryMore,
                storyMention: l.demoStoryMention,
                flyerUser: l.demoFlyerUser,
                flyerAge: l.demoFlyerAge,
                flyerTitle1: l.demoFlyerTitle1,
                flyerTitle2: l.demoFlyerTitle2,
                flyerPlace: l.demoFlyerPlace,
                flyerDate: l.demoFlyerDate,
                flyerPeople: l.demoFlyerPeople,
                flyerCta: l.demoFlyerCta,
                group: l.demoGroup,
                sender: l.demoSender,
                post: l.demoPost1,
              }}
            />
            <figcaption className="text-muted-foreground mt-3 text-sm">
              {l.demoCaption}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b px-4 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={1}>{l.whatTitle}</SectionEyebrow>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h2 className="font-display max-w-2xl text-3xl leading-snug sm:text-[2.1rem]">
                {l.whatLead}
              </h2>
              <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed">
                {l.whatBody}
              </p>
            </div>
            <ul className="grid content-start gap-5">
              {l.sources.map((source, i) => {
                const Icon = sourceIcons[i] ?? MessagesSquare;
                return (
                  <li key={source.title} className="flex gap-4 border-t pt-5">
                    <Icon
                      className="text-muted-foreground mt-0.5 size-5 shrink-0"
                      aria-hidden
                    />
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        {source.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {source.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="font-display border-primary mt-12 max-w-3xl border-l-2 pl-5 text-2xl leading-snug">
            {l.solutionBody}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="bg-card rounded-md border p-6">
              <h3 className="text-brand font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
                {l.isTitle}
              </h3>
              <ul className="mt-4 grid gap-3">
                {l.isItems.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <Check
                      className="text-brand mt-1 size-4 shrink-0"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border p-6">
              <h3 className="text-muted-foreground font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
                {l.isNotTitle}
              </h3>
              <ul className="mt-4 grid gap-3">
                {l.isNotItems.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex gap-3 leading-relaxed"
                  >
                    <X className="mt-1 size-4 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b px-4 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={2}>{l.trustTitle}</SectionEyebrow>
          <h2 className="font-display mt-5 max-w-2xl text-3xl leading-snug sm:text-[2.1rem]">
            {l.trustLead}
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t pt-5">
                <Icon className="text-brand size-5" aria-hidden />
                <h3 className="font-display mt-3 text-lg font-semibold">
                  {title}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b px-4 py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[1120px]">
          <SectionEyebrow index={3}>{l.howTitle}</SectionEyebrow>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {tracks.map((track) => (
              <div
                key={track.title}
                className="bg-card flex flex-col rounded-md border p-6"
              >
                <h3 className="font-display text-2xl font-semibold">
                  {track.title}
                </h3>
                <ol className="mt-5 grid flex-1 content-start gap-4">
                  {track.steps.map((step, i) => (
                    <li key={step} className="flex gap-4">
                      <span className="text-primary font-display text-xl leading-none tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">
                        {days(step)}
                      </span>
                    </li>
                  ))}
                </ol>
                <Button asChild variant="outline" className="mt-6 self-start">
                  <Link href={track.href}>
                    {track.cta}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
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
