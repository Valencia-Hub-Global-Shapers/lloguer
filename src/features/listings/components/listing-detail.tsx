"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Calendar,
  Cigarette,
  ExternalLink,
  Mail,
  Eye,
  Home,
  PawPrint,
  Receipt,
  Sparkles,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/client";
import { formatDate } from "@/lib/utils";
import type { PublicListing } from "@/lib/types/database.types";
import { ListingMiniMap } from "@/features/map/components/listing-mini-map";
import { StoryDialog } from "@/features/story/components/story-dialog";
import { StatusBadge } from "./status-badge";
import { photoUrl } from "../photos";

function Attr({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function ListingDetail({
  listing,
  isPreview,
}: {
  listing: PublicListing;
  /** admin preview of a non-public listing */
  isPreview: boolean;
}) {
  const { locale, t, plural } = useI18n();

  // Fire-and-forget view count (deduped server-side per day)
  useEffect(() => {
    if (isPreview) return;
    fetch(`/api/listings/${listing.id}/view`, { method: "POST" }).catch(() => {});
  }, [listing.id, isPreview]);

  // The manage page links here with ?story to open the generator straight away
  const [storyOpen, setStoryOpen] = useState(false);
  useEffect(() => {
    if (!isPreview && new URLSearchParams(window.location.search).has("story")) {
      setStoryOpen(true);
    }
  }, [isPreview]);

  const whatsappDigits = listing.contact_whatsapp?.replace(/[^0-9]/g, "");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 pb-16">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/map`}>← {t("common.back")}</Link>
        </Button>
        {isPreview ? (
          <StatusBadge status={listing.status} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setStoryOpen(true)}>
            <Sparkles />
            {t("story.open")}
          </Button>
        )}
      </div>

      {/* Gallery */}
      {listing.photos.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl">
          {listing.photos.map((path, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={path}
              src={photoUrl(path)}
              alt={`Photo ${i + 1}`}
              className="h-64 w-full shrink-0 snap-center rounded-xl object-cover sm:h-80"
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted text-muted-foreground flex h-48 items-center justify-center rounded-xl">
          <Home className="size-8" />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {listing.price} {t("listing.perMonth")}
        </h1>
        <div className="flex gap-2">
          <Badge variant="secondary">
            {listing.type === "room" ? t("listing.typeRoom") : t("listing.typeFullFlat")}
          </Badge>
          {listing.room_type ? (
            <Badge variant="outline">
              {t(
                `listing.room${listing.room_type[0].toUpperCase()}${listing.room_type.slice(1)}`,
              )}
            </Badge>
          ) : null}
        </div>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        {listing.neighborhood ?? listing.municipality}
        {listing.neighborhood ? ` · ${listing.municipality}` : ""}
      </p>

      <Separator className="my-4" />

      {/* Attributes */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        <Attr
          icon={<Calendar />}
          label={
            listing.available_from && listing.available_from > today
              ? t("listing.availableFrom", { date: formatDate(listing.available_from, locale) })
              : t("listing.availableNow")
          }
        />
        <Attr
          icon={<Receipt />}
          label={listing.bills_included ? t("listing.billsIncluded") : t("listing.billsNotIncluded")}
        />
        {listing.deposit != null ? (
          <Attr icon={<Wallet />} label={t("listing.deposit", { amount: listing.deposit })} />
        ) : null}
        {listing.type === "room" && listing.flatmates != null ? (
          <Attr icon={<Users />} label={plural("listing.flatmates", listing.flatmates)} />
        ) : null}
        {listing.type === "full_flat" && listing.bedrooms != null ? (
          <Attr icon={<BedDouble />} label={plural("listing.bedrooms", listing.bedrooms)} />
        ) : null}
        {listing.bathrooms != null ? (
          <Attr icon={<Bath />} label={plural("listing.bathrooms", listing.bathrooms)} />
        ) : null}
        <Attr icon={<PawPrint />} label={listing.pets ? t("listing.petsYes") : t("listing.petsNo")} />
        <Attr
          icon={<Cigarette />}
          label={listing.smokers ? t("listing.smokersYes") : t("listing.smokersNo")}
        />
        <Attr
          icon={<User />}
          label={t(
            `listing.gender${listing.preferred_gender === "any" ? "Any" : listing.preferred_gender === "female" ? "Female" : listing.preferred_gender === "male" ? "Male" : "NonBinary"}`,
          )}
        />
        <Attr
          icon={<Users />}
          label={t(
            `listing.tenant${listing.tenant_pref === "any" ? "Any" : listing.tenant_pref === "students" ? "Students" : "Workers"}`,
          )}
        />
        <Attr icon={<Eye />} label={plural("listing.views", listing.views_count)} />
      </div>

      <Separator className="my-4" />

      {/* Description: rendered as plain text only */}
      <h2 className="mb-2 font-semibold">{t("listing.description")}</h2>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>

      <Separator className="my-4" />

      {/* Contact */}
      <h2 className="mb-3 font-semibold">{t("listing.contact")}</h2>
      <div className="flex flex-wrap gap-2">
        {whatsappDigits ? (
          <Button asChild size="lg">
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("listing.whatsappCta")}
            </a>
          </Button>
        ) : null}
        {listing.contact_email ? (
          <Button asChild variant={whatsappDigits ? "outline" : "default"} size="lg">
            <a href={`mailto:${listing.contact_email}`}>
              <Mail />
              {t("listing.emailCta")}
            </a>
          </Button>
        ) : null}
        {listing.contact_external ? (
          <Button asChild variant="outline" size="lg">
            <a href={listing.contact_external} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {t("listing.externalCta")}
            </a>
          </Button>
        ) : null}
      </div>

      {!isPreview ? (
        <div className="bg-card mt-6 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="font-semibold">{t("story.promoTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{t("story.promoBody")}</p>
          </div>
          <Button variant="brand" onClick={() => setStoryOpen(true)}>
            <Sparkles />
            {t("story.open")}
          </Button>
        </div>
      ) : null}

      <div className="mt-6">
        <ListingMiniMap lat={Number(listing.public_lat)} lng={Number(listing.public_lng)} />
      </div>

      {!isPreview ? (
        <StoryDialog listing={listing} open={storyOpen} onOpenChange={setStoryOpen} />
      ) : null}
    </main>
  );
}
