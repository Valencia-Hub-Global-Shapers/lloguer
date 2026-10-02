import type { ListingType } from "@/lib/types/database.types";

export type FilterGender = "female" | "male" | "non_binary";

export type FilterState = {
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  /** neighborhood slug */
  neighborhood?: string;
  billsIncluded?: boolean;
  pets?: boolean;
  smokers?: boolean;
  maxFlatmates?: number;
  /** show listings that accept this gender (open to anyone, or asking for it) */
  gender?: FilterGender;
  /** ISO date (YYYY-MM-DD): show listings available on or before this date */
  availableBefore?: string;
};

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function get(raw: RawParams, key: string): string | undefined {
  if (raw instanceof URLSearchParams) return raw.get(key) ?? undefined;
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
}

function toInt(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

function toGender(v: string | undefined): FilterGender | undefined {
  return v === "female" || v === "male" || v === "non_binary" ? v : undefined;
}

export function parseFilters(raw: RawParams): FilterState {
  const type = get(raw, "type");
  const avail = get(raw, "avail");
  return {
    type: type === "room" || type === "full_flat" ? type : undefined,
    minPrice: toInt(get(raw, "min")),
    maxPrice: toInt(get(raw, "max")),
    neighborhood: get(raw, "hood") || undefined,
    billsIncluded: get(raw, "bills") === "1" || undefined,
    pets: get(raw, "pets") === "1" || undefined,
    smokers: get(raw, "smokers") === "1" || undefined,
    maxFlatmates: toInt(get(raw, "mates")),
    gender: toGender(get(raw, "gender")),
    availableBefore: avail && /^\d{4}-\d{2}-\d{2}$/.test(avail) ? avail : undefined,
  };
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.type) p.set("type", filters.type);
  if (filters.minPrice != null) p.set("min", String(filters.minPrice));
  if (filters.maxPrice != null) p.set("max", String(filters.maxPrice));
  if (filters.neighborhood) p.set("hood", filters.neighborhood);
  if (filters.billsIncluded) p.set("bills", "1");
  if (filters.pets) p.set("pets", "1");
  if (filters.smokers) p.set("smokers", "1");
  if (filters.maxFlatmates != null) p.set("mates", String(filters.maxFlatmates));
  if (filters.gender) p.set("gender", filters.gender);
  if (filters.availableBefore) p.set("avail", filters.availableBefore);
  return p;
}

export function countActiveFilters(f: FilterState): number {
  return [
    f.type,
    f.minPrice,
    f.maxPrice,
    f.neighborhood,
    f.billsIncluded,
    f.pets,
    f.smokers,
    f.maxFlatmates,
    f.gender,
    f.availableBefore,
  ].filter((v) => v !== undefined && v !== false).length;
}

export const EMPTY_FILTERS: FilterState = {};
