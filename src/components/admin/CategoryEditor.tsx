"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, saveCategory } from "@/app/admin/catalog-actions";
import { slugify } from "@/lib/preview-kinds";
import { ImageField } from "./media";

export type EditableCategory = { id?: string; slug: string; nameFr: string; nameAr: string; descFr: string; descAr: string; image: string | null; sort: number };

export function CategoryEditor({ initial, productCount = 0 }: { initial: EditableCategory; productCount?: number }) {
  const router = useRouter();
  const isNew = !initial.id;
  const [c, setC] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof EditableCategory>(k: K, v: EditableCategory[K]) => setC((x) => ({ ...x, [k]: v }));

  return (
    <div className="max-w-3xl space-y-5 rounded-xl bg-white p-6 ring-1 ring-stone-200">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Nom (français) *
          <input className="field mt-1" value={c.nameFr} maxLength={80} onChange={(e) => { set("nameFr", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
        </label>
        <label className="block text-sm font-semibold">
          الاسم (عربي) *
          <input className="field mt-1" dir="rtl" value={c.nameAr} maxLength={80} onChange={(e) => set("nameAr", e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Description (français)
          <textarea className="field mt-1" rows={3} value={c.descFr} maxLength={500} onChange={(e) => set("descFr", e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          الوصف (عربي)
          <textarea className="field mt-1" rows={3} dir="rtl" value={c.descAr} maxLength={500} onChange={(e) => set("descAr", e.target.value)} />
        </label>
        <label className="block text-sm font-semibold">
          Adresse de la page
          <input className="field mt-1 font-mono text-xs" value={c.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
          <span className="mt-1 block text-xs font-normal text-stone-500">/fr/categorie/{c.slug || "…"}</span>
        </label>
        <label className="block text-sm font-semibold">
          Ordre d&apos;affichage
          <input type="number" min={0} max={999} className="field mt-1 w-28" value={c.sort} onChange={(e) => set("sort", Math.max(0, Math.min(999, Number(e.target.value) || 0)))} />
        </label>
      </div>
      <ImageField label="Image de couverture" value={c.image} onChange={(v) => set("image", v)} hint="Affichée sur la page d'accueil. Sans image, le premier produit de la catégorie est utilisé." />

      <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5">
        <button
          type="button"
          disabled={pending}
          className="btn-primary"
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await saveCategory(c);
              if (!res.ok) return setError(res.error);
              router.replace(`/admin/products?cat=${c.slug}`);
              router.refresh();
            })
          }
        >
          {pending ? "Enregistrement…" : isNew ? "Créer la catégorie" : "Enregistrer"}
        </button>
        {!isNew && (
          <button
            type="button"
            disabled={pending}
            className="text-sm font-semibold text-stone-500 hover:text-brand disabled:opacity-50"
            title={productCount > 0 ? "Déplacez ou supprimez d'abord ses produits" : undefined}
            onClick={() => {
              if (!window.confirm("Supprimer cette catégorie ?")) return;
              start(async () => {
                const res = await deleteCategory(c.id!);
                if (!res.ok) return setError(res.error);
                router.replace("/admin/products");
                router.refresh();
              });
            }}
          >
            Supprimer la catégorie{productCount > 0 ? ` (${productCount} produit${productCount > 1 ? "s" : ""})` : ""}
          </button>
        )}
        {error && <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      </div>
    </div>
  );
}
