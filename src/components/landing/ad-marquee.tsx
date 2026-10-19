import { MessageCircle, Send, StickyNote } from "lucide-react";

type Ad = { src: string; text: string };

/** Small badge naming where an ad like this one usually gets posted. */
function SourceBadge({ src }: { src: string }) {
  if (src === "story") {
    return (
      <span className="size-5 shrink-0 rounded-full bg-[conic-gradient(#e3b23c,#d6521d,#a8456f,#e3b23c)] p-[2px]">
        <span className="bg-card block size-full rounded-full" />
      </span>
    );
  }
  const Icon =
    src === "whatsapp" ? MessageCircle : src === "telegram" ? Send : StickyNote;
  const color =
    src === "whatsapp"
      ? "text-[#1f8a4c]"
      : src === "telegram"
        ? "text-[#2a8bc4]"
        : "text-gold";
  return <Icon className={`size-4 shrink-0 ${color}`} aria-hidden />;
}

function Row({ ads, reverse }: { ads: Ad[]; reverse?: boolean }) {
  return (
    <div className="marquee">
      <ul className="marquee-track" data-reverse={reverse ? "" : undefined}>
        {[0, 1].map((copy) =>
          ads.map((ad) => (
            <li
              key={`${copy}-${ad.text}`}
              aria-hidden={copy === 1 ? true : undefined}
              className="bg-card flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2 text-sm whitespace-nowrap"
            >
              <SourceBadge src={ad.src} />
              {ad.text}
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

/**
 * Two rows of the kind of ads Lloguer gathers, scrolling in opposite directions. Pure
 * CSS (`.marquee` in globals.css); it stops on hover and when motion is reduced.
 */
export function AdMarquee({ label, ads }: { label: string; ads: Ad[] }) {
  const half = Math.ceil(ads.length / 2);
  return (
    <section className="border-b py-10">
      <p className="text-muted-foreground px-4 text-center text-[0.72rem] font-semibold tracking-[0.16em] uppercase">
        {label}
      </p>
      <div className="mt-6 grid gap-3">
        <Row ads={ads.slice(0, half)} />
        <Row ads={ads.slice(half)} reverse />
      </div>
    </section>
  );
}
