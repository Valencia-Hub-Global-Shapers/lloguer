import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
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
import { AdMarquee } from "@/components/landing/ad-marquee";
import { LandingMapDemo } from "@/components/landing/map-demo";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { RotatingTitle } from "@/components/landing/rotating-title";
import { StoryDemo } from "@/components/landing/story-demo";
import {
  CountdownVisual,
  FreeVisual,
  NoSignupVisual,
  ReviewVisual,
} from "@/components/landing/trust-visuals";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { isLocale } from "@/i18n/config";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import { HUB_SITE_URL } from "@/lib/brand";
import { LISTING_TTL_DAYS } from "@/lib/constants";

/** Stagger delay for entrance animations (`.rise` and `[data-reveal]`). */
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

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
    {
      icon: UserRoundX,
      title: l.t1Title,
      body: l.t1Body,
      span: "md:col-span-3",
      visual: (
        <NoSignupVisual
          account={l.v1Account}
          password={l.v1Password}
          link={l.v1Link}
        />
      ),
    },
    {
      icon: ShieldCheck,
      title: l.t2Title,
      body: l.t2Body,
      span: "md:col-span-3",
      visual: (
        <ReviewVisual
          spam={l.v2Spam}
          real={l.v2Real}
          approved={l.v2Approved}
          rejected={l.v2Rejected}
        />
      ),
    },
    {
      icon: Timer,
      title: days(l.t3Title),
      body: days(l.t3Body),
      span: "md:col-span-4",
      visual: (
        <CountdownVisual
          days={LISTING_TTL_DAYS}
          left={l.v3Left}
          gone={l.v3Gone}
        />
      ),
    },
    {
      icon: HandCoins,
      title: l.t4Title,
      body: l.t4Body,
      span: "md:col-span-2",
      visual: <FreeVisual items={l.v4Items} />,
    },
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
    <main className="flex-1 overflow-x-clip">
      <RevealObserver />

      <section className="relative border-b px-4 py-14 sm:py-20">
        <div aria-hidden className="dot-grid hero-fade absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-[1120px] items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <a
              href={HUB_SITE_URL}
              target="_blank"
              rel="noopener"
              className="rise group inline-flex items-center gap-3"
              style={delay(0)}
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
            <p
              className="rise text-brand mt-8 inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.16em] uppercase"
              style={delay(40)}
            >
              <span className="live-dot" aria-hidden />
              {l.kicker}
            </p>
            <div className="mt-3">
              <RotatingTitle
                title={l.title}
                before={l.titleBefore}
                words={l.titleWords}
                after={l.titleAfter}
              />
            </div>
            <p
              className="rise text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed"
              style={delay(320)}
            >
              {l.subtitle}
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={delay(400)}>
              <Button asChild size="lg" className="group">
                <Link href={`/${locale}/map`}>
                  {l.ctaBrowse}
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-card">
                <Link href={`/${locale}/publish`}>{l.ctaPublish}</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              {l.heroPoints.map((point, i) => (
                <li
                  key={point}
                  className="rise inline-flex items-center gap-1.5"
                  style={delay(480 + i * 60)}
                >
                  <Check className="text-brand size-4" aria-hidden />
                  {days(point)}
                </li>
              ))}
            </ul>
          </div>

          <figure className="rise relative" style={delay(200)}>
            <div className="relative">
              <span
                aria-hidden
                className="border-brand/25 absolute -inset-2.5 rounded-md border border-dashed sm:-inset-3.5"
              />
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
              <span
                aria-hidden
                className="float-chip bg-card text-brand absolute -top-4 -left-3 z-50 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex"
              >
                <BadgeCheck className="size-3.5" />
                {l.t2Title}
              </span>
              <span
                aria-hidden
                className="float-chip bg-card absolute -right-3 -bottom-4 z-50 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex"
                style={{ animationDelay: "-2.5s" }}
              >
                <Timer className="text-brand size-3.5" />
                {days(l.t3Title)}
              </span>
            </div>
            <figcaption className="text-muted-foreground mt-6 text-sm">
              {l.demoCaption}
            </figcaption>
          </figure>
        </div>
      </section>

      <AdMarquee label={l.marqueeLabel} ads={l.marquee} />

      <section className="border-b px-4 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1120px]">
          <div data-reveal="">
            <SectionEyebrow index={1}>{l.whatTitle}</SectionEyebrow>
          </div>
          <div className="mt-6 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div data-reveal="" style={delay(80)}>
              <h2 className="font-display max-w-2xl text-3xl leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">
                {l.whatLead}
              </h2>
              <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed">
                {l.whatBody}
              </p>
            </div>
            <ul className="grid content-start gap-3">
              {l.sources.map((source, i) => {
                const Icon = sourceIcons[i] ?? MessagesSquare;
                return (
                  <li
                    key={source.title}
                    className="bg-card hover:border-brand/40 flex gap-4 rounded-md border p-5 transition-colors"
                    data-reveal=""
                    style={delay(140 + i * 110)}
                  >
                    <span className="bg-secondary text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-5" aria-hidden />
                    </span>
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

          <p
            className="font-display border-brand mt-16 max-w-3xl border-l-2 pl-6 text-2xl leading-snug sm:text-[1.9rem]"
            data-reveal=""
          >
            {l.solutionBody}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div
              className="bg-card rounded-md border p-6 sm:p-8"
              data-reveal=""
            >
              <h3 className="text-brand font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
                {l.isTitle}
              </h3>
              <ul className="mt-5 grid gap-3.5">
                {l.isItems.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="bg-brand mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-md border border-dashed p-6 sm:p-8"
              data-reveal=""
              style={delay(120)}
            >
              <h3 className="text-muted-foreground font-sans text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
                {l.isNotTitle}
              </h3>
              <ul className="mt-5 grid gap-3.5">
                {l.isNotItems.map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex gap-3 leading-relaxed"
                  >
                    <span className="bg-secondary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <X className="size-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 border-b px-4 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1120px]">
          <div data-reveal="">
            <SectionEyebrow index={2}>{l.trustTitle}</SectionEyebrow>
          </div>
          <h2
            className="font-display mt-6 max-w-2xl text-3xl leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]"
            data-reveal=""
            style={delay(80)}
          >
            {l.trustLead}
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-6">
            {trust.map(({ icon: Icon, title, body, span, visual }, i) => (
              <li
                key={title}
                className={`bg-card hover:border-brand/40 flex flex-col overflow-hidden rounded-md border transition-colors ${span}`}
                data-reveal=""
                style={delay((i % 2) * 120)}
              >
                <div className="dot-grid bg-background relative h-44 border-b">
                  {visual}
                </div>
                <div className="p-6">
                  <h3 className="font-display flex items-center gap-2 text-xl font-semibold">
                    <Icon className="text-brand size-5" aria-hidden />
                    {title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b px-4 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1120px]">
          <div data-reveal="">
            <SectionEyebrow index={3}>{l.howTitle}</SectionEyebrow>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {tracks.map((track, t) => (
              <div
                key={track.title}
                className="bg-card flex flex-col rounded-md border p-6 sm:p-8"
                data-reveal=""
                style={delay(t * 120)}
              >
                <h3 className="font-display text-2xl font-semibold">
                  {track.title}
                </h3>
                <ol className="steps mt-6 grid flex-1 content-start gap-5">
                  {track.steps.map((step, i) => (
                    <li key={step} className="relative flex gap-4">
                      <span className="border-brand/30 text-brand bg-card relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-1 leading-relaxed">
                        {days(step)}
                      </span>
                    </li>
                  ))}
                </ol>
                <Button
                  asChild
                  variant={t === 1 ? "default" : "outline"}
                  className="group mt-8 self-start"
                >
                  <Link href={track.href}>
                    {track.cta}
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 border-b px-4 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-[1120px] items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <div data-reveal="">
              <SectionEyebrow index={4}>{l.storyTitle}</SectionEyebrow>
            </div>
            <h2
              className="font-display mt-6 text-3xl leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]"
              data-reveal=""
              style={delay(80)}
            >
              {l.storyLead}
            </h2>
            <p
              className="text-muted-foreground mt-6 text-lg leading-relaxed"
              data-reveal=""
              style={delay(140)}
            >
              {l.storyBody}
            </p>
            <ul className="mt-8 grid gap-3.5">
              {l.storyPoints.map((point, i) => (
                <li
                  key={point}
                  className="flex gap-3 leading-relaxed"
                  data-reveal=""
                  style={delay(200 + i * 80)}
                >
                  <span className="bg-brand mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal="" style={delay(120)}>
            <StoryDemo locale={locale} />
          </div>
        </div>
      </section>

      <section className="bg-brand relative overflow-hidden px-4 py-16 text-white sm:py-24">
        <div className="dot-grid-light absolute inset-0" aria-hidden />
        <div
          className="relative mx-auto flex w-full max-w-[1120px] flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between"
          data-reveal=""
        >
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.025em] sm:text-[3.4rem]">
              {l.finalTitle}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              {l.finalBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="group">
              <Link href={`/${locale}/publish`}>
                {l.ctaPublish}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:border-white hover:text-white"
            >
              <Link href={`/${locale}/map`}>{l.ctaBrowse}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto w-full max-w-[1120px]" data-reveal="">
          <SectionEyebrow index={5}>{l.partnersTitle}</SectionEyebrow>
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
