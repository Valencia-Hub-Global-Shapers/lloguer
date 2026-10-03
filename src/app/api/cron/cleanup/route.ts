import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LISTING_PHOTOS_BUCKET } from "@/features/listings/photos";

export const dynamic = "force-dynamic";

/**
 * Scheduled cleanup, hit by Vercel Cron with CRON_SECRET as a Bearer token:
 *  1. purge listings expired for over a month (row + queued photos),
 *  2. retry queued photo deletions that failed before,
 *  3. sweep orphan anonymous uploads that were never submitted.
 * Safe to call by hand as long as the Authorization header matches CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const report: Record<string, unknown> = {};

  // 1) Purge long-expired listings and delete their photo files.
  const { data: purged, error: purgeError } = await supabase.rpc("purge_expired_listings", {
    p_gate: secret,
  });
  if (purgeError) {
    report.purgeError = purgeError.message;
  } else if (purged && purged.length > 0) {
    report.purgedListings = purged.length;
    const { error: removeError } = await supabase.storage
      .from(LISTING_PHOTOS_BUCKET)
      .remove(purged);
    if (removeError) report.purgeRemoveError = removeError.message;
    await supabase.rpc("ack_photo_deletion");
  }

  // 2) Retry queued photo deletions.
  const { data: queued, error: queuedError } = await supabase.rpc("pending_photo_paths", {
    p_gate: secret,
  });
  if (queuedError) {
    report.queueError = queuedError.message;
  } else if (queued && queued.length > 0) {
    report.retriedPhotos = queued.length;
    const { error: removeError } = await supabase.storage
      .from(LISTING_PHOTOS_BUCKET)
      .remove(queued);
    if (removeError) report.retryRemoveError = removeError.message;
    await supabase.rpc("ack_photo_deletion");
  }

  // 3) Sweep orphan anonymous uploads older than 2 days.
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const { data: uploads, error: listError } = await supabase.storage
    .from(LISTING_PHOTOS_BUCKET)
    .list("anon", { limit: 1000 });
  if (listError) {
    report.sweepListError = listError.message;
  } else if (uploads && uploads.length > 0) {
    const orphans = uploads
      .filter((o) => o.created_at && new Date(o.created_at) < cutoff)
      .map((o) => `anon/${o.name}`);
    if (orphans.length > 0) {
      report.sweptOrphans = orphans.length;
      const { error: removeError } = await supabase.storage
        .from(LISTING_PHOTOS_BUCKET)
        .remove(orphans);
      if (removeError) report.sweepRemoveError = removeError.message;
    }
  }

  return NextResponse.json({ ok: true, ...report });
}
