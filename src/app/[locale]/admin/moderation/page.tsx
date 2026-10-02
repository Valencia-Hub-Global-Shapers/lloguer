import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPendingListings } from "@/features/moderation/server/queries";
import { ModerateActions } from "@/features/moderation/components/moderate-actions";
import { photoUrl } from "@/features/listings/photos";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const pending = await getPendingListings(supabase);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{dict.admin.queueTitle}</h1>
      {pending.length === 0 ? (
        <p className="text-muted-foreground p-8 text-center text-sm">
          {dict.admin.queueEmpty}
        </p>
      ) : (
        <div className="grid gap-3">
          {pending.map((listing) => (
            <article key={listing.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
                  {listing.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl(listing.photos[0])}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {listing.price} € · {listing.neighborhood ?? listing.municipality}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {listing.type === "room" ? dict.listing.typeRoom : dict.listing.typeFullFlat}
                    {" · "}
                    {formatDate(listing.created_at, locale)}
                    {" · v"}
                    {listing.published_version}
                  </p>
                  <Link
                    href={`/${locale}/admin/listings/${listing.id}`}
                    className="text-primary text-sm hover:underline"
                  >
                    {dict.common.view}
                  </Link>
                </div>
                <ModerateActions listingId={listing.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
