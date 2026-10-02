import type {
  Listing,
  ListingStatus,
  ListingType,
  RoomType,
} from "@/lib/types/database.types";

export type Bounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

/** Minimal fields for map markers. */
export type ListingPin = {
  id: string;
  type: ListingType;
  price: number;
  lat: number;
  lng: number;
};

/** Fields rendered in result cards. */
export type ListingCardData = {
  id: string;
  type: ListingType;
  price: number;
  neighborhood: string | null;
  municipality: string;
  photos: string[];
  room_type: RoomType | null;
  bills_included: boolean;
  pets: boolean;
  smokers: boolean;
  flatmates: number | null;
  available_from: string | null;
  bedrooms: number | null;
};

export type BrowseResponse = {
  pins: ListingPin[];
  cards: ListingCardData[];
  total: number;
};

export const LISTING_STATUSES: ListingStatus[] = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "draft",
  "deleted",
];

export const STATUS_I18N_KEYS: Record<ListingStatus, string> = {
  draft: "listing.statusDraft",
  pending: "listing.statusPending",
  approved: "listing.statusApproved",
  rejected: "listing.statusRejected",
  expired: "listing.statusExpired",
  deleted: "listing.statusDeleted",
};

/** PostgREST returns geography columns as GeoJSON. */
export function parseGeoPoint(location: unknown): { lat: number; lng: number } | null {
  if (
    location &&
    typeof location === "object" &&
    "coordinates" in location &&
    Array.isArray((location as { coordinates: unknown }).coordinates)
  ) {
    const [lng, lat] = (location as { coordinates: number[] }).coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

/** Poster view returned by get_listing_by_token(): exact coords, no hash/owner. */
export type PosterListing = Omit<Listing, "location" | "edit_token_hash"> & {
  lat: number;
  lng: number;
  rejection_comment: string | null;
};
