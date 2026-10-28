import type { PublicListing } from "@/lib/types/database.types";

/** Story canvas size: vertical 9:16, what Instagram stories and WhatsApp status expect. */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

/** The card layout shows up to this many photos as a collage. */
export const MAX_STORY_PHOTOS = 4;
export const MAX_HEADLINE_LENGTH = 70;
export const MAX_NOTE_LENGTH = 140;

/** card: photos framed on the background; cover: one full-bleed photo; text: no photos. */
export type StoryLayout = "card" | "cover" | "text";
export const STORY_LAYOUTS: StoryLayout[] = ["card", "cover", "text"];

export type StoryThemeId = "paper" | "map" | "orange" | "blue" | "ink" | "sunset";

export type StoryTheme = {
  id: StoryThemeId;
  /** Solid ground, or the gradient stops from top to bottom. */
  background: string | [string, string];
  ink: string;
  muted: string;
  /** Price and highlights. */
  accent: string;
  chipBg: string;
  chipInk: string;
  rule: string;
  logoTile: string;
  logoGlyph: string;
  /** Faint street pattern over the ground. */
  pattern?: string;
};

/** Brand colors from globals.css, kept literal because canvas cannot read CSS vars. */
export const STORY_THEMES: StoryTheme[] = [
  {
    id: "paper",
    background: "#faf7f0",
    ink: "#1b1a17",
    muted: "#6b6559",
    accent: "#d6521d",
    chipBg: "#f2ede2",
    chipInk: "#1b1a17",
    rule: "#e4ddce",
    logoTile: "#d6521d",
    logoGlyph: "#ffffff",
  },
  {
    id: "map",
    background: "#faf7f0",
    ink: "#1b1a17",
    muted: "#6b6559",
    accent: "#d6521d",
    chipBg: "#ffffff",
    chipInk: "#054985",
    rule: "#e4ddce",
    logoTile: "#d6521d",
    logoGlyph: "#ffffff",
    pattern: "rgba(5, 73, 133, 0.09)",
  },
  {
    id: "orange",
    background: "#d6521d",
    ink: "#ffffff",
    muted: "rgba(255, 255, 255, 0.82)",
    accent: "#ffffff",
    chipBg: "rgba(255, 255, 255, 0.18)",
    chipInk: "#ffffff",
    rule: "rgba(255, 255, 255, 0.35)",
    logoTile: "#ffffff",
    logoGlyph: "#d6521d",
  },
  {
    id: "blue",
    background: "#054985",
    ink: "#ffffff",
    muted: "rgba(255, 255, 255, 0.78)",
    accent: "#ffffff",
    chipBg: "rgba(255, 255, 255, 0.14)",
    chipInk: "#ffffff",
    rule: "rgba(255, 255, 255, 0.3)",
    logoTile: "#d6521d",
    logoGlyph: "#ffffff",
    pattern: "rgba(255, 255, 255, 0.07)",
  },
  {
    id: "ink",
    background: "#1b1a17",
    ink: "#faf7f0",
    muted: "rgba(250, 247, 240, 0.7)",
    accent: "#e8673a",
    chipBg: "rgba(250, 247, 240, 0.1)",
    chipInk: "#faf7f0",
    rule: "rgba(250, 247, 240, 0.22)",
    logoTile: "#d6521d",
    logoGlyph: "#ffffff",
  },
  {
    id: "sunset",
    background: ["#d6521d", "#a8325e"],
    ink: "#ffffff",
    muted: "rgba(255, 255, 255, 0.85)",
    accent: "#ffffff",
    chipBg: "rgba(255, 255, 255, 0.2)",
    chipInk: "#ffffff",
    rule: "rgba(255, 255, 255, 0.4)",
    logoTile: "#ffffff",
    logoGlyph: "#d6521d",
  },
];

export function getTheme(id: StoryThemeId): StoryTheme {
  return STORY_THEMES.find((theme) => theme.id === id) ?? STORY_THEMES[0];
}

export type StoryFactId =
  | "available"
  | "bills"
  | "people"
  | "bathrooms"
  | "deposit"
  | "pets"
  | "smokers"
  | "gender"
  | "tenant";

export type StoryFact = { id: StoryFactId; label: string };

export type StoryOptions = {
  layout: StoryLayout;
  theme: StoryThemeId;
  /** Photo paths in the order they were picked. */
  photos: string[];
  headline: string;
  note: string;
  showType: boolean;
  showPrice: boolean;
  showLocation: boolean;
  showDescription: boolean;
  showWhatsapp: boolean;
  showEmail: boolean;
  facts: StoryFactId[];
};

type TFn = (key: string, vars?: Record<string, string | number>) => string;
type PluralFn = (key: string, count: number, vars?: Record<string, string | number>) => string;

const DEFAULT_FACTS: StoryFactId[] = ["available", "bills", "people"];

const GENDER_KEYS = {
  any: "listing.genderAny",
  female: "listing.genderFemale",
  male: "listing.genderMale",
  non_binary: "listing.genderNonBinary",
} as const;

const TENANT_KEYS = {
  any: "listing.tenantAny",
  students: "listing.tenantStudents",
  workers: "listing.tenantWorkers",
} as const;

/** Every fact the listing can show, in display order; missing data is left out. */
export function buildFacts(
  listing: PublicListing,
  t: TFn,
  plural: PluralFn,
  formatDay: (date: string) => string,
  today: string,
): StoryFact[] {
  const facts: StoryFact[] = [];
  facts.push({
    id: "available",
    label:
      listing.available_from && listing.available_from > today
        ? t("listing.availableFrom", { date: formatDay(listing.available_from) })
        : t("listing.availableNow"),
  });
  facts.push({
    id: "bills",
    label: listing.bills_included ? t("listing.billsIncluded") : t("listing.billsNotIncluded"),
  });
  if (listing.type === "room" && listing.flatmates != null) {
    facts.push({ id: "people", label: plural("listing.flatmates", listing.flatmates) });
  } else if (listing.type === "full_flat" && listing.bedrooms != null) {
    facts.push({ id: "people", label: plural("listing.bedrooms", listing.bedrooms) });
  }
  if (listing.bathrooms != null) {
    facts.push({ id: "bathrooms", label: plural("listing.bathrooms", listing.bathrooms) });
  }
  if (listing.deposit != null) {
    facts.push({ id: "deposit", label: t("listing.deposit", { amount: listing.deposit }) });
  }
  facts.push({
    id: "pets",
    label: listing.pets ? t("listing.petsYes") : t("listing.petsNo"),
  });
  facts.push({
    id: "smokers",
    label: listing.smokers ? t("listing.smokersYes") : t("listing.smokersNo"),
  });
  facts.push({ id: "gender", label: t(GENDER_KEYS[listing.preferred_gender]) });
  facts.push({ id: "tenant", label: t(TENANT_KEYS[listing.tenant_pref]) });
  return facts;
}

/** "Habitación · Individual" or "Piso completo". */
export function typeLabel(listing: PublicListing, t: TFn): string {
  const type = listing.type === "room" ? t("listing.typeRoom") : t("listing.typeFullFlat");
  if (!listing.room_type) return type;
  const room = listing.room_type;
  return `${type} · ${t(`listing.room${room[0].toUpperCase()}${room.slice(1)}`)}`;
}

export function placeLabel(listing: PublicListing): string {
  return listing.neighborhood
    ? `${listing.neighborhood}, ${listing.municipality}`
    : listing.municipality;
}

/** Sensible first draft: brand look, first photo, the essentials and one contact. */
export function defaultStoryOptions(listing: PublicListing, t: TFn): StoryOptions {
  const place = listing.neighborhood ?? listing.municipality;
  return {
    layout: listing.photos.length > 0 ? "card" : "text",
    theme: "paper",
    photos: listing.photos.slice(0, 1),
    headline: t(
      listing.type === "room" ? "story.defaultHeadlineRoom" : "story.defaultHeadlineFlat",
      { place },
    ).slice(0, MAX_HEADLINE_LENGTH),
    note: "",
    showType: true,
    showPrice: true,
    showLocation: true,
    showDescription: false,
    showWhatsapp: Boolean(listing.contact_whatsapp),
    showEmail: !listing.contact_whatsapp && Boolean(listing.contact_email),
    facts: DEFAULT_FACTS,
  };
}

/** Adds a photo at the end of the selection, or removes it; keeps at most MAX_STORY_PHOTOS. */
export function togglePhoto(selected: string[], path: string): string[] {
  if (selected.includes(path)) return selected.filter((p) => p !== path);
  if (selected.length >= MAX_STORY_PHOTOS) return selected;
  return [...selected, path];
}

/** Photos the layout actually draws. */
export function photosForLayout(options: StoryOptions): string[] {
  if (options.layout === "text") return [];
  if (options.layout === "cover") return options.photos.slice(0, 1);
  return options.photos.slice(0, MAX_STORY_PHOTOS);
}

/**
 * Greedy word wrap. Returns at most maxLines lines; when the text does not fit,
 * the last line ends with an ellipsis. Explicit line breaks are kept.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.trim().split(/\n+/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || measure(candidate) <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  const fitted = lines.slice(0, maxLines).map((line) => fitWidth(line, maxWidth, measure));
  if (lines.length > maxLines && fitted.length > 0) {
    let last = fitted[fitted.length - 1].replace(/…$/, "");
    while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1).trimEnd();
    fitted[fitted.length - 1] = `${last}…`;
  }
  return fitted;
}

/** Shortens a single overlong word with an ellipsis so it never overflows. */
function fitWidth(line: string, maxWidth: number, measure: (s: string) => number): string {
  if (measure(line) <= maxWidth) return line;
  let cut = line;
  while (cut.length > 1 && measure(`${cut}…`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}
