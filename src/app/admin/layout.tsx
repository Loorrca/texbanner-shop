import Link from "next/link";
import { Brand } from "@/components/Brand";
import "../globals.css";

export const metadata = { title: "Admin · Tex Banner", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-stone-100 font-sans">
        <header className="bg-ink text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
            <Link href="/admin" className="flex items-center gap-3 font-extrabold">
              <Brand size="sm" />
              <span>Admin</span>
            </Link>
            <nav className="flex gap-4 text-sm font-semibold text-stone-300">
              <Link href="/admin" className="hover:text-white">Commandes</Link>
              <Link href="/admin/products" className="hover:text-white">Catalogue</Link>
              <Link href="/admin/emblems" className="hover:text-white">Drapeaux & emblèmes</Link>
              <Link href="/fr" className="hover:text-white">Voir la boutique ↗</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
