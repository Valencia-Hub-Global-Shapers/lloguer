"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LISTING_TTL_DAYS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { err, ok, type Result } from "@/lib/result";
import { LISTING_PHOTOS_BUCKET } from "@/features/listings/photos";
import { moderationDecisionSchema, rejectDecisionSchema } from "../schemas";

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, admin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { supabase, user, admin: profile?.is_admin === true };
}

export async function approveListing(
  listingId: string,
  comment?: string,
): Promise<Result<null>> {
  const { supabase, user, admin } = await requireAdminUser();
  if (!user || !admin) return err("errors.unauthorized");
  if (!(await checkRateLimit("edit", user.id))) return err("errors.rateLimited");

  const parsed = moderationDecisionSchema.safeParse({ listingId, comment });
  if (!parsed.success) return err("errors.validation");

  const now = new Date();
  const expires = new Date(now.getTime() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("listings")
    .update({
      status: "approved",
      approved_at: now.toISOString(),
      expires_at: expires.toISOString(),
    })
    .eq("id", listingId);

  if (error) {
    console.error("approveListing failed:", error);
    return err("errors.generic");
  }

  await supabase.from("moderation_events").insert({
    listing_id: listingId,
    actor_id: user.id,
    action: "approved",
    comment: comment ?? null,
  });

  revalidatePath("/[locale]/admin/moderation", "page");
  revalidatePath("/[locale]/admin/listings", "page");
  revalidatePath("/[locale]", "page");
  return ok(null);
}

export async function rejectListing(
  listingId: string,
  comment: string,
): Promise<Result<null>> {
  const { supabase, user, admin } = await requireAdminUser();
  if (!user || !admin) return err("errors.unauthorized");
  if (!(await checkRateLimit("edit", user.id))) return err("errors.rateLimited");

  const parsed = rejectDecisionSchema.safeParse({ listingId, comment });
  if (!parsed.success) return err("errors.validation");

  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected" })
    .eq("id", listingId);

  if (error) {
    console.error("rejectListing failed:", error);
    return err("errors.generic");
  }

  await supabase.from("moderation_events").insert({
    listing_id: listingId,
    actor_id: user.id,
    action: "rejected",
    comment,
  });

  revalidatePath("/[locale]/admin/moderation", "page");
  revalidatePath("/[locale]/admin/listings", "page");
  return ok(null);
}

/**
 * Permanently removes a listing on an admin's behalf: the row (and, by cascade,
 * its moderation events and view counts) is deleted, then the photo files are
 * removed from Storage. Unlike a poster's delete this needs no edit token.
 */
export async function deleteListing(listingId: string): Promise<Result<null>> {
  const { supabase, user, admin } = await requireAdminUser();
  if (!user || !admin) return err("errors.unauthorized");
  if (!(await checkRateLimit("edit", user.id))) return err("errors.rateLimited");

  const parsed = moderationDecisionSchema.safeParse({ listingId });
  if (!parsed.success) return err("errors.validation");

  const { data: listing } = await supabase
    .from("listings")
    .select("photos")
    .eq("id", listingId)
    .maybeSingle();
  const photos = listing?.photos ?? [];

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) {
    console.error("deleteListing failed:", error);
    return err("errors.generic");
  }

  if (photos.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(LISTING_PHOTOS_BUCKET)
      .remove(photos);
    if (removeError) console.error("deleteListing photos failed:", removeError);
  }

  revalidatePath("/[locale]/admin/moderation", "page");
  revalidatePath("/[locale]/admin/listings", "page");
  revalidatePath("/[locale]", "page");
  return ok(null);
}
