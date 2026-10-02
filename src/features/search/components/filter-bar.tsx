"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import type { PublicPlace } from "@/lib/types/database.types";
import {
  countActiveFilters,
  filtersToSearchParams,
  parseFilters,
  type FilterGender,
} from "../params";
import { useMemo, useState } from "react";
import { groupPlaces } from "../places";

const SEP = "\u0001";

function encodePlace(city: string, hood?: string): string {
  return hood ? `${city}${SEP}${hood}` : city;
}

function decodePlace(value: string): [string, string | undefined] {
  const [city, hood] = value.split(SEP);
  return [city, hood || undefined];
}

function placeValue(f: { city?: string; neighborhood?: string }): string {
  return f.city ? encodePlace(f.city, f.neighborhood) : "all";
}

export function FilterBar({ places }: { places: PublicPlace[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const filters = parseFilters(searchParams);
  const groups = useMemo(() => groupPlaces(places), [places]);
  const activeCount = countActiveFilters(filters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [price, setPrice] = useState<{ min?: string; max?: string }>({});

  const apply = (patch: Partial<ReturnType<typeof parseFilters>>) => {
    const next = { ...filters, ...patch };
    // strip undefined/empty
    for (const k of Object.keys(next) as (keyof typeof next)[]) {
      if (next[k] === undefined || next[k] === false) delete next[k];
    }
    const qs = filtersToSearchParams(next).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const reset = () => router.replace(pathname, { scroll: false });

  return (
    <div className="flex items-center gap-2 overflow-x-auto p-3">
      <ToggleGroup
        type="single"
        value={filters.type ?? "all"}
        onValueChange={(v) =>
          apply({ type: v === "room" || v === "full_flat" ? v : undefined })
        }
        aria-label={t("filters.type")}
      >
        <ToggleGroupItem value="all">{t("common.all")}</ToggleGroupItem>
        <ToggleGroupItem value="room">{t("listing.typeRoom")}</ToggleGroupItem>
        <ToggleGroupItem value="full_flat">{t("listing.typeFullFlat")}</ToggleGroupItem>
      </ToggleGroup>

      <Select
        value={placeValue(filters)}
        onValueChange={(v) => {
          if (v === "all") return apply({ city: undefined, neighborhood: undefined });
          const [city, hood] = decodePlace(v);
          apply({ city, neighborhood: hood });
        }}
      >
        <SelectTrigger className="w-auto min-w-32" aria-label={t("filters.place")}>
          <SelectValue placeholder={t("filters.place")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.allPlaces")}</SelectItem>
          {/* A place that no longer has live listings stays selectable while active */}
          {filters.city && !groups.some((g) => g.municipality === filters.city) ? (
            <SelectItem value={encodePlace(filters.city, filters.neighborhood)}>
              {filters.neighborhood ? `${filters.neighborhood}, ${filters.city}` : filters.city}
            </SelectItem>
          ) : null}
          {groups.map((g) => (
            <SelectGroup key={g.municipality}>
              <SelectItem value={encodePlace(g.municipality)}>
                {g.municipality} ({g.listings})
              </SelectItem>
              {g.neighborhoods.map((n) => (
                <SelectItem key={n.name} value={encodePlace(g.municipality, n.name)}>
                  <span className="text-muted-foreground pl-3">
                    {n.name} ({n.listings})
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <Popover
        onOpenChange={(open) => {
          if (open)
            setPrice({
              min: filters.minPrice?.toString() ?? "",
              max: filters.maxPrice?.toString() ?? "",
            });
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full">
            {filters.minPrice != null || filters.maxPrice != null
              ? `${filters.minPrice ?? 0}–${filters.maxPrice ?? "∞"} €`
              : t("filters.price")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label htmlFor="price-min">{t("filters.priceMin")}</Label>
                <Input
                  id="price-min"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={price.min ?? ""}
                  onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="price-max">{t("filters.priceMax")}</Label>
                <Input
                  id="price-max"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={price.max ?? ""}
                  onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                apply({
                  minPrice: price.min ? Number(price.min) : undefined,
                  maxPrice: price.max ? Number(price.max) : undefined,
                })
              }
            >
              {t("filters.apply")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
            <SlidersHorizontal className="size-3.5" />
            {t("filters.title")}
            {activeCount > 0 ? <Badge variant="accent">{activeCount}</Badge> : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{t("filters.title")}</SheetTitle>
          </SheetHeader>
          <div className="grid gap-5 p-4 pt-0">
            {(
              [
                ["billsIncluded", "filters.billsIncluded"],
                ["pets", "filters.pets"],
                ["smokers", "filters.smokers"],
              ] as const
            ).map(([key, labelKey]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label htmlFor={`filter-${key}`}>{t(labelKey)}</Label>
                <Switch
                  id={`filter-${key}`}
                  checked={Boolean(filters[key])}
                  onCheckedChange={(checked) =>
                    apply({ [key]: checked ? true : undefined })
                  }
                />
              </div>
            ))}

            <div className="grid gap-1.5">
              <Label htmlFor="filter-mates">{t("filters.flatmates")}</Label>
              <Select
                value={filters.maxFlatmates?.toString() ?? "any"}
                onValueChange={(v) =>
                  apply({ maxFlatmates: v === "any" ? undefined : Number(v) })
                }
              >
                <SelectTrigger id="filter-mates">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("common.any")}</SelectItem>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      ≤ {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="filter-gender">{t("filters.gender")}</Label>
              <Select
                value={filters.gender ?? "any"}
                onValueChange={(v) =>
                  apply({ gender: v === "any" ? undefined : (v as FilterGender) })
                }
              >
                <SelectTrigger id="filter-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("common.any")}</SelectItem>
                  <SelectItem value="female">{t("listing.genderFemale")}</SelectItem>
                  <SelectItem value="male">{t("listing.genderMale")}</SelectItem>
                  <SelectItem value="non_binary">{t("listing.genderNonBinary")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{t("filters.genderHint")}</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="filter-avail">{t("filters.availableBefore")}</Label>
              <Input
                id="filter-avail"
                type="date"
                value={filters.availableBefore ?? ""}
                onChange={(e) =>
                  apply({ availableBefore: e.target.value || undefined })
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                {t("filters.reset")}
              </Button>
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                {t("filters.apply")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={reset}>
          {t("filters.reset")}
        </Button>
      ) : null}
    </div>
  );
}
