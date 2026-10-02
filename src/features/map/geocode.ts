export type ReverseGeocodeResult = {
  /** Neighborhood or locality, when the point has one. */
  neighborhood: string | null;
  /** City/town ("place"). */
  municipality: string | null;
  /** ISO 3166-1 alpha-2, lowercase (e.g. "es"). */
  country: string | null;
};

type MapboxFeature = {
  id?: string;
  place_type?: string[];
  text?: string;
  properties?: { short_code?: string };
  context?: { id: string; text: string; short_code?: string }[];
};

/**
 * Parses a Mapbox Geocoding v5 reverse response (types=neighborhood,locality,place).
 * Features come most specific first.
 */
export function parseReverseGeocode(json: unknown): ReverseGeocodeResult {
  const features = ((json as { features?: MapboxFeature[] } | null)?.features ?? []) as MapboxFeature[];
  const byType = (type: string) => features.find((f) => f.place_type?.includes(type));

  const hood = byType("neighborhood") ?? byType("locality");
  const place = byType("place");

  // Country lives in the context of any feature
  let country: string | null = null;
  for (const f of features) {
    const c = f.context?.find((ctx) => ctx.id.startsWith("country"));
    if (c?.short_code) {
      country = c.short_code.toLowerCase();
      break;
    }
  }

  return {
    neighborhood: hood?.text ?? null,
    municipality: place?.text ?? null,
    country,
  };
}

/** Names are stored in Spanish so filter values stay consistent across UI languages. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  token: string,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> {
  if (!token) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=neighborhood,locality,place&language=es&limit=5&access_token=${token}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return parseReverseGeocode(await res.json());
  } catch {
    return null;
  }
}
