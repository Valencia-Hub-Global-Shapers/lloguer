import { describe, expect, it } from "vitest";
import { countActiveFilters, filtersToSearchParams, parseFilters } from "./params";

describe("filter params", () => {
  it("parses a full query string", () => {
    const p = new URLSearchParams(
      "type=room&min=300&max=650&city=Val%C3%A8ncia&hood=Ruzafa&bills=1&pets=1&smokers=1&mates=2&gender=female&avail=2026-09-01",
    );
    expect(parseFilters(p)).toEqual({
      type: "room",
      minPrice: 300,
      maxPrice: 650,
      city: "València",
      neighborhood: "Ruzafa",
      billsIncluded: true,
      pets: true,
      smokers: true,
      maxFlatmates: 2,
      gender: "female",
      availableBefore: "2026-09-01",
    });
  });

  it("round-trips through serialize/parse", () => {
    const filters = {
      type: "full_flat" as const,
      maxPrice: 900,
      billsIncluded: true,
    };
    expect(parseFilters(filtersToSearchParams(filters))).toEqual({
      type: "full_flat",
      maxPrice: 900,
      billsIncluded: true,
      minPrice: undefined,
      neighborhood: undefined,
      pets: undefined,
      smokers: undefined,
      maxFlatmates: undefined,
      availableBefore: undefined,
    });
  });

  it("ignores garbage values", () => {
    const p = new URLSearchParams("type=villa&min=abc&avail=01-09-2026&bills=yes&gender=x");
    expect(parseFilters(p)).toEqual({
      type: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      neighborhood: undefined,
      billsIncluded: undefined,
      pets: undefined,
      smokers: undefined,
      maxFlatmates: undefined,
      availableBefore: undefined,
    });
  });

  it("counts active filters", () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ type: "room", pets: true, minPrice: 100 })).toBe(3);
    expect(countActiveFilters({ gender: "male" })).toBe(1);
    expect(countActiveFilters({ city: "Madrid", neighborhood: "Chamberí" })).toBe(2);
  });
});
