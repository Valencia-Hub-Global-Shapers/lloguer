import { describe, expect, it } from "vitest";
import { parseReverseGeocode } from "./geocode";

const valencia = {
  features: [
    {
      id: "neighborhood.1",
      place_type: ["neighborhood"],
      text: "Ruzafa",
      context: [
        { id: "place.2", text: "València" },
        { id: "country.3", text: "España", short_code: "es" },
      ],
    },
    { id: "place.2", place_type: ["place"], text: "València", context: [] },
  ],
};

describe("parseReverseGeocode", () => {
  it("extracts neighborhood, municipality and country", () => {
    expect(parseReverseGeocode(valencia)).toEqual({
      neighborhood: "Ruzafa",
      municipality: "València",
      country: "es",
    });
  });

  it("falls back to a locality when there is no neighborhood", () => {
    const r = parseReverseGeocode({
      features: [
        { place_type: ["locality"], text: "Benimaclet", context: [] },
        { place_type: ["place"], text: "València", context: [] },
      ],
    });
    expect(r.neighborhood).toBe("Benimaclet");
  });

  it("handles a town with no neighborhood", () => {
    const r = parseReverseGeocode({
      features: [
        {
          place_type: ["place"],
          text: "Cuenca",
          context: [{ id: "country.1", text: "España", short_code: "ES" }],
        },
      ],
    });
    expect(r).toEqual({ neighborhood: null, municipality: "Cuenca", country: "es" });
  });

  it("returns empty values for empty or malformed responses", () => {
    const empty = { neighborhood: null, municipality: null, country: null };
    expect(parseReverseGeocode({ features: [] })).toEqual(empty);
    expect(parseReverseGeocode(null)).toEqual(empty);
  });
});
