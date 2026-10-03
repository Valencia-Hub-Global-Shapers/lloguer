import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPublicListings, getPublicPlaces } from "@/features/listings/server/queries";
import { parseFilters } from "@/features/search/params";
import { zoomForBounds } from "@/features/map/clustering";
import { placeBounds } from "@/features/search/places";
import { MapExplorer } from "@/features/map/components/map-explorer";
import { VALENCIA_BOUNDS } from "@/lib/utils";
import type { Bounds } from "@/features/listings/types";
import type { BrowseResponse } from "@/features/listings/types";

/** València is the default view; picking a place elsewhere in Spain moves the map. */
const DEFAULT_BOUNDS: Bounds = {
  minLng: VALENCIA_BOUNDS[0],
  minLat: VALENCIA_BOUNDS[1],
  maxLng: VALENCIA_BOUNDS[2],
  maxLat: VALENCIA_BOUNDS[3],
};

const EMPTY: BrowseResponse = { pins: [], cards: [], total: 0 };

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const supabase = await createClient();

  let places: Awaited<ReturnType<typeof getPublicPlaces>> = [];
  let bounds = DEFAULT_BOUNDS;
  let data: BrowseResponse = EMPTY;
  try {
    places = await getPublicPlaces(supabase);
    // A shared link with a place filter opens on that place
    bounds = placeBounds(places, filters) ?? DEFAULT_BOUNDS;
    data = await getPublicListings(supabase, bounds, filters, zoomForBounds(bounds));
  } catch (e) {
    // Supabase not reachable (e.g. local stack not started): render the shell
    console.error("initial listings fetch failed:", e);
  }

  return (
    <Suspense>
      <MapExplorer
        initialData={data}
        initialBounds={bounds}
        places={places}
      />
    </Suspense>
  );
}
