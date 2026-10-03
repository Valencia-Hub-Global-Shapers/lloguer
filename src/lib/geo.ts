/**
 * COARSE Spain bounding boxes: [minLng, minLat, maxLng, maxLat].
 * Mainland + Balearics + Ceuta/Melilla, and the Canary Islands. A rectangle
 * cannot follow the border (it still covers Portugal and southern France), so
 * this only rejects obviously wrong coordinates; the publish form also checks
 * the country by reverse geocoding and moderators review every listing.
 * Keep in sync with the listings_in_spain constraint in supabase/migrations.
 */
export const SPAIN_AREAS: [number, number, number, number][] = [
  [-9.6, 35.1, 4.5, 43.9],
  [-18.4, 27.4, -13.2, 29.6],
];

export function isInSpain(lat: number, lng: number): boolean {
  return SPAIN_AREAS.some(
    ([minLng, minLat, maxLng, maxLat]) =>
      lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
  );
}
