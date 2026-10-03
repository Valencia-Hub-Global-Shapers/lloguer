"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/i18n/config";

export function UserMenu({
  locale,
  fullName,
  avatarUrl,
  isAdmin,
}: {
  locale: Locale;
  fullName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const initials = (fullName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Only admins ever hold a session, so send them straight back to the login
    // form with a confirmation, ready to request a fresh magic link.
    router.push(`/${locale}/login?signedout=1`);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={fullName ?? "account"}>
          <Avatar>
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName ?? ""} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="max-w-48 truncate">{fullName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin/moderation`}>
              <ShieldCheck />
              {t("common.moderation")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut />
          {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
