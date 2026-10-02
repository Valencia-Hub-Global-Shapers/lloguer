"use client";

import { usePathname } from "next/navigation";

/** The home page is a full-screen map app, so it has no footer. */
export function HideOnHome({ locale, children }: { locale: string; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === `/${locale}` || pathname === `/${locale}/`) return null;
  return <>{children}</>;
}
