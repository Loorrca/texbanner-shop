import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { dir, getDict, isLocale } from "@/lib/i18n";

// Catalog and prices come from the database: render on request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    title: { default: `Tex Banner — ${t.tagline}`, template: "%s · Tex Banner" },
    description: t.hero.subtitle,
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    alternates: { languages: { fr: "/fr", ar: "/ar" } },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={dir(locale)}>
      <body className="min-h-screen font-sans">
        <CartProvider>
          <Header locale={locale} />
          <main>{children}</main>
          <Footer locale={locale} />
        </CartProvider>
      </body>
    </html>
  );
}
