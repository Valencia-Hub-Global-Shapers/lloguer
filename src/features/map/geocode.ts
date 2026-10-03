export type ReverseGeocodeResult = {
  /** Neighborhood or locality, when the point has one. */
  neighborhood: string | null;
  /** City/town/village. */
  municipality: string | null;
  /** ISO 3166-1 alpha-2, lowercase (e.g. "es"). */
  country: string | null;
};

type NominatimAddress = Record<string, string | undefined>;

// Most specific first. OSM tags vary by place, so take the first one present.
const NEIGHBORHOOD_KEYS = ["neighbourhood", "quarter", "suburb", "city_district", "borough"];
const MUNICIPALITY_KEYS = ["city", "town", "village", "municipality"];

function firstOf(address: NominatimAddress, keys: string[]): string | null {
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return value;
  }
  return null;
}

/** Parses a Nominatim reverse response (format=jsonv2&addressdetails=1). */
export function parseReverseGeocode(json: unknown): ReverseGeocodeResult {
  const address = (json as { address?: NominatimAddress } | null)?.address ?? {};
  return {
    neighborhood: firstOf(address, NEIGHBORHOOD_KEYS),
    municipality: firstOf(address, MUNICIPALITY_KEYS),
    country: address.country_code?.toLowerCase() ?? null,
  };
}

/**
 * Reverse geocodes with OpenStreetMap Nominatim (no API key). Names are
 * requested in Spanish so filter values stay consistent across UI languages.
 * Usage policy: max 1 request per second, called only on explicit pin drops.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      zoom: "16",
      addressdetails: "1",
      "accept-language": "es",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal });
    if (!res.ok) return null;
    return parseReverseGeocode(await res.json());
  } catch {
    return null;
  }
}
