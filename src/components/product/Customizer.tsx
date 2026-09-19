"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductPreview } from "@/components/ProductPreview";
import { useCart } from "@/components/cart/CartProvider";
import { formatTND } from "@/lib/money";
import { defaultSelections, isVisible, label, resolveSelections, type ProductOption, type Selections } from "@/lib/options";
import type { CustomFlag } from "@/lib/countries";
import { CountryPicker } from "./CountryPicker";
import { UploadField, type UploadedFile } from "./UploadField";

type Strings = {
  addToCart: string; added: string; quantity: string; unitPrice: string; total: string; preview: string; photos: string;
  uploadHint: string; uploading: string; uploaded: string; remove: string; searchCountry: string; previewNote: string;
  missing: string; uploadError: string; cart: string; material: string;
};

type Props = {
  locale: string;
  product: { slug: string; nameFr: string; nameAr: string; preview: string | null; images: string[]; basePrice: number; options: ProductOption[] };
  t: Strings;
  customFlags?: CustomFlag[];
  hiddenFlags?: string[];
};

export function Customizer({ locale, product, t, customFlags = [], hiddenFlags = [] }: Props) {
  const { add } = useCart();
  const [selections, setSelections] = useState<Selections>(() => defaultSelections(product.options));
  const [files, setFiles] = useState<Record<string, UploadedFile | null>>({});
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);

  const name = locale === "ar" ? product.nameAr : product.nameFr;
  const set = (key: string, value: string) => {
    setSelections((s) => ({ ...s, [key]: value }));
    setAdded(false);
    setMissing(null);
  };

  const selectionsWithUploads = useMemo(() => {
    const s: Selections = { ...selections };
    for (const [k, f] of Object.entries(files)) if (f) s[k] = f.id;
    return s;
  }, [selections, files]);

  const { unitPrice } = useMemo(() => {
    try {
      // Pricing ignores "required" here: we only want the running price while the form is incomplete.
      const lenient = product.options.map((o) => ("required" in o ? { ...o, required: false } : o)) as ProductOption[];
      return resolveSelections(product.basePrice, lenient, selectionsWithUploads, locale, customFlags, hiddenFlags);
    } catch {
      return { unitPrice: product.basePrice };
    }
  }, [product, selectionsWithUploads, locale, customFlags, hiddenFlags]);

  const logoUrl = Object.values(files).find((f) => f?.localUrl)?.localUrl ?? null;
  const choiceImage = product.options
    .filter((o) => o.type === "select")
    .map((o) => (o.type === "select" ? o.choices.find((c) => c.value === selections[o.key])?.image : undefined))
    .find(Boolean);
  const mainPhoto = photo ?? choiceImage ?? product.images[0];

  function addToCart() {
    try {
      resolveSelections(product.basePrice, product.options, selectionsWithUploads, locale, customFlags, hiddenFlags);
    } catch {
      const first = product.options.find(
        (o) => isVisible(o, product.options, selections) && "required" in o && o.required && !selectionsWithUploads[o.key]?.trim(),
      );
      setMissing(first?.key ?? "_");
      return;
    }
    const visibleSelections: Selections = {};
    for (const o of product.options) {
      const v = selectionsWithUploads[o.key];
      if (isVisible(o, product.options, selectionsWithUploads) && v?.trim()) visibleSelections[o.key] = v.trim();
    }
    add({
      slug: product.slug,
      nameFr: product.nameFr,
      nameAr: product.nameAr,
      preview: product.preview,
      image: mainPhoto ?? null,
      unitPrice,
      quantity,
      selections: visibleSelections,
      uploadNames: Object.fromEntries(Object.values(files).filter((f): f is UploadedFile => !!f).map((f) => [f.id, f.name])),
    });
    setAdded(true);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200">
          {product.preview && !photo ? (
            <ProductPreview kind={product.preview} selections={selections} logoUrl={logoUrl} className="h-full w-full" title={name} />
          ) : mainPhoto ? (
            <Image src={mainPhoto} alt={name} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" priority />
          ) : null}
        </div>
        {product.preview && <p className="mt-2 text-xs text-stone-500">{t.previewNote}</p>}
        {(product.images.length > 0 || product.preview) && (product.images.length > 1 || product.preview) && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-stone-500 uppercase">{t.photos}</p>
            <div className="flex flex-wrap gap-2">
              {product.preview && (
                <button type="button" onClick={() => setPhoto(null)} className={`h-16 w-20 overflow-hidden rounded-lg bg-white ring-2 ${photo === null ? "ring-brand" : "ring-stone-200"}`} aria-label={t.preview}>
                  <ProductPreview kind={product.preview} selections={selections} logoUrl={logoUrl} className="h-full w-full" />
                </button>
              )}
              {product.images.map((src) => (
                <button key={src} type="button" onClick={() => setPhoto(src)} className={`relative h-16 w-20 overflow-hidden rounded-lg ring-2 ${photo === src || (!product.preview && !photo && mainPhoto === src) ? "ring-brand" : "ring-stone-200"}`}>
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="space-y-5">
          {product.options.map((o) => {
            if (!isVisible(o, product.options, selections)) return null;
            const id = `opt-${o.key}`;
            const isMissing = missing === o.key;
            return (
              <div key={o.key}>
                <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
                  {label(o, locale)}
                  {"required" in o && o.required && <span className="text-brand"> *</span>}
                </label>
                {o.type === "select" && (
                  <div id={id} role="radiogroup" className="flex flex-wrap gap-2">
                    {o.choices.map((c) => {
                      const on = selections[o.key] === c.value;
                      return (
                        <button key={c.value} type="button" role="radio" aria-checked={on} onClick={() => { set(o.key, c.value); setPhoto(null); }} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${on ? "border-brand bg-brand/5 text-brand ring-1 ring-brand" : "border-stone-300 bg-white hover:border-stone-500"}`}>
                          {c.swatch && <span className="h-4 w-4 rounded-full ring-1 ring-black/15" style={{ background: c.swatch }} />}
                          {label(c, locale)}
                          {c.priceDelta !== 0 && <span className="text-xs font-normal text-stone-500" dir="ltr">{c.priceDelta > 0 ? "+" : "−"}{formatTND(Math.abs(c.priceDelta), locale)}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
                {o.type === "country" && <CountryPicker id={id} value={selections[o.key] ?? o.default} onChange={(v) => set(o.key, v)} locale={locale} placeholder={t.searchCountry} customFlags={customFlags} hiddenFlags={hiddenFlags} />}
                {o.type === "text" &&
                  (o.multiline ? (
                    <textarea id={id} rows={2} maxLength={o.maxLength} dir="auto" value={selections[o.key] ?? ""} onChange={(e) => set(o.key, e.target.value)} placeholder={locale === "ar" ? o.placeholderAr : o.placeholderFr} className={`field ${isMissing ? "border-brand" : ""}`} />
                  ) : (
                    <input id={id} maxLength={o.maxLength} dir="auto" value={selections[o.key] ?? ""} onChange={(e) => set(o.key, e.target.value)} placeholder={locale === "ar" ? o.placeholderAr : o.placeholderFr} className={`field ${isMissing ? "border-brand" : ""}`} />
                  ))}
                {o.type === "upload" && (
                  <div className={isMissing ? "rounded-lg ring-2 ring-brand" : ""}>
                    <UploadField id={id} value={files[o.key] ?? null} onChange={(f) => { setFiles((x) => ({ ...x, [o.key]: f })); setAdded(false); setMissing(null); }} t={{ hint: t.uploadHint, uploading: t.uploading, uploaded: t.uploaded, remove: t.remove, error: t.uploadError }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="qty" className="text-sm font-bold">{t.quantity}</label>
            <div className="flex items-center rounded-full ring-1 ring-stone-300">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-10 w-10 text-lg font-bold" aria-label="-">−</button>
              <input id="qty" type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="w-14 bg-transparent text-center font-bold outline-none" />
              <button type="button" onClick={() => setQuantity((q) => Math.min(500, q + 1))} className="h-10 w-10 text-lg font-bold" aria-label="+">+</button>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-4">
            <div className="text-sm text-stone-500">
              {t.unitPrice}: <span className="font-semibold text-ink">{formatTND(unitPrice, locale)}</span>
            </div>
            <div className="text-end">
              <div className="text-xs text-stone-500">{t.total}</div>
              <div className="text-2xl font-extrabold">{formatTND(unitPrice * quantity, locale)}</div>
            </div>
          </div>
          <button type="button" onClick={addToCart} className="btn-primary mt-5 w-full text-lg">{added ? t.added : t.addToCart}</button>
          {added && (
            <Link href={`/${locale}/panier`} className="mt-3 block text-center text-sm font-bold text-brand hover:underline">{t.cart} →</Link>
          )}
          {missing && <p className="mt-3 text-center text-sm font-semibold text-brand">{t.missing}</p>}
        </div>
      </div>
    </div>
  );
}
