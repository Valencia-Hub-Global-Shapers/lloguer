import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicListings } from "@/features/listings/server/queries";
import { parseFilters } from "@/features/search/params";
import type { Bounds } from "@/features/listings/types";

function parseBounds(params: URLSearchParams): Bounds | null {
  const nums = ["minLat", "minLng", "maxLat", "maxLng"].map((k) =>
    Number(params.get(k)),
  );
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [minLat, minLng, maxLat, maxLng] = nums;
  if (minLat >= maxLat || minLng >= maxLng) return null;
  return { minLat, minLng, maxLat, maxLng };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const bounds = parseBounds(params);
  if (!bounds) {
    return NextResponse.json({ error: "invalid_bounds" }, { status: 400 });
  }

  const filters = parseFilters(params);
  const supabase = await createClient();

  try {
    const result = await getPublicListings(supabase, bounds, filters);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=15" },
    });
  } catch (e) {
    console.error("GET /api/listings failed:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
