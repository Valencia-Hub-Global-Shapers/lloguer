import { cn } from "@/lib/utils";

type Pin = {
  x: number;
  y: number;
  /** Seconds into the 12 s loop at which this listing takes its turn. */
  delay: number;
  place: string;
  type: string;
  price: number;
  flatmates: number;
};

type Labels = {
  perMonth: string;
  billsIncluded: string;
  /** Contains a {count} placeholder. */
  flatmates: string;
  room: string;
  double: string;
  single: string;
};

/** Decorative dots that never turn into cards, to make the map feel populated. */
const QUIET_PINS: ReadonlyArray<[number, number]> = [
  [14, 30],
  [82, 26],
  [24, 78],
  [84, 70],
  [46, 24],
];

/**
 * Tiny looping illustration for the landing hero: pings on a stylised map take
 * turns turning into sample listing cards. Pure CSS (see `.demo-*` in globals.css),
 * decorative only.
 */
export function LandingMapDemo({ labels }: { labels: Labels }) {
  const pins: Pin[] = [
    {
      x: 30,
      y: 62,
      delay: 0,
      place: "Lavapiés, Madrid",
      type: `${labels.room} ${labels.double}`,
      price: 380,
      flatmates: 3,
    },
    {
      x: 68,
      y: 56,
      delay: 4,
      place: "Poblenou, Barcelona",
      type: `${labels.room} ${labels.single}`,
      price: 450,
      flatmates: 2,
    },
    {
      x: 50,
      y: 80,
      delay: 8,
      place: "Ruzafa, València",
      type: `${labels.room} ${labels.double}`,
      price: 340,
      flatmates: 4,
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-md border"
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <rect
          x="262"
          y="26"
          width="92"
          height="62"
          rx="3"
          className="fill-brand/10"
        />
        <path
          d="M-10 215 C 90 175, 170 250, 260 205 S 390 150, 420 170"
          fill="none"
          strokeWidth="26"
          className="stroke-brand/10"
        />
        <g
          stroke="var(--border)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M0 70 H400 M0 150 H400 M0 250 H400" />
          <path d="M80 0 V300 M190 0 V300 M310 0 V300" />
          <path d="M0 20 L130 300 M230 0 L400 210" strokeWidth="3" />
        </g>
      </svg>

      {QUIET_PINS.map(([x, y]) => (
        <span
          key={`${x}-${y}`}
          className="bg-brand/70 absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}

      {pins.map((p, i) => (
        <div key={p.place}>
          <span
            className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span
              className="demo-ping bg-brand absolute inset-0 rounded-full"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
            <span
              className="demo-pin bg-brand absolute inset-0 rounded-full ring-2 ring-white"
              style={{ animationDelay: `${p.delay}s` }}
            />
          </span>

          <div
            data-first={i === 0 ? "" : undefined}
            className={cn(
              "demo-card bg-card absolute w-48 rounded-md border p-2.5 text-left",
              "shadow-[0_6px_18px_-8px_rgb(27_26_23/0.35)]",
            )}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-primary text-base font-semibold whitespace-nowrap tabular-nums">
                {p.price} {labels.perMonth}
              </span>
            </div>
            <p className="font-display mt-0.5 text-sm font-semibold">
              {p.place}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[0.7rem] leading-snug">
              {p.type}
              {" · "}
              {labels.flatmates.replace("{count}", String(p.flatmates))}
              {" · "}
              {labels.billsIncluded}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
