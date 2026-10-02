import { createClient } from "@/lib/supabase/server";
import { getNeighborhoods } from "@/features/listings/server/queries";
import { ListingForm, createDefaults } from "@/features/listings/components/listing-form";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  const supabase = await createClient();
  const neighborhoods = await getNeighborhoods(supabase).catch(() => []);

  return <ListingForm mode="create" neighborhoods={neighborhoods} defaults={createDefaults} />;
}
