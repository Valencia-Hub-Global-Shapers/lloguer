import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bath,
  BedDouble,
  Cigarette,
  ExternalLink,
  Eye,
  History,
  Home,
  Mail,
  MessageCircle,
  PawPrint,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { getListingForAdmin } from "@/features/listings/server/queries";
import { getModerationHistory } from "@/features/moderation/server/queries";
import { ModerateActions } from "@/features/moderation/components/moderate-actions";
import { DeleteListingButton } from "@/features/moderation/components/delete-listing-button";
import { PhotoGallery } from "@/features/moderation/components/photo-gallery";
import { StatusBadge } from "@/features/listings/components/status-badge";
import { ListingMiniMap } from "@/features/map/components/listing-mini-map";
import { parseGeoPoint } from "@/features/listings/types";
import { getDictionary, interpolate } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

const ROOM_KEYS = { single: "roomSingle", double: "roomDouble", shared: "roomShared" } as const;
const GENDER_KEYS = {
  any: "genderAny",
  female: "genderFemale",
  male: "genderMale",
  non_binary: "genderNonBinary",
} as const;
const TENANT_KEYS = { any: "tenantAny", students: "tenantStudents", workers: "tenantWorkers" } as const;

type ListingDict = Dictionary["listing"];

/** Plural-aware count label using the dictionary's `...One` variants. */
function countLabel(
  dict: Dictionary,
  base: keyof ListingDict,
  one: keyof ListingDict,
  n: number,
): string {
  return interpolate(dict.listing[n === 1 ? one : base], { count: n });
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Attr({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="text-muted-foreground mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{children}</dd>
    </div>
  );
}

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

  const point = parseGeoPoint(listing.location) ?? {
    lat: Number(listing.public_lat),
    lng: Number(listing.public_lng),
  };
  const today = new Date().toISOString().slice(0, 10);
  const availableLabel =
    listing.available_from && listing.available_from > today
      ? interpolate(dict.listing.availableFrom, {
          date: formatDate(listing.available_from, locale),
        })
      : dict.listing.availableNow;
  const whatsappDigits = listing.contact_whatsapp?.replace(/[^0-9]/g, "");

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">
          {listing.price} € · {listing.neighborhood ?? listing.municipality}
        </h1>
        <StatusBadge status={listing.status} />
        <div className="ml-auto flex items-center gap-2">
          {listing.status === "pending" ? (
            <ModerateActions listingId={listing.id} />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/listing/${listing.id}`}>
                <ExternalLink />
                {dict.admin.openPublic}
              </Link>
            </Button>
          )}
          <DeleteListingButton
            listingId={listing.id}
            redirectTo={`/${locale}/admin/listings`}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="grid content-start gap-4 lg:col-span-2">
          <PhotoGallery photos={listing.photos} />

          <Panel title={dict.admin.sectionSpace}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Attr icon={<Home />}>
                {listing.type === "room" ? dict.listing.typeRoom : dict.listing.typeFullFlat}
              </Attr>
              {listing.type === "room" && listing.room_type ? (
                <Attr icon={<BedDouble />}>
                  {dict.listing[ROOM_KEYS[listing.room_type]]}
                </Attr>
              ) : null}
              {listing.type === "full_flat" && listing.bedrooms != null ? (
                <Attr icon={<BedDouble />}>
                  {countLabel(dict, "bedrooms", "bedroomsOne", listing.bedrooms)}
                </Attr>
              ) : null}
              {listing.bathrooms != null ? (
                <Attr icon={<Bath />}>
                  {countLabel(dict, "bathrooms", "bathroomsOne", listing.bathrooms)}
                </Attr>
              ) : null}
              {listing.type === "room" && listing.flatmates != null ? (
                <Attr icon={<Users />}>
                  {countLabel(dict, "flatmates", "flatmatesOne", listing.flatmates)}
                </Attr>
              ) : null}
            </div>
          </Panel>

          <Panel title={dict.admin.sectionLiving}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Attr icon={<User />}>{dict.listing[GENDER_KEYS[listing.preferred_gender]]}</Attr>
              <Attr icon={<Users />}>{dict.listing[TENANT_KEYS[listing.tenant_pref]]}</Attr>
              <Attr icon={<PawPrint />}>
                {listing.pets ? dict.listing.petsYes : dict.listing.petsNo}
              </Attr>
              <Attr icon={<Cigarette />}>
                {listing.smokers ? dict.listing.smokersYes : dict.listing.smokersNo}
              </Attr>
            </div>
          </Panel>

          <Panel title={dict.listing.description}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="grid content-start gap-4">
          <Panel title={dict.admin.sectionLocation}>
            <ListingMiniMap
              lat={point.lat}
              lng={point.lng}
              interactive
              className="h-56 w-full rounded-lg border"
            />
            <dl className="mt-3 grid gap-1.5">
              <Row label={dict.publish.municipality}>{listing.municipality}</Row>
              <Row label={dict.publish.neighborhood}>{listing.neighborhood ?? "—"}</Row>
              <Row label={dict.admin.coordinates}>
                <span className="font-mono text-xs">
                  {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                </span>
              </Row>
            </dl>
          </Panel>

          <Panel title={dict.admin.sectionPrice}>
            <dl className="grid gap-1.5">
              <Row label={dict.filters.price}>
                {listing.price} {dict.listing.perMonth}
              </Row>
              <Row label={dict.publish.deposit}>
                {listing.deposit != null ? `${listing.deposit} €` : "—"}
              </Row>
              <Row label={dict.filters.billsIncluded}>
                {listing.bills_included ? "✓" : "—"}
              </Row>
              <Row label={dict.publish.availableFrom}>{availableLabel}</Row>
            </dl>
          </Panel>

          <Panel title={dict.admin.sectionContact}>
            <div className="grid gap-2 text-sm">
              {listing.contact_email ? (
                <a
                  href={`mailto:${listing.contact_email}`}
                  className="text-brand flex items-center gap-2 hover:underline"
                >
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate">{listing.contact_email}</span>
                </a>
              ) : null}
              {whatsappDigits ? (
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand flex items-center gap-2 hover:underline"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="truncate">{listing.contact_whatsapp}</span>
                </a>
              ) : null}
              {listing.contact_external ? (
                <a
                  href={listing.contact_external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand flex items-center gap-2 hover:underline"
                >
                  <ExternalLink className="size-4 shrink-0" />
                  <span className="truncate">{listing.contact_external}</span>
                </a>
              ) : null}
              {!listing.contact_email && !whatsappDigits && !listing.contact_external ? (
                <p className="text-muted-foreground">—</p>
              ) : null}
            </div>
            <div className="mt-3 border-t pt-3">
              <p className="text-muted-foreground mb-1 text-xs">{dict.admin.internalEmail}</p>
              <p className="font-mono text-xs break-all">{listing.internal_email ?? "—"}</p>
            </div>
          </Panel>

          <Panel title={dict.admin.sectionMeta}>
            <dl className="grid gap-1.5">
              <Row label={dict.admin.views}>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="text-muted-foreground size-4" />
                  {listing.views_count}
                </span>
              </Row>
              <Row label={dict.admin.createdAt}>{formatDate(listing.created_at, locale)}</Row>
              <Row label={dict.admin.expires}>
                {listing.expires_at ? formatDate(listing.expires_at, locale) : "—"}
              </Row>
              <Row label={dict.admin.version}>{listing.published_version}</Row>
              <Row label={dict.admin.id}>
                <span className="font-mono text-xs">{listing.id}</span>
              </Row>
            </dl>
          </Panel>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <History className="text-muted-foreground size-4" />
          <h2 className="font-semibold">{dict.admin.history}</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">—</p>
        ) : (
          <ol className="grid gap-4 border-l pl-5">
            {history.map((event) => (
              <li key={event.id} className="relative">
                <span className="bg-primary absolute top-1.5 -left-[26px] size-2.5 rounded-full" />
                <div className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="font-medium">
                    {dict.moderationAction[event.action as keyof typeof dict.moderationAction]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(event.created_at, locale)}
                  </span>
                  {event.actor_name ? (
                    <span className="text-muted-foreground text-xs">· {event.actor_name}</span>
                  ) : null}
                </div>
                {event.comment ? (
                  <p className="text-muted-foreground mt-0.5 text-sm">{event.comment}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      <Separator />
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/admin/listings`}>← {dict.admin.allListings}</Link>
        </Button>
      </div>
    </div>
  );
}
