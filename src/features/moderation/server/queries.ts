import type { Db } from "@/features/listings/server/queries";
import type { ListingStatus } from "@/lib/types/database.types";

export async function getPendingListings(supabase: Db) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPendingCount(supabase: Db): Promise<number> {
  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function getAllListings(supabase: Db, status?: ListingStatus) {
  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getModerationHistory(supabase: Db, listingId: string) {
  const { data: events, error } = await supabase
    .from("moderation_events")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Anonymous posters have no actor (actor_id is null)
  const actorIds = [
    ...new Set(events.map((e) => e.actor_id).filter((id): id is string => id !== null)),
  ];
  const { data: actors } = actorIds.length
    ? await supabase.from("public_profiles").select("*").in("id", actorIds)
    : { data: [] };

  const actorById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));
  return events.map((e) => ({
    ...e,
    actor_name: e.actor_id ? (actorById.get(e.actor_id) ?? null) : null,
  }));
}
