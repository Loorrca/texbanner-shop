"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Selections } from "@/lib/options";

export type CartLine = {
  lineId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  preview: string | null;
  image: string | null;
  /** Indicative unit price shown in the UI; the server re-prices on checkout */
  unitPrice: number;
  quantity: number;
  selections: Selections;
  /** Upload id -> original file name, for display */
  uploadNames?: Record<string, string>;
};

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (line: Omit<CartLine, "lineId">) => void;
  setQuantity: (lineId: string, q: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "texbanner-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* storage unavailable: cart lives in memory only */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "lineId">) => {
    setLines((prev) => {
      const same = prev.find((l) => l.slug === line.slug && JSON.stringify(l.selections) === JSON.stringify(line.selections));
      if (same) return prev.map((l) => (l === same ? { ...l, quantity: Math.min(500, l.quantity + line.quantity) } : l));
      return [...prev, { ...line, lineId: crypto.randomUUID() }];
    });
  }, []);
  const setQuantity = useCallback((lineId: string, q: number) => {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.max(1, Math.min(500, Math.floor(q) || 1)) } : l)));
  }, []);
  const remove = useCallback((lineId: string) => setLines((prev) => prev.filter((l) => l.lineId !== lineId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, ready, count: lines.reduce((n, l) => n + l.quantity, 0), add, setQuantity, remove, clear }),
    [lines, ready, add, setQuantity, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
