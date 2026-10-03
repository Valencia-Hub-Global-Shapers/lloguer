import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Lloguer · Global Shapers Valencia",
  description:
    "Vivienda asequible entre particulares en toda España. Una iniciativa sin ánimo de lucro de Global Shapers Valencia Hub.",
  openGraph: {
    type: "website",
    siteName: "Lloguer",
    title: "Lloguer · Vivienda asequible entre particulares en toda España",
    description:
      "Mapa abierto de vivienda asequible en toda España: gratis, sin registro y con cada anuncio revisado.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lloguer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lloguer · Vivienda asequible entre particulares en toda España",
    description:
      "Mapa abierto de vivienda asequible en toda España: gratis, sin registro y con cada anuncio revisado.",
    images: ["/og.png"],
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale ?? "es"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Root layout: the fonts load for every page, which is what the rule wants to guarantee */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Work+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
