import { describe, expect, it } from "vitest";
import type { PublicListing } from "@/lib/types/database.types";
import {
  MAX_STORY_PHOTOS,
  buildFacts,
  defaultStoryOptions,
  photosForLayout,
  togglePhoto,
  typeLabel,
  wrapText,
} from "./options";

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}:${Object.values(vars).join(",")}` : key;
const plural = (key: string, count: number) => `${key}:${count}`;

const listing = {
  id: "11111111-2222-3333-4444-555555555555",
  type: "room",
  room_type: "double",
  price: 450,
  neighborhood: "Russafa",
  municipality: "València",
  description: "Habitación luminosa.",
  available_from: "2026-12-01",
  bills_included: true,
  deposit: null,
  flatmates: 2,
  bedrooms: null,
  bathrooms: 1,
  pets: false,
  smokers: false,
  preferred_gender: "any",
  tenant_pref: "students",
  photos: ["a.webp", "b.webp"],
  contact_whatsapp: "+34 600 123 456",
  contact_email: "hola@example.com",
} as unknown as PublicListing;

/** One unit per character, so widths are easy to reason about. */
const measure = (s: string) => s.length;

describe("wrapText", () => {
  it("wraps on word boundaries", () => {
    expect(wrapText("one two three four", 9, measure, 5)).toEqual(["one two", "three", "four"]);
  });

  it("keeps explicit line breaks", () => {
    expect(wrapText("one\ntwo", 20, measure, 5)).toEqual(["one", "two"]);
  });

  it("ends with an ellipsis when it runs out of lines", () => {
    const lines = wrapText("one two three four", 9, measure, 2);
    expect(lines).toEqual(["one two", "three…"]);
  });

  it("shortens a single word that is wider than the line", () => {
    expect(wrapText("supercalifragilistic", 6, measure, 2)).toEqual(["super…"]);
  });

  it("returns nothing for blank text", () => {
    expect(wrapText("   ", 10, measure, 3)).toEqual([]);
  });
});

describe("buildFacts", () => {
  it("lists the facts the listing has, with a future date", () => {
    const facts = buildFacts(listing, t, plural, (d) => d, "2026-10-28");
    expect(facts.map((f) => f.id)).toEqual([
      "available",
      "bills",
      "people",
      "bathrooms",
      "pets",
      "smokers",
      "gender",
      "tenant",
    ]);
    expect(facts[0].label).toBe("listing.availableFrom:2026-12-01");
    expect(facts[2].label).toBe("listing.flatmates:2");
  });

  it("says available now once the date has passed", () => {
    const facts = buildFacts(listing, t, plural, (d) => d, "2027-01-01");
    expect(facts[0].label).toBe("listing.availableNow");
  });
});

describe("defaultStoryOptions", () => {
  it("starts with the first photo and WhatsApp as the contact", () => {
    const options = defaultStoryOptions(listing, t);
    expect(options.layout).toBe("card");
    expect(options.palette).toBe("horchata");
    expect(options.background).toBe("paper");
    expect(options.photos).toEqual(["a.webp"]);
    expect(options.showWhatsapp).toBe(true);
    expect(options.showEmail).toBe(false);
    expect(options.headline).toBe("story.defaultHeadlineRoom:Russafa");
  });

  it("falls back to text only and the email without photos or WhatsApp", () => {
    const options = defaultStoryOptions(
      { ...listing, photos: [], contact_whatsapp: null } as PublicListing,
      t,
    );
    expect(options.layout).toBe("text");
    expect(options.showEmail).toBe(true);
  });
});

describe("photo selection", () => {
  it("adds in order, removes, and caps the selection", () => {
    let selected: string[] = [];
    for (const path of ["1", "2", "3", "4", "5"]) selected = togglePhoto(selected, path);
    expect(selected).toHaveLength(MAX_STORY_PHOTOS);
    expect(togglePhoto(selected, "2")).toEqual(["1", "3", "4"]);
  });

  it("draws one photo on the cover layout and none on text only", () => {
    const options = { ...defaultStoryOptions(listing, t), photos: ["a.webp", "b.webp"] };
    expect(photosForLayout({ ...options, layout: "cover" })).toEqual(["a.webp"]);
    expect(photosForLayout({ ...options, layout: "text" })).toEqual([]);
    expect(photosForLayout(options)).toEqual(["a.webp", "b.webp"]);
  });
});

describe("typeLabel", () => {
  it("adds the room type to rooms", () => {
    expect(typeLabel(listing, t)).toBe("listing.typeRoom · listing.roomDouble");
  });
});
