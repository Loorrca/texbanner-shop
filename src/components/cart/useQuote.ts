"use client";

import { useEffect, useState } from "react";
import type { CartLine } from "./CartProvider";

export type QuoteLine = { index: number; unitPrice: number; lineTotal: number; resolved: { label: string; valueLabel: string }[] };
export type Quote = { lines: QuoteLine[]; invalid: number[]; subtotal: number; shipping: number; total: number };

/** Server-side prices for the current cart (authoritative). */
export function useQuote(lines: CartLine[], ready: boolean, locale: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(lines.map((l) => [l.slug, l.quantity, l.selections]));

  useEffect(() => {
    if (!ready) return;
    if (!lines.length) {
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity, selections: l.selections })) }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => setQuote(q))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, locale]);

  return { quote, loading };
}
