"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartButton({ locale, label }: { locale: string; label: string }) {
  const { count, ready } = useCart();
  return (
    <Link href={`/${locale}/panier`} className="relative inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-bold transition hover:bg-brand-dark">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
      {ready && count > 0 && (
        <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-extrabold text-ink">{count}</span>
      )}
    </Link>
  );
}
