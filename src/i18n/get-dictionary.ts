import { defaultLocale, isLocale, type Locale } from "./config";
import type { Dictionary } from "./types";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import("./es.json").then((m) => m.default as Dictionary),
  va: () => import("./va.json").then((m) => m.default as Dictionary),
  en: () => import("./en.json").then((m) => m.default as Dictionary),
};

/** Accepts any string; falls back to the default locale for unknown values. */
export const getDictionary = (locale: string): Promise<Dictionary> =>
  dictionaries[isLocale(locale) ? locale : defaultLocale]();

export { interpolate } from "./interpolate";
