import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getPendingCount } from "@/features/moderation/server/queries";
import { requireAdmin } from "@/features/auth/server/session";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const pendingCount = await getPendingCount(supabase).catch(() => 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-16">
      <nav className="mb-4 flex items-center gap-4 border-b pb-3">
        <Link
          href={`/${locale}/admin/moderation`}
          className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          {dict.common.moderation}
          {pendingCount > 0 ? <Badge variant="accent">{pendingCount}</Badge> : null}
        </Link>
        <Link
          href={`/${locale}/admin/listings`}
          className="text-sm font-medium hover:underline"
        >
          {dict.common.allListings}
        </Link>
      </nav>
      {children}
    </main>
  );
}
