import type { GenderPref, PublicListing, PublicPlace } from "@/lib/types/database.types";
import type { createClient } from "@/lib/supabase/server";
import { clusterCellSize } from "@/features/map/clustering";
import type { FilterState } from "@/features/search/params";
import type { Bounds, BrowseResponse, ListingPin, PosterListing } from "../types";

export type Db = Awaited<ReturnType<typeof createClient>>;

const CARDS_LIMIT = 60;
const PINS_LIMIT = 1000;

const CARD_COLUMNS =
  "id, type, price, neighborhood, municipality, photos, room_type, bills_included, pets, smokers, flatmates, available_from, bedrooms";

/** Places (municipality + neighborhood) that currently have live listings. */
export async function getPublicPlaces(supabase: Db): Promise<PublicPlace[]> {
  const { data, error } = await supabase
    .from("public_places")
    .select("municipality, neighborhood, listings, min_lat, min_lng, max_lat, max_lng")
    .order("municipality")
    .order("neighborhood");
  if (error) throw error;
  return data.map((p) => ({
    ...p,
    min_lat: Number(p.min_lat),
    min_lng: Number(p.min_lng),
    max_lat: Number(p.max_lat),
    max_lng: Number(p.max_lng),
  }));
}

/**
 * Public browse: clustered pins for the markers (SQL grid, so the payload stays
 * small at any zoom) plus the most recent cards, within bounds + filters.
 * `zoom` picks the cluster cell size; without it every listing is its own pin.
 */
export async function getPublicListings(
  supabase: Db,
  bounds: Bounds,
  filters: FilterState,
  zoom?: number,
): Promise<BrowseResponse> {
  let cards = supabase
    .from("public_listings")
    .select(CARD_COLUMNS)
    .gte("public_lat", bounds.minLat)
    .lte("public_lat", bounds.maxLat)
    .gte("public_lng", bounds.minLng)
    .lte("public_lng", bounds.maxLng);

  if (filters.type) cards = cards.eq("type", filters.type);
  if (filters.minPrice != null) cards = cards.gte("price", filters.minPrice);
  if (filters.maxPrice != null) cards = cards.lte("price", filters.maxPrice);
  if (filters.city) cards = cards.eq("municipality", filters.city);
  if (filters.neighborhood) cards = cards.eq("neighborhood", filters.neighborhood);
  if (filters.gender) {
    // Listings that accept this gender: open to anyone, or asking for it.
    const accepted: GenderPref[] = ["any", filters.gender];
    cards = cards.in("preferred_gender", accepted);
  }
  if (filters.billsIncluded) cards = cards.eq("bills_included", true);
  if (filters.pets) cards = cards.eq("pets", true);
  if (filters.smokers) cards = cards.eq("smokers", true);
  if (filters.maxFlatmates != null) cards = cards.lte("flatmates", filters.maxFlatmates);
  if (filters.availableBefore) {
    cards = cards.or(`available_from.is.null,available_from.lte.${filters.availableBefore}`);
  }

  const [pinsRes, cardsRes] = await Promise.all([
    supabase.rpc("browse_pins", {
      p_min_lat: bounds.minLat,
      p_min_lng: bounds.minLng,
      p_max_lat: bounds.maxLat,
      p_max_lng: bounds.maxLng,
      p_cell: clusterCellSize(zoom),
      p_type: filters.type ?? null,
      p_min_price: filters.minPrice ?? null,
      p_max_price: filters.maxPrice ?? null,
      p_city: filters.city ?? null,
      p_hood: filters.neighborhood ?? null,
      p_gender: filters.gender ?? null,
      p_bills: filters.billsIncluded ?? null,
      p_pets: filters.pets ?? null,
      p_smokers: filters.smokers ?? null,
      p_max_flatmates: filters.maxFlatmates ?? null,
      p_avail: filters.availableBefore ?? null,
      p_limit: PINS_LIMIT,
    }),
    cards.order("created_at", { ascending: false }).limit(CARDS_LIMIT),
  ]);
  if (pinsRes.error) throw pinsRes.error;
  if (cardsRes.error) throw cardsRes.error;

  const pins = pinsRes.data.map(
    (p): ListingPin => ({
      id: p.id,
      type: p.type,
      price: p.price,
      lat: Number(p.lat),
      lng: Number(p.lng),
      count: Number(p.count),
    }),
  );

  return {
    pins,
    cards: cardsRes.data,
    total: pins.reduce((sum, p) => sum + p.count, 0),
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
