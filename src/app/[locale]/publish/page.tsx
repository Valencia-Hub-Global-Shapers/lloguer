import { ListingForm, createDefaults } from "@/features/listings/components/listing-form";

export const dynamic = "force-dynamic";

export default function PublishPage() {
  return <ListingForm mode="create" defaults={createDefaults} />;
}
