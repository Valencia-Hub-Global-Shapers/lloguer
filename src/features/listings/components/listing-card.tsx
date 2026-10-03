"use client";

import Link from "next/link";
import { BedDouble, Cigarette, Home, PawPrint, Receipt, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/client";
import { photoUrl } from "../photos";
import type { ListingCardData } from "../types";

export function ListingCard({
  listing,
  active,
  onHover,
}: {
  listing: ListingCardData;
  active?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const { locale, t, plural } = useI18n();
  const firstPhoto = listing.photos[0];

  return (
    <Link
      href={`/${locale}/listing/${listing.id}`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(listing.id)}
      onBlur={() => onHover?.(null)}
      className={cn(
        "bg-card focus-visible:ring-ring flex gap-3 rounded-xl border p-3 shadow-xs transition-shadow outline-none hover:shadow-sm focus-visible:ring-2",
        active && "ring-primary ring-2",
      )}
    >
      <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg sm:size-28">
        {firstPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(firstPhoto)}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <Home className="size-6" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-primary text-base font-bold tracking-tight">
            {listing.price} {t("listing.perMonth")}
          </span>
          <Badge variant="secondary">
            {listing.type === "room" ? t("listing.typeRoom") : t("listing.typeFullFlat")}
          </Badge>
        </div>
        <p className="truncate text-sm font-medium">
          {listing.neighborhood ?? listing.municipality}
          {listing.room_type && listing.type === "room"
            ? ` · ${t(`listing.room${listing.room_type[0].toUpperCase()}${listing.room_type.slice(1)}`)}`
            : ""}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {listing.bills_included ? (
            <span className="inline-flex items-center gap-1">
              <Receipt className="size-3" />
              {t("listing.billsIncluded")}
            </span>
          ) : null}
          {listing.flatmates != null && listing.type === "room" ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" />
              {plural("listing.flatmates", listing.flatmates)}
            </span>
          ) : null}
          {listing.pets ? (
            <span className="inline-flex items-center gap-1">
              <PawPrint className="size-3" />
              {t("listing.petsYes")}
            </span>
          ) : null}
          {listing.smokers ? (
            <span className="inline-flex items-center gap-1">
              <Cigarette className="size-3" />
              {t("listing.smokersYes")}
            </span>
          ) : null}
          {listing.bedrooms != null && listing.type === "full_flat" ? (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3" />
              {t("listing.bedrooms", { count: listing.bedrooms })}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-auto text-xs">
          {listing.available_from && listing.available_from > new Date().toISOString().slice(0, 10)
            ? t("listing.availableFrom", { date: formatDate(listing.available_from, locale) })
            : t("listing.availableNow")}
        </p>
      </div>
    </Link>
  );
}
