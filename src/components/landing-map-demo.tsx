import { ChevronDown, Minus, Plus, Receipt, Users } from "lucide-react";

type Tone = "blue" | "orange" | "gold";

type Pin = {
  x: number;
  y: number;
  /** Seconds into the 12 s loop at which this listing takes its turn. */
  delay: number;
  place: string;
  roomType: string;
  price: number;
  flatmates: number;
  tone: Tone;
};

type Labels = {
  perMonth: string;
  billsIncluded: string;
  /** Contains a {count} placeholder. */
  flatmates: string;
  room: string;
  double: string;
  single: string;
  filters: [string, string, string, string];
};

/** Stylised basemap palette, tuned to the paper ground and brand blue. */
const GROUND = "#f3eee3";
const BLOCK = "#e9e2d1";
const CASING = "#ded6c2";
const ROAD = "#fffdf8";
const WATER = "#cfdeed";
const PARK = "#dfe6cd";

/**
 * Other listings on the map: they only pop in. They sit in the bands the cards never
 * cover (top and bottom), so a card never hides half of one.
 */
const QUIET_PILLS: ReadonlyArray<[number, number, number]> = [
  [20, 18, 420],
  [76, 18, 510],
  [30, 92, 395],
  [72, 92, 360],
];
const QUIET_CLUSTERS: ReadonlyArray<[number, number, string]> = [
  [10, 80, "12"],
  [90, 78, "7"],
];

const TONES: Record<Tone, { wall: string; accent: string }> = {
  blue: { wall: "#cfdeed", accent: "#054985" },
  orange: { wall: "#f6d9c8", accent: "#d6521d" },
  gold: { wall: "#f4e5bd", accent: "#b88a1c" },
};

function RoomThumb({ tone }: { tone: Tone }) {
  const { wall, accent } = TONES[tone];
  return (
    <svg viewBox="0 0 56 56" className="size-full">
      <rect width="56" height="56" fill={wall} />
      <rect y="40" width="56" height="16" fill="#000" opacity="0.07" />
      <rect x="31" y="9" width="17" height="21" rx="1" fill="#fffdf8" />
      <path d="M39.5 9v21M31 19.5h17" stroke={wall} strokeWidth="1.5" />
      <rect x="6" y="31" width="30" height="13" rx="2" fill="#fffdf8" />
      <rect
        x="6"
        y="36"
        width="30"
        height="8"
        rx="2"
        fill={accent}
        opacity="0.85"
      />
      <rect x="9" y="28" width="11" height="7" rx="2" fill="#fffdf8" />
      <rect x="9" y="44" width="2.5" height="5" fill={accent} opacity="0.6" />
      <rect
        x="30.5"
        y="44"
        width="2.5"
        height="5"
        fill={accent}
        opacity="0.6"
      />
    </svg>
  );
}

function BaseMap() {
  /** Roads are drawn twice (casing, then fill) so they read as outlined streets. */
  const roads: ReadonlyArray<[string, number]> = [
    ["M-10 255 L410 45", 9],
    ["M-10 118 C110 96 250 144 410 108", 8],
    ["M96 -10 V310", 6],
    ["M214 -10 L232 310", 6],
    ["M322 -10 L300 310", 5],
    ["M-10 62 H410", 3],
    ["M-10 190 H410", 3],
    ["M-10 282 H410", 3],
    ["M150 -10 L158 310", 3],
    ["M268 -10 L272 310", 3],
    ["M30 -10 V310", 3],
    ["M360 -10 V310", 3],
  ];

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
    >
      <rect width="400" height="300" fill={GROUND} />

      <path
        d="M246 8 h86 q10 0 10 10 v52 q0 10 -10 10 h-74 q-12 0 -12 -12 Z"
        fill={PARK}
      />
      <path d="M262 24 h54 M262 38 h44" stroke="#cfd9b6" strokeWidth="2" />

      <path
        d="M-10 222 C 80 184, 160 262, 252 212 S 380 160, 420 176"
        fill="none"
        stroke={WATER}
        strokeWidth="30"
        strokeLinecap="round"
      />

      <g fill={BLOCK}>
        <rect x="104" y="70" width="38" height="40" rx="2" />
        <rect x="104" y="126" width="38" height="52" rx="2" />
        <rect x="38" y="70" width="50" height="36" rx="2" />
        <rect x="38" y="198" width="50" height="30" rx="2" />
        <rect x="104" y="196" width="36" height="34" rx="2" />
        <rect x="164" y="70" width="38" height="34" rx="2" />
        <rect x="166" y="132" width="36" height="40" rx="2" />
        <rect x="236" y="130" width="24" height="40" rx="2" />
        <rect x="280" y="130" width="34" height="44" rx="2" />
        <rect x="334" y="70" width="20" height="38" rx="2" />
        <rect x="334" y="198" width="22" height="36" rx="2" />
        <rect x="166" y="236" width="34" height="36" rx="2" />
        <rect x="104" y="244" width="40" height="30" rx="2" />
        <rect x="280" y="238" width="30" height="34" rx="2" />
        <rect x="38" y="130" width="46" height="46" rx="2" />
      </g>

      <g fill="none" strokeLinecap="round">
        {roads.map(([d, w]) => (
          <path key={`c-${d}`} d={d} stroke={CASING} strokeWidth={w + 2} />
        ))}
        {roads.map(([d, w]) => (
          <path key={`r-${d}`} d={d} stroke={ROAD} strokeWidth={w} />
        ))}
      </g>
    </svg>
  );
}

function ListingCard({ pin, labels }: { pin: Pin; labels: Labels }) {
  return (
    <div
      className="demo-card bg-card absolute z-20 flex w-[min(16rem,74%)] gap-2.5 rounded-md border p-2 text-left shadow-[0_3px_8px_-3px_rgb(4_54_95/0.3)]"
      style={{
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        animationDelay: `${pin.delay}s`,
      }}
      data-first={pin.delay === 0 ? "" : undefined}
    >
      <div className="relative size-[3.75rem] shrink-0 overflow-hidden rounded-[3px]">
        <RoomThumb tone={pin.tone} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-primary text-[0.95rem] leading-tight font-bold tracking-tight whitespace-nowrap">
            {pin.price} {labels.perMonth}
          </span>
          <span className="bg-secondary rounded-[3px] px-1.5 py-px text-[0.55rem] font-bold tracking-[0.1em] uppercase">
            {labels.room}
          </span>
        </div>
        <p className="truncate text-xs font-medium">
          {pin.place} · {pin.roomType}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 text-[0.65rem] leading-snug">
          <span className="inline-flex items-center gap-1">
            <Users className="size-2.5" />
            {labels.flatmates.replace("{count}", String(pin.flatmates))}
          </span>
          <span className="inline-flex items-center gap-1">
            <Receipt className="size-2.5" />
            {labels.billsIncluded}
          </span>
        </div>
      </div>
      <span className="bg-card absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r border-b" />
    </div>
  );
}

/**
 * Looping illustration for the landing hero, built from the same pieces as the real map:
 * price pills and clusters on a basemap, and a listing card that opens on the active pill.
 * Pure CSS (see `.demo-*` in globals.css), decorative only.
 */
export function LandingMapDemo({ labels }: { labels: Labels }) {
  const pins: Pin[] = [
    {
      x: 37,
      y: 64,
      delay: 0,
      place: "Lavapiés",
      roomType: labels.double,
      price: 380,
      flatmates: 3,
      tone: "blue",
    },
    {
      x: 63,
      y: 60,
      delay: 4,
      place: "Poblenou",
      roomType: labels.single,
      price: 450,
      flatmates: 2,
      tone: "orange",
    },
    {
      x: 50,
      y: 80,
      delay: 8,
      place: "Ruzafa",
      roomType: labels.double,
      price: 340,
      flatmates: 4,
      tone: "gold",
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative aspect-[4/3] w-full overflow-hidden rounded-md border select-none"
    >
      <BaseMap />

      <div className="absolute top-2 left-2 flex gap-1">
        {labels.filters.map((f, i) => (
          <span
            key={f}
            className="bg-card text-foreground inline-flex items-center gap-0.5 rounded-[3px] border px-1.5 py-0.5 text-[0.6rem] font-medium sm:px-2 sm:text-[0.65rem]"
            style={
              i === 0
                ? { borderColor: "var(--brand)", color: "var(--brand)" }
                : undefined
            }
          >
            {f}
            <ChevronDown className="size-2.5 opacity-60" />
          </span>
        ))}
      </div>
      <div className="bg-card absolute top-2 right-2 flex flex-col overflow-hidden rounded-[3px] border">
        <Plus className="text-muted-foreground m-1 size-3" />
        <span className="border-t" />
        <Minus className="text-muted-foreground m-1 size-3" />
      </div>

      {QUIET_CLUSTERS.map(([x, y, count], i) => (
        <span
          key={count}
          className="demo-pop absolute z-10"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${0.1 + i * 0.12}s`,
          }}
        >
          <span className="map-cluster">{count}</span>
        </span>
      ))}

      {QUIET_PILLS.map(([x, y, price], i) => (
        <span
          key={price}
          className="demo-pop absolute z-10"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${0.25 + i * 0.1}s`,
          }}
        >
          <span className="map-price-pill">{price} €</span>
        </span>
      ))}

      {pins.map((p, i) => (
        <div key={p.place}>
          <span
            className="demo-pop absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${0.4 + i * 0.12}s`,
            }}
          >
            {[0, 0.45].map((offset) => (
              <span
                key={offset}
                className="demo-ring border-brand absolute inset-0 rounded-full border-2"
                style={{ animationDelay: `${p.delay + offset}s` }}
              />
            ))}
            <span
              className="demo-pill map-price-pill relative"
              style={{ animationDelay: `${p.delay}s` }}
              data-first={i === 0 ? "" : undefined}
            >
              {p.price} €
            </span>
          </span>
          <ListingCard pin={p} labels={labels} />
        </div>
      ))}
    </div>
  );
}
