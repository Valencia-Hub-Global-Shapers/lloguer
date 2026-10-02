import type { GenderPref, Neighborhood, PublicListing } from "@/lib/types/database.types";
import type { createClient } from "@/lib/supabase/server";
import type { FilterState } from "@/features/search/params";
import type { Bounds, BrowseResponse, ListingPin, PosterListing } from "../types";

export type Db = Awaited<ReturnType<typeof createClient>>;

const CARDS_LIMIT = 60;
const PINS_LIMIT = 1000;

const PIN_COLUMNS = "id, type, price, public_lat, public_lng";
const CARD_COLUMNS =
  "id, type, price, neighborhood, municipality, photos, room_type, bills_included, pets, smokers, flatmates, available_from, bedrooms";

export async function getNeighborhoods(supabase: Db): Promise<Neighborhood[]> {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name_es, name_ca, name_en, slug, lat, lng, municipality")
    .order("municipality")
    .order("name_es");
  if (error) throw error;
  return data as unknown as Neighborhood[];
}

/** Public browse: pins for markers + cards for the panel, within bounds+filters. */
export async function getPublicListings(
  supabase: Db,
  bounds: Bounds,
  filters: FilterState,
  neighborhoods: Neighborhood[],
): Promise<BrowseResponse> {
  const hoodName = filters.neighborhood
    ? neighborhoods.find((n) => n.slug === filters.neighborhood)?.name_ca
    : undefined;

  let pins = supabase
    .from("public_listings")
    .select(PIN_COLUMNS)
    .gte("public_lat", bounds.minLat)
    .lte("public_lat", bounds.maxLat)
    .gte("public_lng", bounds.minLng)
    .lte("public_lng", bounds.maxLng);

  let cards = supabase
    .from("public_listings")
    .select(CARD_COLUMNS)
    .gte("public_lat", bounds.minLat)
    .lte("public_lat", bounds.maxLat)
    .gte("public_lng", bounds.minLng)
    .lte("public_lng", bounds.maxLng);

  if (filters.type) {
    pins = pins.eq("type", filters.type);
    cards = cards.eq("type", filters.type);
  }
  if (filters.minPrice != null) {
    pins = pins.gte("price", filters.minPrice);
    cards = cards.gte("price", filters.minPrice);
  }
  if (filters.maxPrice != null) {
    pins = pins.lte("price", filters.maxPrice);
    cards = cards.lte("price", filters.maxPrice);
  }
  if (hoodName) {
    pins = pins.eq("neighborhood", hoodName);
    cards = cards.eq("neighborhood", hoodName);
  }
  if (filters.gender) {
    // Listings that accept this gender: open to anyone, or asking for it.
    const accepted: GenderPref[] = ["any", filters.gender];
    pins = pins.in("preferred_gender", accepted);
    cards = cards.in("preferred_gender", accepted);
  }
  if (filters.billsIncluded) {
    pins = pins.eq("bills_included", true);
    cards = cards.eq("bills_included", true);
  }
  if (filters.pets) {
    pins = pins.eq("pets", true);
    cards = cards.eq("pets", true);
  }
  if (filters.smokers) {
    pins = pins.eq("smokers", true);
    cards = cards.eq("smokers", true);
  }
  if (filters.maxFlatmates != null) {
    pins = pins.lte("flatmates", filters.maxFlatmates);
    cards = cards.lte("flatmates", filters.maxFlatmates);
  }
  if (filters.availableBefore) {
    pins = pins.or(`available_from.is.null,available_from.lte.${filters.availableBefore}`);
    cards = cards.or(`available_from.is.null,available_from.lte.${filters.availableBefore}`);
  }

  const [pinsRes, cardsRes] = await Promise.all([
    pins.limit(PINS_LIMIT),
    cards.order("created_at", { ascending: false }).limit(CARDS_LIMIT),
  ]);
  if (pinsRes.error) throw pinsRes.error;
  if (cardsRes.error) throw cardsRes.error;

  return {
    pins: pinsRes.data.map(
      (p): ListingPin => ({
        id: p.id,
        type: p.type,
        price: p.price,
        lat: Number(p.public_lat),
        lng: Number(p.public_lng),
      }),
    ),
    cards: cardsRes.data,
    total: pinsRes.data.length,
  };
}

export async function getPublicListingById(
  supabase: Db,
  id: string,
): Promise<PublicListing | null> {
  const { data, error } = await supabase
    .from("public_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Admin view of any listing regardless of status (RLS enforced). */
export async function getListingForAdmin(supabase: Db, id: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Poster view of their own listing, authorised by the edit token hash. */
export async function getListingByToken(
  supabase: Db,
  id: string,
  tokenHash: string,
): Promise<PosterListing | null> {
  const { data, error } = await supabase.rpc("get_listing_by_token", {
    p_id: id,
    p_token_hash: tokenHash,
  });
  if (error) throw error;
  return (data as PosterListing | null) ?? null;
}

export async function getPublicProfile(supabase: Db, id: string) {
  const { data, error } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
