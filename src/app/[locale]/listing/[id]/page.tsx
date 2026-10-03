import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getListingForAdmin,
  getPublicListingById,
} from "@/features/listings/server/queries";
import { ListingDetail } from "@/features/listings/components/listing-detail";
import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/types/database.types";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const listing = await getPublicListingById(supabase, id).catch(() => null);
  if (!listing) return {};
  return {
    title: `${listing.price} € · ${listing.neighborhood ?? listing.municipality} | Lloguer`,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const pub = await getPublicListingById(supabase, id).catch(() => null);

  let listing: PublicListing | null = pub;
  let isPreview = false;

  if (!listing) {
    // Admin preview of a non-public listing (RLS restricts to admins)
    const own = await getListingForAdmin(supabase, id).catch(() => null);
    if (!own) notFound();
    // Strip the exact location and the private fields from the preview payload
    const { location, edit_token_hash, internal_email, ...safe } = own;
    void location;
    void edit_token_hash;
    void internal_email;
    listing = safe as unknown as PublicListing;
    isPreview = true;
  }

  return <ListingDetail listing={listing} isPreview={isPreview} />;
}
