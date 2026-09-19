"use client";

import Link from "next/link";
import { useState } from "react";
import { GOVERNORATES } from "@/lib/governorates";
import { formatTND } from "@/lib/money";
import type { Dict } from "@/lib/i18n";
import { useCart } from "./CartProvider";
import { LineThumb } from "./LineThumb";
import { useQuote } from "./useQuote";

/**
 * Quote request for the current selection. Same cart lines as checkout, but no payment:
 * the server re-prices them only to show an indicative total and to reject impossible options.
 */
export function QuoteForm({ locale, t }: { locale: "fr" | "ar"; t: Pick<Dict, "quote" | "cart" | "checkout"> }) {
  const { lines, ready, clear } = useCart();
  const { quote, loading } = useQuote(lines, ready, locale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);
  const q = t.quote;

  if (ready && !lines.length) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center ring-1 ring-stone-200">
        <p className="text-lg text-stone-600">{q.empty}</p>
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
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity, selections: l.selections })),
          customer: f,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.quoteUrl) {
        clear();
        window.location.assign(data.quoteUrl);
        return;
      }
      setBadFields(data.fields ?? []);
      setError(q.error);
    } catch {
      setError(q.error);
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
          <legend className="px-1 text-lg font-extrabold">{q.yourDetails}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {field("firstName", t.checkout.firstName, { autoComplete: "given-name", maxLength: 60 })}
            {field("lastName", t.checkout.lastName, { autoComplete: "family-name", maxLength: 60 })}
            <div className="sm:col-span-2">
              {field("company", q.company, { required: false, autoComplete: "organization", maxLength: 120 })}
            </div>
            {field("email", t.checkout.email, { type: "email", autoComplete: "email", dir: "ltr", maxLength: 120 })}
            {field("phone", t.checkout.phone, { type: "tel", autoComplete: "tel", dir: "ltr", placeholder: "98 000 000", inputMode: "tel" })}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
          <legend className="px-1 text-lg font-extrabold">{q.yourNeed}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{q.governorate}</span>
              <select name="governorate" className="field" defaultValue="">
                <option value="">{q.governorateAny}</option>
                {GOVERNORATES.map((g) => (
                  <option key={g.code} value={g.code}>{locale === "ar" ? g.ar : g.fr}</option>
                ))}
              </select>
            </label>
            {field("city", q.city, { required: false, autoComplete: "address-level2", maxLength: 80 })}
            <div className="sm:col-span-2">
              {field("deadline", q.deadline, { required: false, maxLength: 120, placeholder: q.deadlinePlaceholder })}
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold">{q.message}</span>
              <textarea name="message" rows={4} maxLength={2000} className="field" dir="auto" placeholder={q.messagePlaceholder} />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-stone-200 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-extrabold">{q.items}</h2>
        <ul className="mb-4 space-y-3">
          {lines.map((l, i) => (
            <li key={l.lineId} className="flex items-center gap-3 text-sm">
              <LineThumb line={l} className="h-12 w-14" />
              <span className="flex-1">
                {locale === "ar" ? l.nameAr : l.nameFr} <span className="text-stone-500">× {l.quantity}</span>
              </span>
              <span className="font-semibold">
                {formatTND(quote?.lines.find((x) => x.index === i)?.lineTotal ?? l.unitPrice * l.quantity, locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className={`border-t border-stone-200 pt-3 text-sm ${loading ? "opacity-60" : ""}`}>
          <div className="flex justify-between font-bold">
            <span>{q.indicative}</span>
            <span>{quote ? formatTND(quote.subtotal, locale) : "—"}</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">{q.indicativeNote}</p>
        </div>
        <Link href={`/${locale}/panier`} className="mt-4 block text-sm font-semibold text-brand hover:underline">
          {t.cart.title} →
        </Link>
        <button type="submit" disabled={busy || !quote || quote.invalid.length > 0} className="btn-primary mt-4 w-full text-lg">
          {busy ? q.sending : q.submit}
        </button>
        {error && <p className="mt-3 text-sm font-semibold text-brand" role="alert">{error}</p>}
      </aside>
    </form>
  );
}
