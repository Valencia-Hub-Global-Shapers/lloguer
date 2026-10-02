/**
 * Hand-maintained types matching supabase/migrations. When the CLI is
 * available, regenerate with:
 *   npx supabase gen types typescript --local > src/lib/types/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ListingType = "room" | "full_flat";
export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "expired" | "deleted";
export type GenderPref = "any" | "female" | "male" | "non_binary";
export type RoomType = "single" | "double" | "shared";
export type TenantPref = "any" | "students" | "workers";
export type ModerationAction =
  | "submitted"
  | "approved"
  | "rejected"
  | "edited"
  | "deactivated"
  | "deleted"
  | "republished";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}
export type ProfileInsert = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
  created_at?: string;
}
export type ProfileUpdate = Partial<Omit<ProfileInsert, "id">>;

export type ListingRow = {
  id: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  neighborhood: string | null;
  municipality: string;
  /** Exact location (GeoJSON via PostgREST); never select it in public queries. */
  location: unknown;
  public_lat: number;
  public_lng: number;
  flatmates: number | null;
  preferred_gender: GenderPref;
  description: string;
  available_from: string | null;
  bills_included: boolean;
  deposit: number | null;
  room_type: RoomType | null;
  pets: boolean;
  smokers: boolean;
  tenant_pref: TenantPref;
  contact_external: string | null;
  contact_whatsapp: string | null;
  bathrooms: number | null;
  bedrooms: number | null;
  views_count: number;
  photos: string[];
  /** Public contact email, shown on the listing. */
  contact_email: string | null;
  /** Private: where the poster's edit link is sent. Never in public views. */
  internal_email: string | null;
  /** Private: sha256 of the poster's edit token. */
  edit_token_hash: string | null;
  expires_at: string | null;
  approved_at: string | null;
  published_version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export type ListingInsert = {
  id?: string;
  type: ListingType;
  status?: ListingStatus;
  price: number;
  neighborhood?: string | null;
  municipality?: string;
  location: string; // SRID=4326;POINT(lng lat)
  public_lat?: number;
  public_lng?: number;
  flatmates?: number | null;
  preferred_gender?: GenderPref;
  description?: string;
  available_from?: string | null;
  bills_included?: boolean;
  deposit?: number | null;
  room_type?: RoomType | null;
  pets?: boolean;
  smokers?: boolean;
  tenant_pref?: TenantPref;
  contact_external?: string | null;
  contact_whatsapp?: string | null;
  bathrooms?: number | null;
  bedrooms?: number | null;
  photos?: string[];
  contact_email?: string | null;
  internal_email?: string | null;
  edit_token_hash?: string | null;
}
export type ListingUpdate = Partial<
  ListingInsert & {
    status: ListingStatus;
    approved_at: string | null;
    expires_at: string | null;
    deleted_at: string | null;
  }
>;

export type ModerationEventRow = {
  id: string;
  listing_id: string;
  actor_id: string | null;
  action: ModerationAction;
  comment: string | null;
  created_at: string;
}
export type ModerationEventInsert = {
  listing_id: string;
  actor_id: string;
  action: ModerationAction;
  comment?: string | null;
}

export type ListingViewRow = {
  id: number;
  listing_id: string;
  viewer_hash: string;
  created_at: string;
}

export type PublicPlaceRow = {
  municipality: string;
  neighborhood: string | null;
  listings: number;
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

export type PublicListingRow = {
  id: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  neighborhood: string | null;
  municipality: string;
  public_lat: number;
  public_lng: number;
  flatmates: number | null;
  preferred_gender: GenderPref;
  description: string;
  available_from: string | null;
  bills_included: boolean;
  deposit: number | null;
  room_type: RoomType | null;
  pets: boolean;
  smokers: boolean;
  tenant_pref: TenantPref;
  contact_external: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  bathrooms: number | null;
  bedrooms: number | null;
  views_count: number;
  photos: string[];
  published_version: number;
  created_at: string;
}

export type PublicProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      listings: {
        Row: ListingRow;
        Insert: ListingInsert;
        Update: ListingUpdate;
        Relationships: [];
      };
      moderation_events: {
        Row: ModerationEventRow;
        Insert: ModerationEventInsert;
        Update: Record<string, never>;
        Relationships: [];
      };
      listing_views: {
        Row: ListingViewRow;
        Insert: { listing_id: string; viewer_hash: string };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      public_listings: {
        Row: PublicListingRow;
        Relationships: [];
      };
      public_profiles: {
        Row: PublicProfileRow;
        Relationships: [];
      };
      public_places: {
        Row: PublicPlaceRow;
        Relationships: [];
      };
    };
    Functions: {
      increment_listing_view: {
        Args: { p_listing_id: string; p_viewer_hash: string };
        Returns: undefined;
      };
      expire_listings: { Args: Record<string, never>; Returns: number };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      browse_pins: {
        Args: {
          p_min_lat: number;
          p_min_lng: number;
          p_max_lat: number;
          p_max_lng: number;
          p_cell?: number;
          p_type?: ListingType | null;
          p_min_price?: number | null;
          p_max_price?: number | null;
          p_city?: string | null;
          p_hood?: string | null;
          p_gender?: GenderPref | null;
          p_bills?: boolean | null;
          p_pets?: boolean | null;
          p_smokers?: boolean | null;
          p_max_flatmates?: number | null;
          p_avail?: string | null;
          p_limit?: number;
        };
        Returns: {
          id: string | null;
          type: ListingType | null;
          price: number | null;
          lat: number;
          lng: number;
          count: number;
        }[];
      };
      submit_listing: {
        Args: { p_gate: string; p_token_hash: string; p_payload: Json };
        Returns: string;
      };
      get_listing_by_token: {
        Args: { p_id: string; p_token_hash: string };
        Returns: Json | null;
      };
      update_listing_by_token: {
        Args: { p_gate: string; p_id: string; p_token_hash: string; p_payload: Json };
        Returns: undefined;
      };
      set_listing_status_by_token: {
        Args: { p_gate: string; p_id: string; p_token_hash: string; p_action: string };
        Returns: undefined;
      };
    };
    Enums: {
      listing_type: ListingType;
      listing_status: ListingStatus;
      gender_pref: GenderPref;
      room_type: RoomType;
      tenant_pref: TenantPref;
      moderation_action: ModerationAction;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = ProfileRow;
export type Listing = ListingRow;
export type PublicListing = PublicListingRow;
export type PublicProfile = PublicProfileRow;
export type ModerationEvent = ModerationEventRow;
export type PublicPlace = PublicPlaceRow;
