"use client";

import Link from "next/link";
import { useState } from "react";
import { GOVERNORATES } from "@/lib/governorates";
import { formatTND } from "@/lib/money";
import type { Dict } from "@/lib/i18n";
import { useCart } from "./CartProvider";
import { Totals } from "./CartView";
import { LineThumb } from "./LineThumb";
import { useQuote } from "./useQuote";

export function CheckoutForm({ locale, t }: { locale: "fr" | "ar"; t: Pick<Dict, "checkout" | "cart"> }) {
  const { lines, ready, clear } = useCart();
  const { quote, loading } = useQuote(lines, ready, locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);
  const c = t.checkout;

  if (ready && !lines.length) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-stone-200">
        <p className="text-lg text-stone-600">{t.cart.empty}</p>
        <Link href={`/${locale}`} className="btn-primary mt-6">{t.cart.continue}</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setBadFields([]);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity, selections: l.selections })),
          customer: f,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.orderUrl) clear();
      if (res.ok && data.payUrl) {
        window.location.assign(data.payUrl);
        return;
      }
      if (data.orderUrl) {
        window.location.assign(data.orderUrl);
        return;
      }
      setBadFields((data.issues ?? []).map((p: string) => p.replace("customer.", "")));
      setError(c.error);
    } catch {
      setError(c.error);
    }
    setBusy(false);
  }

  const field = (name: string, labelText: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{labelText}</span>
      <input name={name} className={`field ${badFields.includes(name) ? "border-brand ring-2 ring-brand/20" : ""}`} required {...props} />
    </label>
  );

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <fieldset className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <legend className="px-1 text-lg font-extrabold">{c.contact}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {field("firstName", c.firstName, { autoComplete: "given-name", maxLength: 60 })}
            {field("lastName", c.lastName, { autoComplete: "family-name", maxLength: 60 })}
            {field("email", c.email, { type: "email", autoComplete: "email", dir: "ltr", maxLength: 120 })}
            {field("phone", c.phone, { type: "tel", autoComplete: "tel", dir: "ltr", placeholder: "98 000 000", inputMode: "tel" })}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <legend className="px-1 text-lg font-extrabold">{c.delivery}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{c.governorate}</span>
              <select name="governorate" className="field" required defaultValue="tunis">
                {GOVERNORATES.map((g) => (
                  <option key={g.code} value={g.code}>{locale === "ar" ? g.ar : g.fr}</option>
                ))}
              </select>
            </label>
            {field("city", c.city, { autoComplete: "address-level2", maxLength: 80 })}
            <div className="sm:col-span-2">{field("address", c.address, { autoComplete: "street-address", maxLength: 250 })}</div>
            {field("postalCode", c.postalCode, { required: false, inputMode: "numeric", pattern: "\\d{4}", maxLength: 4, dir: "ltr", autoComplete: "postal-code" })}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold">{c.notes}</span>
              <textarea name="notes" rows={3} maxLength={1000} className="field" dir="auto" />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-stone-200 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-extrabold">{c.summary}</h2>
        <ul className="mb-4 space-y-3">
          {lines.map((l, i) => (
            <li key={l.lineId} className="flex items-center gap-3 text-sm">
              <LineThumb line={l} className="h-12 w-14" />
              <span className="flex-1">
                {locale === "ar" ? l.nameAr : l.nameFr} <span className="text-stone-500">× {l.quantity}</span>
              </span>
              <span className="font-semibold">{formatTND(quote?.lines.find((q) => q.index === i)?.lineTotal ?? l.unitPrice * l.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <Totals quote={quote} loading={loading} locale={locale} t={t.cart} />
        <button type="submit" disabled={busy || !quote || quote.invalid.length > 0} className="btn-primary mt-5 w-full text-lg">
          {busy ? c.paying : `${c.pay} ${quote ? formatTND(quote.total, locale) : ""}`}
        </button>
        <p className="mt-3 flex items-start gap-2 text-xs text-stone-500">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          {c.secure}
        </p>
        {error && <p className="mt-3 text-sm font-semibold text-brand" role="alert">{error}</p>}
      </aside>
    </form>
  );
}
