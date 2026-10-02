import Link from "next/link";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import {
  getListingForAdmin,
} from "@/features/listings/server/queries";
import { getModerationHistory } from "@/features/moderation/server/queries";
import { ModerateActions } from "@/features/moderation/components/moderate-actions";
import { StatusBadge } from "@/features/listings/components/status-badge";
import { photoUrl } from "@/features/listings/photos";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const listing = await getListingForAdmin(supabase, id).catch(() => null);
  if (!listing) notFound();

  const history = await getModerationHistory(supabase, id).catch(() => []);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">
          {listing.price} € — {listing.neighborhood ?? listing.municipality}
        </h1>
        <StatusBadge status={listing.status} />
        <div className="ml-auto">
          {listing.status === "pending" ? (
            <ModerateActions listingId={listing.id} />
          ) : (
            <Link
              href={`/${locale}/listing/${listing.id}`}
              className="text-primary text-sm hover:underline"
            >
              {dict.common.view}
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Row k="ID" v={listing.id.slice(0, 8)} />
            <Row k={dict.filters.type} v={listing.type} />
            <Row k={dict.filters.price} v={`${listing.price} €`} />
            <Row
              k={dict.filters.neighborhood}
              v={listing.neighborhood ?? listing.municipality}
            />
            <Row k={dict.admin.contactEmail} v={listing.contact_email ?? "—"} />
            <Row k={dict.listing.views.replace("{count}", "")} v={String(listing.views_count)} />
            <Row k="WhatsApp" v={listing.contact_whatsapp ?? "—"} />
            <Row k={dict.publish.contactExternal} v={listing.contact_external ?? "—"} />
            <Row k={dict.admin.createdAt} v={formatDate(listing.created_at, locale)} />
            <Row
              k="Expira"
              v={listing.expires_at ? formatDate(listing.expires_at, locale) : "—"}
            />
            <Row k="v" v={String(listing.published_version)} />
            <Row
              k="GPS"
              v={`${Number(listing.public_lat).toFixed(3)}, ${Number(listing.public_lng).toFixed(3)}`}
            />
          </dl>
          <p className="text-muted-foreground mt-3 line-clamp-4 text-xs">
            {listing.description}
          </p>
        </section>

        <section className="rounded-xl border p-4">
          <div className="grid grid-cols-4 gap-2">
            {listing.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p}
                src={photoUrl(p)}
                alt=""
                className="aspect-square w-full rounded-md object-cover"
              />
            ))}
            {listing.photos.length === 0 ? (
              <p className="text-muted-foreground col-span-4 text-sm">—</p>
            ) : null}
          </div>
        </section>
      </div>

      <Separator className="my-4" />

      <h2 className="mb-3 font-semibold">{dict.admin.history}</h2>
      {history.length === 0 ? (
        <p className="text-muted-foreground text-sm">—</p>
      ) : (
        <ol className="grid gap-2">
          {history.map((event) => (
            <li key={event.id} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="text-muted-foreground text-xs">
                {formatDate(event.created_at, locale)}
              </span>
              <span className="font-medium">
                {dict.moderationAction[event.action as keyof typeof dict.moderationAction]}
              </span>
              {event.actor_name ? (
                <span className="text-muted-foreground text-xs">· {event.actor_name}</span>
              ) : null}
              {event.comment ? (
                <span className="text-muted-foreground">· {event.comment}</span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate font-medium">{v}</dd>
    </>
  );
}
