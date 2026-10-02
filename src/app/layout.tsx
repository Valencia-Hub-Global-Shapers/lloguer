import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyLloguer — Lloguers a Espanya",
  description:
    "Habitacions i pisos entre particulars a tot Espanya.",
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
      <body>{children}</body>
    </html>
  );
}
