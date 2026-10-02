import { describe, expect, it } from "vitest";
import { clusterCellSize, formatCount, zoomForBounds } from "./clustering";

describe("clusterCellSize", () => {
  it("halves the cell each zoom level", () => {
    expect(clusterCellSize(5) / clusterCellSize(6)).toBeCloseTo(2, 6);
  });

  it("does not cluster close-in or without a zoom", () => {
    expect(clusterCellSize(14)).toBe(0);
    expect(clusterCellSize(null)).toBe(0);
    expect(clusterCellSize(undefined)).toBe(0);
    expect(clusterCellSize(Number.NaN)).toBe(0);
  });

  it("clusters at the threshold zoom", () => {
    expect(clusterCellSize(13)).toBeGreaterThan(0);
  });
});

describe("zoomForBounds", () => {
  it("is lower for wider bounds", () => {
    const city = { minLat: 39.4, maxLat: 39.5, minLng: -0.45, maxLng: -0.3 };
    const spain = { minLat: 36, maxLat: 44, minLng: -9.5, maxLng: 3.5 };
    expect(zoomForBounds(spain)).toBeLessThan(zoomForBounds(city));
    // All of Spain is far zoomed out, well inside the clustered range
    expect(zoomForBounds(spain)).toBeLessThan(7);
  });
});

describe("formatCount", () => {
  it.each([
    [7, "7"],
    [999, "999"],
    [1000, "1k"],
    [1234, "1.2k"],
    [15400, "15k"],
  ])("formats %i as %s", (n, text) => {
    expect(formatCount(n)).toBe(text);
  });
});
