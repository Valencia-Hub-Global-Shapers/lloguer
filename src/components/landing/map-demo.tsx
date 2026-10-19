import {
  BadgeCheck,
  ChevronDown,
  Minus,
  Plus,
  Receipt,
  Users,
} from "lucide-react";

type Tone = "blue" | "orange" | "gold";

/** Where the listing was first posted, before it reached Lloguer. */
type Source = "story" | "flyer" | "whatsapp";

type Pin = {
  x: number;
  y: number;
  /** Seconds into the 18 s loop at which this listing takes its turn. */
  delay: number;
  source: Source;
  place: string;
  roomType: string;
  price: number;
  flatmates: number;
  billsIncluded: boolean;
  tone: Tone;
};

export type LandingDemoLabels = {
  perMonth: string;
  billsIncluded: string;
  billsNotIncluded: string;
  /** Contains a {count} placeholder. */
  flatmates: string;
  room: string;
  double: string;
  single: string;
  filters: string[];
  reviewed: string;
  expires: string;
  storyUser: string;
  storyAge: string;
  storyText: string;
  storyMore: string;
  storyMention: string;
  flyerUser: string;
  flyerAge: string;
  flyerTitle1: string;
  flyerTitle2: string;
  flyerPlace: string;
  flyerDate: string;
  flyerPeople: string;
  flyerCta: string;
  group: string;
  sender: string;
  post: string;
};

/** Stylised basemap palette, tuned to the paper ground and brand blue. */
const GROUND = "#f3eee3";
const BLOCK = "#e9e2d1";
const CASING = "#ded6c2";
const ROAD = "#fffdf8";
const WATER = "#cfdeed";
const PARK = "#dfe6cd";

/**
 * Posts start centred in the demo and fly into their pin. Positions are in % of the
 * demo box; the flight is in container units (the box is 4:3, so 1% of its height is
 * 0.75cqw).
 */
const POST_X = 50;
const POST_Y = 50;

/**
 * Other listings on the map: they only pop in. They sit in the bands the cards never
 * cover (top and bottom), so a card never hides half of one.
 */
const QUIET_PILLS: ReadonlyArray<[number, number, number]> = [
  [20, 18, 420],
  [76, 18, 510],
  [30, 92, 395],
  [74, 92, 360],
];
const QUIET_CLUSTERS: ReadonlyArray<[number, number, string]> = [
  [10, 80, "12"],
  [90, 76, "7"],
];

const TONES: Record<Tone, { wall: string; accent: string }> = {
  blue: { wall: "#cfdeed", accent: "#054985" },
  orange: { wall: "#f6d9c8", accent: "#d6521d" },
  gold: { wall: "#f4e5bd", accent: "#b88a1c" },
};

function RoomThumb({ tone }: { tone: Tone }) {
  const { wall, accent } = TONES[tone];
  return (
    <svg
      viewBox="0 0 56 56"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
    >
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

/** Progress bars and poster line shared by both story mock-ups. */
function StoryHeader({
  user,
  age,
  delay,
  dark,
}: {
  user: string;
  age: string;
  delay: number;
  dark?: boolean;
}) {
  const ink = dark ? "text-[#1b1a17]" : "text-white";
  const track = dark ? "bg-black/15" : "bg-white/45";
  return (
    <div className="absolute inset-x-0 top-0 z-10 px-[1.4cqw] pt-[1.4cqw]">
      <div className="flex gap-[0.6cqw]">
        <span className={`h-[0.45cqw] flex-1 rounded-full ${track}`}>
          <span
            className={`demo-progress block h-full rounded-full ${dark ? "bg-[#1b1a17]" : "bg-white"}`}
            style={{ animationDelay: `${delay}s` }}
          />
        </span>
        <span className={`h-[0.45cqw] flex-1 rounded-full ${track}`} />
      </div>
      <div
        className={`mt-[1.2cqw] flex items-center gap-[1cqw] text-[max(7px,1.9cqw)] font-semibold ${ink}`}
      >
        <span className="size-[3.6cqw] shrink-0 rounded-full border border-white bg-[linear-gradient(135deg,#e3b23c,#d6521d)]" />
        <span className="truncate">{user}</span>
        <span className="font-normal opacity-70">{age}</span>
      </div>
    </div>
  );
}

/** An Instagram-style story: a street photo at sunset with the ad typed on top. */
function StoryPost({
  labels,
  delay,
}: {
  labels: LandingDemoLabels;
  delay: number;
}) {
  return (
    <div className="relative h-[60cqw] w-[34cqw] overflow-hidden rounded-[1.2cqw] bg-[linear-gradient(180deg,#b7b6cf_0%,#e3b3b4_42%,#f3a477_70%,#f0915e_100%)] shadow-[0_8px_24px_-8px_rgb(27_26_23/0.45)]">
      <svg
        viewBox="0 0 100 176"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
      >
        <path d="M0 70 h16 v-8 h10 v114 H0 Z" fill="#7a5a52" />
        <path d="M74 56 h12 v-6 h14 v126 H74 Z" fill="#8a6a5c" />
        <path d="M46 132 l4 -22 l4 22 Z M44 132 h12 v14 H44 Z" fill="#6d5a63" />
        <ellipse cx="14" cy="128" rx="20" ry="24" fill="#3f5a3a" />
        <ellipse cx="88" cy="132" rx="18" ry="22" fill="#3c5537" />
        <path d="M80 92 v84" stroke="#2a2a2a" strokeWidth="1.6" />
        <path d="M76 92 h8 l-1 6 h-6 Z" fill="#2a2a2a" />
        <path d="M0 150 L36 140 h28 L100 152 V176 H0 Z" fill="#4b4a4f" />
        <rect x="14" y="152" width="16" height="9" rx="2.5" fill="#2e2e33" />
        <rect x="62" y="150" width="15" height="8" rx="2.5" fill="#d9d9de" />
      </svg>
      <StoryHeader
        user={labels.storyUser}
        age={labels.storyAge}
        delay={delay}
      />
      <div className="absolute inset-x-[2cqw] top-[12cqw] flex flex-col items-center gap-[2cqw] text-center">
        <p className="text-[max(8px,2.5cqw)] leading-tight font-bold text-balance text-[#1b1a17]">
          {labels.storyText}
        </p>
        <p className="text-[max(8px,2.3cqw)] font-bold text-[#1b1a17]">
          {labels.storyMore}
        </p>
        <span className="rounded-[1cqw] bg-white px-[1.8cqw] py-[0.9cqw] text-[max(7px,2.1cqw)] font-medium text-[#1b1a17] underline underline-offset-2">
          {labels.storyMention}
        </span>
      </div>
    </div>
  );
}

/** The other classic: a home-made "room for rent" flyer shared as a story. */
function FlyerPost({
  labels,
  delay,
}: {
  labels: LandingDemoLabels;
  delay: number;
}) {
  const photos: Tone[] = ["blue", "gold", "orange", "blue", "gold"];
  return (
    <div className="relative h-[60cqw] w-[34cqw] overflow-hidden rounded-[1.2cqw] bg-[#e7e3db] shadow-[0_8px_24px_-8px_rgb(27_26_23/0.45)]">
      <StoryHeader
        user={labels.flyerUser}
        age={labels.flyerAge}
        delay={delay}
        dark
      />
      <div className="absolute inset-x-[2cqw] top-[8.5cqw] bottom-[2.5cqw] flex flex-col items-center gap-[1.2cqw] rounded-[0.6cqw] bg-[#fbf5ea] px-[1.6cqw] py-[2cqw] text-center">
        <p className="font-sans text-[max(9px,3.6cqw)] leading-[0.95] font-extrabold tracking-tight">
          <span className="text-brand block">{labels.flyerTitle1}</span>
          <span className="text-primary block">{labels.flyerTitle2}</span>
        </p>
        <span className="text-brand w-full rounded-[0.8cqw] bg-[#f6dcc8] px-[1cqw] py-[0.6cqw] text-[max(6px,1.6cqw)] leading-tight font-semibold">
          {labels.flyerPlace}
        </span>
        <div className="grid min-h-0 w-full flex-1 grid-cols-6 grid-rows-[3fr_2fr] gap-[0.6cqw]">
          {photos.map((tone, i) => (
            <span
              key={i}
              className={`min-h-0 overflow-hidden rounded-[0.5cqw] ${i < 2 ? "col-span-3" : "col-span-2"}`}
            >
              <RoomThumb tone={tone} />
            </span>
          ))}
        </div>
        <span className="bg-brand w-full rounded-[0.8cqw] px-[1cqw] py-[0.5cqw] text-[max(6px,1.55cqw)] leading-tight font-semibold text-white">
          {labels.flyerDate}
        </span>
        <span className="bg-primary w-full rounded-[0.8cqw] px-[1cqw] py-[0.5cqw] text-[max(6px,1.55cqw)] leading-tight font-semibold text-white">
          {labels.flyerPeople}
        </span>
        <span className="text-brand text-[max(7px,1.9cqw)] font-extrabold">
          {labels.flyerCta}
        </span>
      </div>
    </div>
  );
}

/** A message lost in a busy WhatsApp group. */
function WhatsappPost({ labels }: { labels: LandingDemoLabels }) {
  return (
    <div className="w-[60cqw] overflow-hidden rounded-[1.2cqw] bg-[#efe7dc] text-left shadow-[0_8px_24px_-8px_rgb(27_26_23/0.45)]">
      <div className="flex items-center gap-[1.4cqw] bg-[#1f6f5c] px-[2cqw] py-[1.4cqw] text-white">
        <span className="flex size-[5cqw] shrink-0 items-center justify-center rounded-full bg-white/20 text-[max(8px,2.4cqw)]">
          🏠
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[max(8px,2.3cqw)] font-semibold">
            {labels.group}
          </span>
          <span className="text-[max(6px,1.7cqw)] opacity-75">
            Marta, Pau, Irene, +214
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-[1.2cqw] p-[2cqw]">
        <span className="h-[3.4cqw] w-[38%] rounded-[1cqw] bg-white/70" />
        <span className="h-[3.4cqw] w-[55%] self-end rounded-[1cqw] bg-[#d9f2c9]/80" />
        <div className="relative max-w-[88%] rounded-[1cqw] rounded-tl-none bg-white px-[1.8cqw] py-[1.2cqw]">
          <p className="text-[max(7px,1.9cqw)] font-semibold text-[#1f8a4c]">
            {labels.sender}
          </p>
          <p className="mt-[0.4cqw] text-[max(8px,2.2cqw)] leading-snug text-[#1b1a17]">
            {labels.post}
          </p>
          <p className="mt-[0.4cqw] text-right text-[max(6px,1.6cqw)] text-[#6b6559]">
            22:48 <span className="text-[#34b7f1]">✓✓</span>
          </p>
        </div>
        <span className="h-[3.4cqw] w-[30%] rounded-[1cqw] bg-white/70" />
      </div>
    </div>
  );
}

function SourcePost({ pin, labels }: { pin: Pin; labels: LandingDemoLabels }) {
  const dx = pin.x - POST_X;
  const dy = (pin.y - POST_Y) * 0.75;
  return (
    <div
      className="demo-post absolute z-40"
      style={
        {
          left: `${POST_X}%`,
          top: `${POST_Y}%`,
          animationDelay: `${pin.delay}s`,
          "--dx": `${dx}cqw`,
          "--dy": `${dy}cqw`,
        } as React.CSSProperties
      }
    >
      {pin.source === "story" && (
        <StoryPost labels={labels} delay={pin.delay} />
      )}
      {pin.source === "flyer" && (
        <FlyerPost labels={labels} delay={pin.delay} />
      )}
      {pin.source === "whatsapp" && <WhatsappPost labels={labels} />}
    </div>
  );
}

function ListingCard({ pin, labels }: { pin: Pin; labels: LandingDemoLabels }) {
  return (
    <div
      className="demo-card bg-card absolute z-20 flex w-[min(16.5rem,76%)] gap-2.5 rounded-md border p-2 text-left shadow-[0_3px_8px_-3px_rgb(4_54_95/0.3)]"
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
            {pin.billsIncluded ? labels.billsIncluded : labels.billsNotIncluded}
          </span>
        </div>
        <p className="text-brand mt-0.5 inline-flex items-center gap-1 text-[0.62rem] font-semibold">
          <BadgeCheck className="size-3" />
          {labels.reviewed}
          <span className="text-muted-foreground font-normal">
            · {labels.expires}
          </span>
        </p>
      </div>
      <span className="bg-card absolute -bottom-[5px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r border-b" />
    </div>
  );
}

/**
 * Looping illustration for the landing hero. Each turn, an ad as people post it today
 * (an Instagram story, a home-made flyer, a WhatsApp group message) appears over the
 * map, shrinks into its pin and comes back as a tidy, reviewed Lloguer listing card.
 * Pure CSS (see `.demo-*` in globals.css), decorative only.
 */
export function LandingMapDemo({ labels }: { labels: LandingDemoLabels }) {
  const pins: Pin[] = [
    {
      x: 62,
      y: 52,
      delay: 0,
      source: "story",
      place: "Benimaclet",
      roomType: labels.double,
      price: 320,
      flatmates: 2,
      billsIncluded: true,
      tone: "blue",
    },
    {
      x: 39,
      y: 64,
      delay: 6,
      source: "flyer",
      place: "Russafa",
      roomType: labels.single,
      price: 360,
      flatmates: 2,
      billsIncluded: false,
      tone: "orange",
    },
    {
      x: 56,
      y: 82,
      delay: 12,
      source: "whatsapp",
      place: "Blasco Ibáñez",
      roomType: labels.single,
      price: 300,
      flatmates: 3,
      billsIncluded: false,
      tone: "gold",
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative aspect-[4/3] w-full overflow-hidden rounded-md border select-none [container-type:inline-size]"
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
                style={{ animationDelay: `${p.delay + 3.1 + offset}s` }}
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

      <div className="demo-veil bg-background/70 absolute inset-0 z-30 backdrop-blur-[1.5px]" />
      {pins.map((p) => (
        <SourcePost key={p.source} pin={p} labels={labels} />
      ))}
    </div>
  );
}
