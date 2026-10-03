import { describe, expect, it } from "vitest";
import { parseReverseGeocode } from "./geocode";

describe("parseReverseGeocode", () => {
  it("extracts neighborhood, municipality and country", () => {
    expect(
      parseReverseGeocode({
        address: { suburb: "Ruzafa", city: "Valencia", country_code: "es" },
      }),
    ).toEqual({ neighborhood: "Ruzafa", municipality: "Valencia", country: "es" });
  });

  it("prefers the most specific neighborhood tag", () => {
    const r = parseReverseGeocode({
      address: { neighbourhood: "Sant Francesc", suburb: "Ciutat Vella", city: "Valencia" },
    });
    expect(r.neighborhood).toBe("Sant Francesc");
  });

  it("falls back to town or village when there is no city", () => {
    expect(parseReverseGeocode({ address: { town: "Paterna" } }).municipality).toBe("Paterna");
    expect(parseReverseGeocode({ address: { village: "Alcublas" } }).municipality).toBe("Alcublas");
  });

  it("handles a town with no neighborhood and normalizes the country", () => {
    const r = parseReverseGeocode({ address: { city: "Cuenca", country_code: "ES" } });
    expect(r).toEqual({ neighborhood: null, municipality: "Cuenca", country: "es" });
  });

  it("returns empty values for empty or malformed responses", () => {
    const empty = { neighborhood: null, municipality: null, country: null };
    expect(parseReverseGeocode({})).toEqual(empty);
    expect(parseReverseGeocode(null)).toEqual(empty);
  });
});
