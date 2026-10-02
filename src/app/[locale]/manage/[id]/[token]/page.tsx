import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hashEditToken, isWellFormedToken } from "@/lib/edit-token";
import { getListingByToken } from "@/features/listings/server/queries";
import { ListingForm } from "@/features/listings/components/listing-form";
import { ManagePanel } from "@/features/listings/components/manage-panel";
import { VALENCIA_CENTER } from "@/lib/utils";
import type { SubmissionValues } from "@/features/listings/schemas";

export const dynamic = "force-dynamic";

// The URL carries a secret: keep it out of search engines and referrers.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ManageListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; token: string }>;
}) {
  const { id, token } = await params;
  if (!isWellFormedToken(token)) notFound();

  const supabase = await createClient();
  const listing = await getListingByToken(supabase, id, hashEditToken(token)).catch(() => null);
  if (!listing) notFound();


  const defaults: SubmissionValues = {
    type: listing.type,
    lat: listing.lat ?? VALENCIA_CENTER[1],
    lng: listing.lng ?? VALENCIA_CENTER[0],
    neighborhood: listing.neighborhood ?? "",
    municipality: listing.municipality,
    price: listing.price,
    description: listing.description,
    available_from: listing.available_from ?? "",
    bills_included: listing.bills_included,
    deposit: listing.deposit,
    flatmates: listing.flatmates,
    preferred_gender: listing.preferred_gender,
    room_type: listing.room_type,
    pets: listing.pets,
    smokers: listing.smokers,
    tenant_pref: listing.tenant_pref,
    bathrooms: listing.bathrooms,
    bedrooms: listing.bedrooms,
    contact_whatsapp: listing.contact_whatsapp ?? "",
    contact_external: listing.contact_external ?? "",
    photos: listing.photos,
    contact_email: listing.contact_email ?? "",
    internal_email: listing.internal_email ?? "",
    accept_terms: true,
    website: "",
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ManagePanel
        id={listing.id}
        token={token}
        status={listing.status}
        expiresAt={listing.expires_at}
        rejectionComment={listing.rejection_comment}
      />
      <ListingForm
        mode="edit"
        listingId={listing.id}
        token={token}
        defaults={defaults}
      />
    </div>
  );
}
