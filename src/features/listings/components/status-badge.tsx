"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/client";
import type { ListingStatus } from "@/lib/types/database.types";

const VARIANTS: Record<
  ListingStatus,
  "default" | "secondary" | "destructive" | "outline" | "accent" | "muted"
> = {
  draft: "muted",
  pending: "accent",
  approved: "default",
  rejected: "destructive",
  expired: "secondary",
};

const KEYS: Record<ListingStatus, string> = {
  draft: "listing.statusDraft",
  pending: "listing.statusPending",
  approved: "listing.statusApproved",
  rejected: "listing.statusRejected",
  expired: "listing.statusExpired",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const { t } = useI18n();
  return <Badge variant={VARIANTS[status]}>{t(KEYS[status])}</Badge>;
}
