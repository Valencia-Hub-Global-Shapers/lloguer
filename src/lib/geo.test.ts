import { describe, expect, it } from "vitest";
import { isInSpain } from "./geo";

describe("isInSpain", () => {
  it.each([
    ["València", 39.47, -0.38],
    ["Madrid", 40.42, -3.7],
    ["Barcelona", 41.39, 2.17],
    ["Palma", 39.57, 2.65],
    ["Sevilla", 37.39, -5.99],
    ["A Coruña", 43.37, -8.4],
    ["Las Palmas", 28.12, -15.43],
    ["Melilla", 35.29, -2.94],
  ])("accepts %s", (_name, lat, lng) => {
    expect(isInSpain(lat, lng)).toBe(true);
  });

  it.each([
    ["Paris", 48.86, 2.35],
    ["Casablanca", 33.57, -7.59],
    ["Atlantic Ocean", 35, -30],
    ["null island", 0, 0],
  ])("rejects %s", (_name, lat, lng) => {
    expect(isInSpain(lat, lng)).toBe(false);
  });
});
