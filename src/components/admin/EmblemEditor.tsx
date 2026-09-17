"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEmblem, saveEmblem } from "@/app/admin/catalog-actions";
import { GROUP_LABELS } from "@/lib/countries";
import { slugify } from "@/lib/preview-kinds";
import { ImageField } from "./media";

export type EditableEmblem = { id?: string; slug: string; nameFr: string; nameAr: string; group: "organisation" | "sport" | "region" | "autre"; image: string | null; active: boolean; sort: number };

export function EmblemEditor({ initial }: { initial: EditableEmblem }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [e, setE] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof EditableEmblem>(k: K, v: EditableEmblem[K]) => setE((x) => ({ ...x, [k]: v }));

  return (
    <div className="max-w-3xl space-y-5 rounded-xl bg-white p-6 ring-1 ring-stone-200">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Nom (français) *
          <input className="field mt-1" value={e.nameFr} maxLength={80} onChange={(ev) => { set("nameFr", ev.target.value); if (!slugTouched) set("slug", slugify(ev.target.value)); }} />
        </label>
        <label className="block text-sm font-semibold">
          الاسم (عربي) *
          <input className="field mt-1" dir="rtl" value={e.nameAr} maxLength={80} onChange={(ev) => set("nameAr", ev.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Groupe dans la liste
          <select className="field mt-1" value={e.group} onChange={(ev) => set("group", ev.target.value as EditableEmblem["group"])}>
            {(["organisation", "sport", "region", "autre"] as const).map((g) => (
              <option key={g} value={g}>{GROUP_LABELS[g].fr}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Identifiant
          <input className="field mt-1 font-mono text-xs" value={e.slug} onChange={(ev) => { setSlugTouched(true); set("slug", slugify(ev.target.value)); }} />
          <span className="mt-1 block text-xs font-normal text-stone-500">Code : x-{e.slug || "…"}</span>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={e.active} onChange={(ev) => set("active", ev.target.checked)} /> Proposé aux clients
        </label>
      </div>
      <ImageField kind="emblem" label="Image du drapeau / emblème *" value={e.image} onChange={(v) => set("image", v)} hint="PNG transparent ou SVG de préférence, format paysage (3:2). Converti automatiquement." />

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
        <button
          type="button"
          disabled={pending}
          className="btn-primary"
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await saveEmblem({ ...e, image: e.image ?? "" });
              if (!res.ok) return setError(res.error);
              router.replace("/admin/emblems");
              router.refresh();
            })
          }
        >
          {pending ? "Enregistrement…" : isNew ? "Ajouter" : "Enregistrer"}
        </button>
        {!isNew && (
          <button
            type="button"
            disabled={pending}
            className="text-sm font-semibold text-stone-500 hover:text-brand"
            onClick={() => {
              if (!window.confirm("Supprimer cet emblème ? Les anciennes commandes qui l'utilisent n'afficheront plus son image. Pour le retirer de la boutique, décochez plutôt « Proposé aux clients ».")) return;
              start(async () => {
                const res = await deleteEmblem(e.id!);
                if (!res.ok) return setError(res.error);
                router.replace("/admin/emblems");
                router.refresh();
              });
            }}
          >
            Supprimer
          </button>
        )}
        {error && <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>
    </div>
  );
}
