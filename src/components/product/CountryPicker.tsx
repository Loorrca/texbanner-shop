"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flagSrc, GROUP_LABELS, sortedCountries, type CustomFlag } from "@/lib/countries";

export function CountryPicker({ value, onChange, locale, placeholder, id, customFlags = [] }: { value: string; onChange: (code: string) => void; locale: string; placeholder: string; id: string; customFlags?: CustomFlag[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const countries = useMemo(() => sortedCountries(locale, customFlags), [locale, customFlags]);
  const current = countries.find((c) => c.code === value);

  const filtered = useMemo(() => {
    const n = q.trim().toLocaleLowerCase(locale).normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (!n) return countries;
    return countries.filter((c) => c.name.toLocaleLowerCase(locale).normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(n) || c.code === n);
  }, [q, countries, locale]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <button id={id} type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} className="field flex items-center gap-3 text-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagSrc(value)} alt="" className="h-5 w-7 rounded-sm bg-white object-contain ring-1 ring-black/10" />
        <span className="flex-1 font-semibold">{current?.name ?? value}</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-stone-400" fill="currentColor" aria-hidden><path d="M5 7l5 6 5-6H5z" /></svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-stone-200">
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === "Enter" && filtered[active]) { e.preventDefault(); pick(filtered[active].code); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={placeholder}
            className="w-full border-b border-stone-200 px-4 py-3 text-sm outline-none"
            role="combobox"
            aria-controls={`${id}-list`}
            aria-expanded
          />
          <ul id={`${id}-list`} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filtered.map((c, i) => (
              <li key={c.code} role="option" aria-selected={c.code === value}>
                {(i === 0 || filtered[i - 1].group !== c.group) && c.group !== "country" && (
                  <p className="border-t border-stone-100 bg-stone-50 px-4 pb-1 pt-2 text-[11px] font-bold uppercase text-stone-500">
                    {locale === "ar" ? GROUP_LABELS[c.group].ar : GROUP_LABELS[c.group].fr}
                  </p>
                )}
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(c.code)} className={`flex w-full items-center gap-3 px-4 py-2 text-start text-sm ${i === active ? "bg-stone-100" : ""} ${c.code === value ? "font-bold text-brand" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagSrc(c.code)} alt="" loading="lazy" className="h-4 w-6 rounded-sm bg-white object-contain ring-1 ring-black/10" />
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
