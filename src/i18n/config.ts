export const locales = ["es", "va", "en", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const localeLabels: Record<Locale, string> = {
  es: "Español",
  va: "Valencià",
  en: "English",
  pt: "Português",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
