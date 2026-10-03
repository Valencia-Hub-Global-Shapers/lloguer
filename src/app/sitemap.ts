import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import type { Database } from "@/lib/types/database.types";

export const dynamic = "force-dynamic";

const STATIC_PATHS = ["", "/map", "/publish", "/legal"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").origin;
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${origin}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
      });
    }
  }

  // Live listings, in all three locales.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient<Database>(supabaseUrl, supabaseKey);
      const { data } = await supabase.from("public_listings").select("id").limit(2000);
      for (const locale of locales) {
        for (const listing of data ?? []) {
          entries.push({
            url: `${origin}/${locale}/listing/${listing.id}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.6,
          });
        }
      }
    } catch (e) {
      console.error("sitemap: could not fetch listings:", e);
    }
  }

  return entries;
}
