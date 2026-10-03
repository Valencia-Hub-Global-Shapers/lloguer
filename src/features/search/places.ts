import type { Bounds } from "@/features/listings/types";
import type { PublicPlace } from "@/lib/types/database.types";
import type { FilterState } from "./params";

export type PlaceGroup = {
  municipality: string;
  listings: number;
  neighborhoods: { name: string; listings: number }[];
};

/** Groups the flat place rows into municipalities with their neighborhoods. */
export function groupPlaces(places: PublicPlace[]): PlaceGroup[] {
  const groups = new Map<string, PlaceGroup>();
  for (const p of places) {
    let group = groups.get(p.municipality);
    if (!group) {
      group = { municipality: p.municipality, listings: 0, neighborhoods: [] };
      groups.set(p.municipality, group);
    }
    group.listings += p.listings;
    if (p.neighborhood) group.neighborhoods.push({ name: p.neighborhood, listings: p.listings });
  }
  return [...groups.values()].sort((a, b) => a.municipality.localeCompare(b.municipality, "es"));
}

// Keeps a single-pin place from collapsing into a zero-size box (~300 m)
const PAD_DEGREES = 0.003;

/**
 * Bounds covering the places that match the city/neighborhood filter, or null
 * when no place filter is set or nothing matches.
 */
export function placeBounds(
  places: PublicPlace[],
  filters: Pick<FilterState, "city" | "neighborhood">,
): Bounds | null {
  if (!filters.city && !filters.neighborhood) return null;
  const matching = places.filter(
    (p) =>
      (!filters.city || p.municipality === filters.city) &&
      (!filters.neighborhood || p.neighborhood === filters.neighborhood),
  );
  if (matching.length === 0) return null;
  return {
    minLat: Math.min(...matching.map((p) => p.min_lat)) - PAD_DEGREES,
    minLng: Math.min(...matching.map((p) => p.min_lng)) - PAD_DEGREES,
    maxLat: Math.max(...matching.map((p) => p.max_lat)) + PAD_DEGREES,
    maxLng: Math.max(...matching.map((p) => p.max_lng)) + PAD_DEGREES,
  };
}
