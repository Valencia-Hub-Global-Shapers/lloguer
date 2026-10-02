import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllListings } from "@/features/moderation/server/queries";
import { StatusBadge } from "@/features/listings/components/status-badge";
import { getDictionary } from "@/i18n/get-dictionary";
import { cn, formatDate } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { ListingStatus } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

const STATUSES: ListingStatus[] = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "draft",
];

const STATUS_LABEL_KEYS: Record<ListingStatus, keyof import("@/i18n/types").Dictionary["listing"]> = {
  draft: "statusDraft",
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  expired: "statusExpired",
};

export default async function AdminListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  const dict = await getDictionary(locale);

  const active = STATUSES.includes(status as ListingStatus)
    ? (status as ListingStatus)
    : undefined;

  const supabase = await createClient();
  const listings = await getAllListings(supabase, active);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{dict.admin.allListings}</h1>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip
          href={`/${locale}/admin/listings`}
          label={dict.common.all}
          active={!active}
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/${locale}/admin/listings?status=${s}`}
            label={dict.listing[STATUS_LABEL_KEYS[s]]}
            active={active === s}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b text-left text-xs">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">{dict.filters.price}</th>
              <th className="p-3 font-medium">{dict.filters.neighborhood}</th>
              <th className="p-3 font-medium">{dict.admin.status}</th>
              <th className="p-3 font-medium">{dict.admin.createdAt}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{listing.id.slice(0, 8)}</td>
                <td className="p-3 font-semibold">{listing.price} €</td>
                <td className="p-3">{listing.neighborhood ?? listing.municipality}</td>
                <td className="p-3">
                  <StatusBadge status={listing.status} />
                </td>
                <td className="text-muted-foreground p-3 text-xs">
                  {formatDate(listing.created_at, locale)}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/listings/${listing.id}`}
                    className="text-primary hover:underline"
                  >
                    {dict.common.view}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-accent",
      )}
    >
      {label}
    </Link>
  );
}
