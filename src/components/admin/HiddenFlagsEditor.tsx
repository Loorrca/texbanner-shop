"use client";

/* eslint-disable @next/next/no-img-element -- flag thumbnails, already tiny SVGs */

import { useMemo, useState, useTransition } from "react";
import { setHiddenFlags } from "@/app/admin/catalog-actions";
import { flagSrc, GROUP_LABELS, type FlagEntry } from "@/lib/countries";

/** Strips accents so "Émirats" is found by typing "emirats". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function HiddenFlagsEditor({ all, initial }: { all: FlagEntry[]; initial: string[] }) {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(initial));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(initial));
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(
    () => hidden.size !== saved.size || [...hidden].some((c) => !saved.has(c)),
    [hidden, saved],
  );

  const matches = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    return all.filter((f) => fold(f.name).includes(q) || f.code.includes(q)).slice(0, 60);
  }, [all, query]);

  const hiddenEntries = useMemo(
    () => all.filter((f) => hidden.has(f.code)),
    [all, hidden],
  );
  // A code can stay hidden after its custom emblem is deleted; keep it visible so it can be removed.
  const orphans = useMemo(() => [...hidden].filter((c) => !all.some((f) => f.code === c)), [all, hidden]);

  function toggle(code: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setError(null);
    setDone(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setHiddenFlags([...hidden]);
      if (res.ok) {
        setSaved(new Set(hidden));
        setDone(true);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <section className="rounded-xl bg-white ring-1 ring-stone-200">
      <div className="border-b border-stone-100 px-5 py-3">
        <h2 className="font-extrabold">Drapeaux masqués</h2>
        <p className="text-sm text-stone-500">
          Retirez un drapeau de la liste « Choix du drapeau » sur la boutique. Les commandes déjà passées ne changent pas.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <label htmlFor="flag-search" className="mb-1.5 block text-sm font-bold">
            Chercher un drapeau à masquer
          </label>
          <input
            id="flag-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom du pays, de l'organisation ou code (fr, un, x-mon-logo…)"
            className="field"
            autoComplete="off"
          />
          {query.trim() && (
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-lg ring-1 ring-stone-200">
              {matches.map((f) => (
                <li key={f.code}>
                  <label className="flex cursor-pointer items-center gap-3 border-b border-stone-100 px-3 py-2 text-sm last:border-0 hover:bg-stone-50">
                    <input type="checkbox" checked={hidden.has(f.code)} onChange={() => toggle(f.code)} className="h-4 w-4" />
                    <img src={flagSrc(f.code)} alt="" className="h-5 w-8 rounded-sm object-cover ring-1 ring-stone-200" />
                    <span className="flex-1">{f.name}</span>
                    <span className="text-xs text-stone-400">
                      {GROUP_LABELS[f.group].fr} · <code>{f.code}</code>
                    </span>
                  </label>
                </li>
              ))}
              {!matches.length && <li className="px-3 py-6 text-center text-sm text-stone-500">Aucun résultat</li>}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-bold">
            Masqués {hidden.size > 0 && <span className="font-normal text-stone-500">({hidden.size})</span>}
          </p>
          {hidden.size === 0 ? (
            <p className="rounded-lg bg-stone-50 px-3 py-6 text-center text-sm text-stone-500">
              Aucun drapeau masqué : les 249 pays et tous les emblèmes actifs sont proposés.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {hiddenEntries.map((f) => (
                <li key={f.code}>
                  <button
                    type="button"
                    onClick={() => toggle(f.code)}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white py-1.5 pe-2 ps-3 text-sm font-semibold hover:border-brand hover:text-brand"
                    title="Réafficher ce drapeau"
                  >
                    <img src={flagSrc(f.code)} alt="" className="h-4 w-6 rounded-sm object-cover ring-1 ring-stone-200" />
                    {f.name}
                    <span aria-hidden className="text-stone-400">×</span>
                    <span className="sr-only">Réafficher</span>
                  </button>
                </li>
              ))}
              {orphans.map((code) => (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => toggle(code)}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50 py-1.5 pe-2 ps-3 text-sm font-semibold text-stone-500 hover:border-brand hover:text-brand"
                    title="Code inconnu (emblème supprimé) — cliquez pour l'enlever de la liste"
                  >
                    <code>{code}</code>
                    <span aria-hidden className="text-stone-400">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="rounded-lg bg-brand/5 px-3 py-2 text-sm font-semibold text-brand">{error}</p>}

        <div className="flex items-center gap-3 border-t border-stone-100 pt-4">
          <button type="button" onClick={save} disabled={!dirty || pending} className="btn-primary py-2.5">
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {dirty && !pending && <span className="text-sm text-stone-500">Modifications non enregistrées</span>}
          {!dirty && done && <span className="text-sm font-semibold text-green-700">Enregistré ✓</span>}
        </div>
      </div>
    </section>
  );
}
