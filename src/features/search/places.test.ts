import { describe, expect, it } from "vitest";
import type { PublicPlace } from "@/lib/types/database.types";
import { groupPlaces, placeBounds } from "./places";

const place = (
  municipality: string,
  neighborhood: string | null,
  listings: number,
  box: [number, number, number, number],
): PublicPlace => ({
  municipality,
  neighborhood,
  listings,
  min_lat: box[0],
  min_lng: box[1],
  max_lat: box[2],
  max_lng: box[3],
});

const places = [
  place("València", "Ruzafa", 3, [39.46, -0.38, 39.47, -0.37]),
  place("València", "Benimaclet", 2, [39.48, -0.37, 39.49, -0.36]),
  place("València", null, 1, [39.4, -0.4, 39.41, -0.39]),
  place("Madrid", "Chamberí", 4, [40.43, -3.71, 40.44, -3.7]),
];

describe("groupPlaces", () => {
  it("groups neighborhoods under their municipality with totals", () => {
    const groups = groupPlaces(places);
    expect(groups.map((g) => g.municipality)).toEqual(["Madrid", "València"]);
    const valencia = groups.find((g) => g.municipality === "València")!;
    expect(valencia.listings).toBe(6);
    expect(valencia.neighborhoods.map((n) => n.name)).toEqual(["Ruzafa", "Benimaclet"]);
  });
});

describe("placeBounds", () => {
  it("returns null without a place filter or without matches", () => {
    expect(placeBounds(places, {})).toBeNull();
    expect(placeBounds(places, { city: "Sevilla" })).toBeNull();
  });

  it("covers a whole city", () => {
    const b = placeBounds(places, { city: "València" })!;
    expect(b.minLat).toBeLessThan(39.4);
    expect(b.maxLat).toBeGreaterThan(39.49);
    expect(b.maxLng).toBeGreaterThan(-0.36);
  });

  it("narrows to a neighborhood", () => {
    const b = placeBounds(places, { city: "Madrid", neighborhood: "Chamberí" })!;
    expect(b.minLat).toBeCloseTo(40.427, 3);
    expect(b.maxLng).toBeCloseTo(-3.697, 3);
  });
});
