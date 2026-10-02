"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHandle } from "@/components/ui/drawer";
import { useI18n } from "@/i18n/client";
import type { PublicPlace } from "@/lib/types/database.types";
import { parseFilters } from "@/features/search/params";
import { placeBounds } from "@/features/search/places";
import { HUB_SITE_URL } from "@/lib/brand";
import { zoomForBounds } from "../clustering";
import { ListingCard } from "@/features/listings/components/listing-card";
import { FilterBar } from "@/features/search/components/filter-bar";
import type { Bounds, BrowseResponse } from "@/features/listings/types";
import { ExplorerMap, hasMapboxToken } from "./explorer-map";

type Props = {
  initialData: BrowseResponse;
  initialBounds: Bounds;
  places: PublicPlace[];
};

function ResultsList({
  data,
  loading,
  error,
  activeId,
  onHover,
  onRetry,
}: {
  data: BrowseResponse;
  loading: boolean;
  error: boolean;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onRetry: () => void;
}) {
  const { locale, t } = useI18n();

  if (loading && data.cards.length === 0) {
    return (
      <div className="grid gap-3 p-3" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border p-3">
            <Skeleton className="size-24 rounded-lg" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid place-items-center gap-3 p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("home.loadError")}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (data.cards.length === 0) {
    return (
      <div className="grid place-items-center gap-2 p-10 text-center">
        <p className="font-medium">{t("home.emptyTitle")}</p>
        <p className="text-muted-foreground text-sm">{t("home.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-3">
      <p className="text-muted-foreground px-1 text-xs" aria-live="polite">
        {t("home.results", { count: data.cards.length })}
        {loading ? " · " + t("common.loading") : ""}
      </p>
      {data.cards.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          active={activeId === listing.id}
          onHover={onHover}
        />
      ))}
      <p className="text-muted-foreground flex flex-wrap justify-center gap-x-3 p-2 text-center text-xs">
        <a href={`/${locale}/legal`} className="hover:underline">
          {t("common.legal")}
        </a>
        <a
          href={HUB_SITE_URL}
          target="_blank"
          rel="noopener"
          className="text-brand hover:underline"
        >
          {t("footer.initiative")}
        </a>
      </p>
    </div>
  );
}

export function MapExplorer({ initialData, initialBounds, places }: Props) {
  const { locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [snap, setSnap] = useState<number | string | null>("140px");
  const [focusBounds, setFocusBounds] = useState<Bounds | null>(null);

  const boundsRef = useRef<Bounds | null>(null);
  const zoomRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async (bounds: Bounds, zoom: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(false);
    try {
      const qs = new URLSearchParams(window.location.search);
      qs.set("minLat", String(bounds.minLat));
      qs.set("minLng", String(bounds.minLng));
      qs.set("maxLat", String(bounds.maxLat));
      qs.set("maxLng", String(bounds.maxLng));
      qs.set("zoom", String(zoom));
      const res = await fetch(`/api/listings?${qs.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as BrowseResponse;
      setData(json);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const onBoundsChange = useCallback(
    (bounds: Bounds, zoom: number) => {
      boundsRef.current = bounds;
      zoomRef.current = zoom;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fetchData(bounds, zoom), 300);
    },
    [fetchData],
  );

  const refetchCurrentView = useCallback(() => {
    const bounds = boundsRef.current ?? initialBounds;
    fetchData(bounds, zoomRef.current ?? zoomForBounds(bounds));
  }, [fetchData, initialBounds]);

  // Refetch when filters (URL) change
  const firstRun = useRef(true);
  const lastPlaceKey = useRef<string | null>(null);
  useEffect(() => {
    const filters = parseFilters(new URLSearchParams(searchKey));
    const placeKey = `${filters.city ?? ""}|${filters.neighborhood ?? ""}`;
    const placeChanged = lastPlaceKey.current !== null && lastPlaceKey.current !== placeKey;
    lastPlaceKey.current = placeKey;

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    // Picking a place moves the map there; the list follows even without a map
    const target = placeChanged ? placeBounds(places, filters) : null;
    if (target) {
      setFocusBounds(target);
      fetchData(target, zoomForBounds(target));
      return;
    }
    refetchCurrentView();
  }, [searchKey, fetchData, refetchCurrentView, places]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const openListing = useCallback(
    (id: string) => router.push(`/${locale}/listing/${id}`),
    [router, locale],
  );

  const retry = refetchCurrentView;

  const list = (
    <ResultsList
      data={data}
      loading={loading}
      error={error}
      activeId={activeId}
      onHover={setActiveId}
      onRetry={retry}
    />
  );

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] flex-col md:flex-row">
      {/* Desktop results panel */}
      <aside className="bg-background z-10 hidden w-[420px] shrink-0 flex-col border-r md:flex">
        <div className="border-b">
          <FilterBar places={places} />
        </div>
        <div className="flex-1 overflow-y-auto">{list}</div>
      </aside>

      {/* Map */}
      <div className="relative flex-1">
        {hasMapboxToken ? (
          <ExplorerMap
            pins={data.pins}
            activeId={activeId}
            onBoundsChange={onBoundsChange}
            onPinClick={openListing}
            onPinHover={setActiveId}
            initialBounds={[
              initialBounds.minLng,
              initialBounds.minLat,
              initialBounds.maxLng,
              initialBounds.maxLat,
            ]}
            focusBounds={
              focusBounds
                ? [focusBounds.minLng, focusBounds.minLat, focusBounds.maxLng, focusBounds.maxLat]
                : null
            }
          />
        ) : (
          <div className="bg-muted text-muted-foreground absolute inset-0 hidden items-center justify-center p-8 text-center text-sm md:flex">
            Mapbox token not configured (NEXT_PUBLIC_MAPBOX_TOKEN)
          </div>
        )}

        {/* Mobile filter bar overlay */}
        <div className="bg-background/90 absolute inset-x-0 top-0 z-10 border-b backdrop-blur md:hidden">
          <FilterBar places={places} />
        </div>

        {/* Mobile: no map token => plain list */}
        {!hasMapboxToken && (
          <div className="absolute inset-0 top-14 overflow-y-auto md:hidden">{list}</div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {hasMapboxToken && (
        <div className="md:hidden">
          <Drawer
            open
            modal={false}
            dismissible={false}
            snapPoints={["140px", 0.55, 0.92]}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
          >
            <DrawerContent className="max-h-[92dvh]" aria-label="Results">
              <DrawerHandle />
              <div className="min-h-0 flex-1 overflow-y-auto pb-6">{list}</div>
            </DrawerContent>
          </Drawer>
        </div>
      )}
    </div>
  );
}
