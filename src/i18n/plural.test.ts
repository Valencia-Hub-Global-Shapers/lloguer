import { describe, expect, it } from "vitest";
import es from "./es.json";
import va from "./va.json";
import en from "./en.json";
import { pluralKey } from "./plural";

describe("pluralKey", () => {
  const has = (key: string) => key === "listing.flatmatesOne";

  it("uses the singular key only for exactly 1", () => {
    expect(pluralKey("listing.flatmates", 1, has)).toBe("listing.flatmatesOne");
    expect(pluralKey("listing.flatmates", 0, has)).toBe("listing.flatmates");
    expect(pluralKey("listing.flatmates", 2, has)).toBe("listing.flatmates");
  });

  it("falls back to the base key when there is no singular variant", () => {
    expect(pluralKey("listing.price", 1, has)).toBe("listing.price");
  });
});

describe("singular strings", () => {
  const dictionaries = { es, va, en };
  const keys = [
    ["listing", "flatmates"],
    ["listing", "bathrooms"],
    ["listing", "bedrooms"],
    ["listing", "views"],
    ["home", "results"],
  ] as const;

  it.each(Object.keys(dictionaries))("%s has a singular for every counted string", (locale) => {
    const dict = dictionaries[locale as keyof typeof dictionaries] as unknown as Record<
      string,
      Record<string, string>
    >;
    for (const [section, key] of keys) {
      expect(dict[section][`${key}One`], `${section}.${key}One`).toBeTruthy();
      expect(dict[section][`${key}One`]).toContain("{count}");
    }
  });

  it("reads naturally in Spanish", () => {
    expect(es.listing.flatmatesOne.replace("{count}", "1")).toBe("1 compañero de piso");
  });
});
