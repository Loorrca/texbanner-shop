"use client";

/* eslint-disable @next/next/no-img-element -- admin thumbnails of freshly uploaded media */
import { useRef, useState } from "react";

export async function uploadImage(file: File, kind: "photo" | "emblem"): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  const res = await fetch("/admin/api/media", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error ?? "Échec de l'envoi");
  return data.url as string;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/svg+xml,image/avif,image/heic";

/** Single image (category cover, emblem). */
export function ImageField({ value, onChange, kind = "photo", label, hint }: { value: string | null; onChange: (url: string | null) => void; kind?: "photo" | "emblem"; label: string; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{label}</p>
      <div className="flex items-center gap-4">
        <div className={`grid h-28 w-40 place-items-center overflow-hidden rounded-lg ring-1 ring-stone-300 ${kind === "emblem" ? "bg-[repeating-conic-gradient(#e7e5e4_0_25%,#fff_0_50%)] bg-[length:16px_16px]" : "bg-stone-100"}`}>
          {value ? <img src={value} alt="" className={`h-full w-full ${kind === "emblem" ? "object-contain p-2" : "object-cover"}`} /> : <span className="text-xs text-stone-400">Aucune image</span>}
        </div>
        <div className="space-y-2">
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? "Envoi…" : value ? "Remplacer" : "Choisir une image"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="block text-sm font-semibold text-stone-500 hover:text-brand">Retirer</button>
          )}
          {hint && <p className="max-w-xs text-xs text-stone-500">{hint}</p>}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setError(null);
          try {
            onChange(await uploadImage(f, kind));
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && <p className="mt-1 text-sm font-semibold text-brand">{error}</p>}
    </div>
  );
}

/** Ordered list of product photos: upload several, reorder, remove. The first one is the main photo. */
export function PhotosField({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  async function add(files: FileList) {
    setError(null);
    const list = Array.from(files).slice(0, 12 - value.length);
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        urls.push(await uploadImage(f, "photo"));
      } catch (err) {
        setError(`${f.name} : ${(err as Error).message}`);
      }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...urls]);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((src, i) => (
          <figure key={src} className="group relative overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-300">
            <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
            {i === 0 && <span className="absolute start-2 top-2 rounded bg-brand px-2 py-0.5 text-[11px] font-bold text-white">Principale</span>}
            <figcaption className="flex items-center justify-between gap-1 bg-white px-2 py-1.5 text-sm">
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-2 font-bold hover:bg-stone-100 disabled:opacity-30" aria-label="Déplacer avant">←</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded px-2 font-bold hover:bg-stone-100 disabled:opacity-30" aria-label="Déplacer après">→</button>
              </span>
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="font-semibold text-stone-500 hover:text-brand">Retirer</button>
            </figcaption>
          </figure>
        ))}
        {value.length < 12 && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy > 0} className="grid aspect-[4/3] place-items-center rounded-lg border-2 border-dashed border-stone-300 text-sm font-bold text-stone-500 hover:border-brand hover:text-brand disabled:opacity-60">
            {busy > 0 ? `Envoi… (${busy})` : "+ Ajouter des photos"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = ""; }} />
      <p className="mt-2 text-xs text-stone-500">JPG, PNG, WEBP ou SVG · 15 Mo max · redimensionnées automatiquement. La première photo est l&apos;image principale.</p>
      {error && <p className="mt-1 text-sm font-semibold text-brand">{error}</p>}
    </div>
  );
}

/** Price input in dinars, stored in millimes. */
export function MoneyInput({ value, onChange, allowNegative = false, className = "" }: { value: number; onChange: (millimes: number) => void; allowNegative?: boolean; className?: string }) {
  const [text, setText] = useState((value / 1000).toFixed(3));
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : (value / 1000).toFixed(3);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <input
        inputMode="decimal"
        value={shown}
        onFocus={() => { setText((value / 1000).toFixed(3)); setFocused(true); }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value.replace(",", ".").replace(/\s/g, ""));
          if (Number.isFinite(n) && (allowNegative || n >= 0)) onChange(Math.round(n * 1000));
        }}
        className="field w-28 py-1.5 text-end"
      />
      <span className="text-xs text-stone-500">DT</span>
    </span>
  );
}
