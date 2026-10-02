"use client";

import { createContext, useCallback, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { interpolate } from "./interpolate";
import { pluralKey } from "./plural";

type TFn = (key: string, vars?: Record<string, string | number>) => string;
/** Like t(), with {count} filled in; uses `${key}One` when count is 1 and that key exists. */
type PluralFn = (key: string, count: number, vars?: Record<string, string | number>) => string;

const I18nContext = createContext<{
  locale: Locale;
  dict: Dictionary;
  t: TFn;
  plural: PluralFn;
} | null>(null);

function resolve(dict: unknown, path: string): string {
  let node = dict as Record<string, unknown>;
  for (const part of path.split(".")) {
    if (node == null || typeof node !== "object") return path;
    node = node[part] as Record<string, unknown>;
  }
  return typeof node === "string" ? node : path;
}

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const t = useCallback<TFn>((key, vars) => interpolate(resolve(dict, key), vars), [dict]);
  const plural = useCallback<PluralFn>(
    (key, count, vars) => {
      const chosen = pluralKey(key, count, (k) => resolve(dict, k) !== k);
      return interpolate(resolve(dict, chosen), { count, ...vars });
    },
    [dict],
  );
  return (
    <I18nContext.Provider value={{ locale, dict, t, plural }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
