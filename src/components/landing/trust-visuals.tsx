import { BadgeCheck, KeyRound, X } from "lucide-react";

/**
 * Small looping illustrations for the trust cards on the landing page. They are
 * decorative and only start once their card scrolls into view (`.v-anim` and the
 * `v*-` keyframes in globals.css).
 */

/** No signup: the account form gets struck out and a private link arrives instead. */
export function NoSignupVisual({
  account,
  password,
  link,
}: {
  account: string;
  password: string;
  link: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col items-center justify-center gap-2.5 px-6"
    >
      <div className="v-anim v1-dim flex gap-2">
        <span className="relative rounded-[3px] border bg-white px-3 py-1.5 text-xs">
          {password} ••••••
          <span className="v-anim v1-strike bg-foreground/70 absolute inset-x-1 top-1/2 h-px" />
        </span>
        <span className="bg-secondary relative rounded-[3px] px-3 py-1.5 text-xs font-semibold">
          {account}
          <span className="v-anim v1-strike bg-foreground/70 absolute inset-x-1 top-1/2 h-px" />
        </span>
      </div>
      <div className="v-anim v1-link border-brand/30 text-brand flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold">
        <KeyRound className="size-3.5" />
        {link}
        <span className="text-muted-foreground font-mono font-normal">
          /manage/
          <span className="v-anim v1-type inline-block overflow-hidden align-bottom whitespace-nowrap">
            a8Fk2qZx9T
          </span>
        </span>
      </div>
    </div>
  );
}

/** Reviewed by hand: a scan passes, the spam is rejected, the real room approved. */
export function ReviewVisual({
  spam,
  real,
  approved,
  rejected,
}: {
  spam: string;
  real: string;
  approved: string;
  rejected: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full flex-col justify-center gap-2 overflow-hidden px-6"
    >
      <div className="v-anim v2-spam relative flex items-center justify-between gap-3 rounded-[3px] border bg-white px-3 py-2 text-xs">
        <span className="truncate">{spam}</span>
        <span className="v-anim v2-stamp text-destructive border-destructive/50 inline-flex shrink-0 items-center gap-1 rounded-[3px] border px-1.5 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase">
          <X className="size-3" />
          {rejected}
        </span>
      </div>
      <div className="relative flex items-center justify-between gap-3 rounded-[3px] border bg-white px-3 py-2 text-xs">
        <span className="truncate font-medium">{real}</span>
        <span className="v-anim v2-ok text-brand inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-semibold">
          <BadgeCheck className="size-3.5" />
          {approved}
        </span>
      </div>
      <span className="v-anim v2-scan bg-brand/10 border-brand/40 absolute inset-y-3 w-10 border-r" />
    </div>
  );
}

/** Deleted after N days: a countdown and a draining bar, then the listing is gone. */
export function CountdownVisual({
  days,
  left,
  gone,
}: {
  days: number;
  left: string;
  gone: string;
}) {
  const numbers = Array.from({ length: days }, (_, i) => days - i);
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col justify-center gap-3 px-6"
    >
      <div className="flex items-end gap-3">
        <span className="font-display relative grid h-[3.5rem] w-[4.5rem] text-[3.5rem] leading-none font-semibold tabular-nums">
          {numbers.map((n, i) => (
            <span
              key={n}
              className="v-anim v3-tick col-start-1 row-start-1"
              style={{ animationDelay: `${i}s` }}
            >
              {n}
            </span>
          ))}
          <span className="v-anim v3-zero col-start-1 row-start-1">0</span>
        </span>
        <span className="relative mb-1.5 grid text-sm">
          <span className="v-anim v3-left text-muted-foreground col-start-1 row-start-1">
            {left}
          </span>
          <span className="v-anim v3-gone text-foreground col-start-1 row-start-1 font-semibold">
            {gone}
          </span>
        </span>
      </div>
      <div className="bg-secondary relative h-2.5 overflow-hidden rounded-full">
        <span className="v-anim v3-bar bg-brand absolute inset-y-0 left-0 rounded-full" />
        <span className="v3-ticks absolute inset-0" />
      </div>
    </div>
  );
}

/** Free: zero euros, and the usual paid extras struck through one by one. */
export function FreeVisual({ items }: { items: string[] }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col items-center justify-center gap-3 px-6"
    >
      <span className="font-display text-brand text-[3.5rem] leading-none font-semibold">
        0 €
      </span>
      <div className="flex flex-wrap justify-center gap-1.5">
        {items.map((item, i) => (
          <span
            key={item}
            className="text-muted-foreground relative rounded-full border bg-white px-2.5 py-0.5 text-[0.7rem]"
          >
            {item}
            <span
              className="v-anim v4-strike bg-foreground/60 absolute inset-x-2 top-1/2 h-px"
              style={{ animationDelay: `${0.5 + i * 0.35}s` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
