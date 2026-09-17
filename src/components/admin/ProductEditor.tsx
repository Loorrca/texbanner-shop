"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteProduct, duplicateProduct, saveProduct } from "@/app/admin/catalog-actions";
import { ProductPreview } from "@/components/ProductPreview";
import { formatTND } from "@/lib/money";
import { defaultSelections, type OptionChoice, type ProductOption } from "@/lib/options";
import { PREVIEW_KINDS, slugify } from "@/lib/preview-kinds";
import { MoneyInput, PhotosField } from "./media";

export type EditableProduct = {
  id?: string;
  categoryId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descFr: string;
  descAr: string;
  preview: string | null;
  images: string[];
  basePrice: number;
  options: ProductOption[];
  active: boolean;
  sort: number;
};

type Row = { uid: string; autoKey: boolean; opt: ProductOption; autoValues: boolean[] };

const TYPE_INFO: Record<ProductOption["type"], { label: string; help: string; color: string }> = {
  select: { label: "Liste de choix", help: "Tailles, matières, couleurs… chaque choix peut ajouter un supplément.", color: "bg-blue-100 text-blue-800" },
  country: { label: "Choix du drapeau", help: "Le client choisit un pays, une organisation ou un emblème.", color: "bg-red-100 text-red-800" },
  text: { label: "Texte libre", help: "Texte à imprimer ou graver, saisi par le client.", color: "bg-amber-100 text-amber-800" },
  upload: { label: "Logo du client", help: "Le client envoie son fichier (PNG, JPG, SVG, PDF).", color: "bg-emerald-100 text-emerald-800" },
};

let uidCounter = 0;
const uid = () => `r${++uidCounter}`;

function uniqueKey(base: string, rows: Row[], self?: string) {
  const clean = slugify(base).slice(0, 40) || "option";
  let key = clean;
  for (let i = 2; rows.some((r) => r.uid !== self && r.opt.key === key); i++) key = `${clean}-${i}`;
  return key;
}

function newOption(type: ProductOption["type"], rows: Row[]): Row {
  const base = { labelFr: "", labelAr: "" };
  let opt: ProductOption;
  switch (type) {
    case "select":
      opt = { ...base, type, key: uniqueKey("choix", rows), choices: [{ value: "choix-1", labelFr: "", labelAr: "", priceDelta: 0 }] };
      break;
    case "country":
      opt = { ...base, type, key: uniqueKey("country", rows), labelFr: "Pays", labelAr: "الدولة", default: "tn", priceDelta: 0 };
      break;
    case "text":
      opt = { ...base, type, key: uniqueKey("text", rows), labelFr: "Texte", labelAr: "النص", required: false, maxLength: 120, multiline: false, priceDelta: 0 };
      break;
    case "upload":
      opt = { ...base, type, key: uniqueKey("logo", rows), labelFr: "Votre logo", labelAr: "شعاركم", required: true, priceDelta: 0 };
      break;
  }
  return { uid: uid(), autoKey: type === "select", opt, autoValues: type === "select" ? [true] : [] };
}

export function ProductEditor({
  initial,
  categories,
  orderCount = 0,
  justDuplicated = false,
}: {
  initial: EditableProduct;
  categories: { id: string; nameFr: string; slug: string }[];
  orderCount?: number;
  justDuplicated?: boolean;
}) {
  const router = useRouter();
  const isNew = !initial.id;
  const [p, setP] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [rows, setRows] = useState<Row[]>(() => initial.options.map((opt) => ({ uid: uid(), autoKey: false, opt, autoValues: opt.type === "select" ? opt.choices.map(() => false) : [] })));
  const [advanced, setAdvanced] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(justDuplicated ? { kind: "ok", text: "Copie créée (masquée). Modifiez-la puis activez « En vente »." } : null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof EditableProduct>(k: K, v: EditableProduct[K]) => setP((x) => ({ ...x, [k]: v }));
  const options = useMemo(() => rows.map((r) => r.opt), [rows]);
  const category = categories.find((c) => c.id === p.categoryId);

  const updateRow = (id: string, fn: (r: Row) => Row) => setRows((rs) => rs.map((r) => (r.uid === id ? fn(r) : r)));
  const updateOpt = (id: string, patch: Partial<ProductOption>) => updateRow(id, (r) => ({ ...r, opt: { ...r.opt, ...patch } as ProductOption }));
  const moveRow = (i: number, d: number) =>
    setRows((rs) => {
      const j = i + d;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // Price range shown to the admin: cheapest and most expensive combination of choices.
  const priceRange = useMemo(() => {
    let min = p.basePrice, max = p.basePrice;
    for (const o of options) {
      if (o.type === "select" && o.choices.length) {
        const d = o.choices.map((c) => c.priceDelta);
        if (!o.showIf) min += Math.min(...d);
        max += Math.max(0, ...d);
      } else if (o.type !== "select") {
        max += Math.max(0, o.priceDelta);
        if (o.type === "country") min += o.priceDelta;
      }
    }
    return { min, max };
  }, [p.basePrice, options]);

  const previewSelections = useMemo(() => defaultSelections(options.filter((o) => o.type !== "select" || o.choices.length > 0)), [options]);

  function save() {
    setMessage(null);
    const payload = {
      ...p,
      options: rows.map((r) => r.opt),
      nameFr: p.nameFr.trim(),
      nameAr: p.nameAr.trim(),
    };
    startTransition(async () => {
      const res = await saveProduct(payload);
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      if (isNew) {
        router.replace(`/admin/products/${res.id}?cree=1`);
      } else {
        setMessage({ kind: "ok", text: "Modifications enregistrées ✓" });
        router.refresh();
      }
    });
  }

  function remove() {
    const text = orderCount > 0
      ? `Ce produit apparaît dans ${orderCount} commande(s) : il sera masqué de la boutique (pas supprimé). Continuer ?`
      : "Supprimer définitivement ce produit ?";
    if (!p.id || !window.confirm(text)) return;
    startTransition(async () => {
      const res = await deleteProduct(p.id!);
      if (!res.ok) return setMessage({ kind: "error", text: res.error });
      router.replace(`/admin/products?cat=${res.categorySlug}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        {/* ---------- general ---------- */}
        <Section title="Informations">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom (français) *">
              <input
                className="field"
                value={p.nameFr}
                maxLength={120}
                onChange={(e) => {
                  set("nameFr", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="الاسم (عربي) *">
              <input className="field" dir="rtl" value={p.nameAr} maxLength={120} onChange={(e) => set("nameAr", e.target.value)} />
            </Field>
            <Field label="Description (français)">
              <textarea className="field" rows={4} value={p.descFr} maxLength={2000} onChange={(e) => set("descFr", e.target.value)} />
            </Field>
            <Field label="الوصف (عربي)">
              <textarea className="field" rows={4} dir="rtl" value={p.descAr} maxLength={2000} onChange={(e) => set("descAr", e.target.value)} />
            </Field>
            <Field label="Catégorie *">
              <select className="field" value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameFr}</option>
                ))}
              </select>
            </Field>
            <Field label="Prix de base *" hint="Prix final = prix de base + suppléments des options choisies.">
              <MoneyInput value={p.basePrice} onChange={(v) => set("basePrice", v)} />
            </Field>
            <Field label="Adresse de la page" hint={`/fr/produit/${p.slug || "…"}`}>
              <input
                className="field font-mono text-xs"
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Ordre d'affichage" hint="Les plus petits nombres apparaissent en premier.">
              <input type="number" min={0} max={999} className="field w-28" value={p.sort} onChange={(e) => set("sort", Math.max(0, Math.min(999, Number(e.target.value) || 0)))} />
            </Field>
          </div>
        </Section>

        {/* ---------- photos ---------- */}
        <Section title="Photos">
          <PhotosField value={p.images} onChange={(v) => set("images", v)} />
        </Section>

        {/* ---------- drawn preview ---------- */}
        <Section title="Aperçu dessiné (optionnel)" subtitle="Pour les drapeaux, guirlandes, banderoles… le site dessine le produit avec le pays, le texte ou le logo choisi par le client.">
          <div className="grid gap-4 md:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              <select className="field" value={p.preview ?? ""} onChange={(e) => set("preview", e.target.value || null)}>
                <option value="">Aucun — afficher seulement les photos</option>
                {PREVIEW_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
              {p.preview && (
                <p className="rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-600">
                  Ce dessin utilise les options dont la <strong>clé technique</strong> est :{" "}
                  <code className="font-mono text-ink">{PREVIEW_KINDS.find((k) => k.value === p.preview)?.keys}</code>.
                  Activez « réglages avancés » pour voir et modifier les clés.
                </p>
              )}
            </div>
            {p.preview && (
              <div className="overflow-hidden rounded-lg ring-1 ring-stone-200">
                <ProductPreview kind={p.preview} selections={previewSelections} className="block w-full" />
              </div>
            )}
          </div>
        </Section>

        {/* ---------- options ---------- */}
        <Section
          title="Options de personnalisation"
          subtitle="Ce que le client choisit avant d'ajouter au panier."
          action={
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-500">
              <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} /> Réglages avancés
            </label>
          }
        >
          <div className="space-y-4">
            {rows.map((row, i) => (
              <OptionCard
                key={row.uid}
                row={row}
                index={i}
                count={rows.length}
                rows={rows}
                advanced={advanced}
                images={p.images}
                onMove={(d) => moveRow(i, d)}
                onRemove={() => setRows((rs) => rs.filter((r) => r.uid !== row.uid))}
                onChange={(patch) => updateOpt(row.uid, patch)}
                onRow={(fn) => updateRow(row.uid, fn)}
              />
            ))}
            {rows.length === 0 && <p className="rounded-lg bg-stone-50 p-4 text-sm text-stone-500">Aucune option : le produit sera vendu tel quel, au prix de base.</p>}
            <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {(Object.keys(TYPE_INFO) as ProductOption["type"][]).map((t) => (
                <button key={t} type="button" onClick={() => setRows((rs) => [...rs, newOption(t, rs)])} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:border-ink" title={TYPE_INFO[t].help}>
                  + {TYPE_INFO[t].label}
                </button>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ---------- sidebar ---------- */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
          <label className="flex items-center justify-between gap-3">
            <span className="font-bold">En vente</span>
            <input type="checkbox" className="h-5 w-5 accent-[#c8102e]" checked={p.active} onChange={(e) => set("active", e.target.checked)} />
          </label>
          <p className="mt-1 text-xs text-stone-500">{p.active ? "Visible dans la boutique." : "Masqué : seuls les administrateurs le voient."}</p>
          <dl className="mt-4 space-y-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">Catégorie</dt><dd className="font-semibold">{category?.nameFr ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Prix</dt><dd className="font-semibold">{priceRange.min === priceRange.max ? formatTND(priceRange.min) : `${formatTND(priceRange.min)} – ${formatTND(priceRange.max)}`}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Photos</dt><dd className="font-semibold">{p.images.length}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">Options</dt><dd className="font-semibold">{rows.length}</dd></div>
          </dl>
          <button type="button" onClick={save} disabled={pending} className="btn-primary mt-4 w-full">
            {pending ? "Enregistrement…" : isNew ? "Créer le produit" : "Enregistrer"}
          </button>
          {message && (
            <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${message.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
              {message.text}
            </p>
          )}
        </div>
        {!isNew && (
          <div className="space-y-2 rounded-xl bg-white p-5 text-sm ring-1 ring-stone-200">
            <Link href={`/fr/produit/${initial.slug}`} target="_blank" className="block font-bold text-brand hover:underline">Voir sur la boutique ↗</Link>
            <button type="button" disabled={pending} onClick={() => startTransition(() => duplicateProduct(p.id!))} className="block font-semibold text-stone-700 hover:text-ink">Dupliquer ce produit</button>
            <button type="button" disabled={pending} onClick={remove} className="block font-semibold text-stone-500 hover:text-brand">
              {orderCount > 0 ? "Retirer de la boutique" : "Supprimer le produit"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block break-all text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

function OptionCard({
  row, index, count, rows, advanced, images, onMove, onRemove, onChange, onRow,
}: {
  row: Row; index: number; count: number; rows: Row[]; advanced: boolean; images: string[];
  onMove: (d: number) => void; onRemove: () => void; onChange: (patch: Partial<ProductOption>) => void; onRow: (fn: (r: Row) => Row) => void;
}) {
  const o = row.opt;
  const info = TYPE_INFO[o.type];
  const conditionSources = rows.filter((r) => r.uid !== row.uid && r.opt.type === "select");

  const setLabelFr = (labelFr: string) =>
    onRow((r) => ({ ...r, opt: { ...r.opt, labelFr, ...(r.autoKey ? { key: uniqueKey(labelFr || "choix", rows, r.uid) } : {}) } as ProductOption }));

  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${info.color}`}>{info.label}</span>
        <span className="flex items-center gap-1 text-sm">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded px-2 py-1 font-bold hover:bg-stone-100 disabled:opacity-30" aria-label="Monter">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} className="rounded px-2 py-1 font-bold hover:bg-stone-100 disabled:opacity-30" aria-label="Descendre">↓</button>
          <button type="button" onClick={onRemove} className="ms-2 rounded px-2 py-1 font-semibold text-stone-500 hover:bg-red-50 hover:text-brand">Supprimer</button>
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Titre affiché (français) *">
          <input className="field" value={o.labelFr} maxLength={80} placeholder="ex. Dimensions" onChange={(e) => setLabelFr(e.target.value)} />
        </Field>
        <Field label="العنوان (عربي) *">
          <input className="field" dir="rtl" value={o.labelAr} maxLength={80} placeholder="مثال: المقاس" onChange={(e) => onChange({ labelAr: e.target.value })} />
        </Field>
      </div>

      {o.type === "select" && <ChoicesEditor row={row} advanced={advanced} images={images} onRow={onRow} />}

      {o.type !== "select" && (
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <Field label={o.type === "country" ? "Supplément" : o.type === "text" ? "Supplément si un texte est saisi" : "Supplément si un fichier est envoyé"}>
            <MoneyInput value={o.priceDelta} onChange={(v) => onChange({ priceDelta: v })} allowNegative />
          </Field>
          {(o.type === "text" || o.type === "upload") && (
            <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
              <input type="checkbox" checked={o.required} onChange={(e) => onChange({ required: e.target.checked })} /> Obligatoire
            </label>
          )}
          {o.type === "text" && (
            <>
              <Field label="Longueur max.">
                <input type="number" min={1} max={500} className="field w-24" value={o.maxLength} onChange={(e) => onChange({ maxLength: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })} />
              </Field>
              <label className="flex items-center gap-2 pb-2 text-sm font-semibold">
                <input type="checkbox" checked={o.multiline} onChange={(e) => onChange({ multiline: e.target.checked })} /> Plusieurs lignes
              </label>
            </>
          )}
          {o.type === "country" && (
            <Field label="Drapeau par défaut (code)" hint="tn = Tunisie, fr = France, eu = Union européenne…">
              <input className="field w-28 font-mono" value={o.default} onChange={(e) => onChange({ default: e.target.value.toLowerCase().trim() })} />
            </Field>
          )}
        </div>
      )}

      {advanced && (
        <div className="mt-3 grid gap-3 rounded-lg bg-stone-50 p-3 md:grid-cols-3">
          <Field label="Clé technique" hint="Utilisée par l'aperçu dessiné (ex. country, text, logo, color).">
            <input
              className="field font-mono text-xs"
              value={o.key}
              onChange={(e) => onRow((r) => ({ ...r, autoKey: false, opt: { ...r.opt, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") } as ProductOption }))}
            />
          </Field>
          <Field label="Afficher seulement si…" hint="Ex. « Second pays » seulement si Modèle = Double.">
            <select
              className="field"
              value={o.showIf ? `${o.showIf.key}::${o.showIf.value}` : ""}
              onChange={(e) => {
                const [key, value] = e.target.value.split("::");
                onChange({ showIf: e.target.value ? { key, value } : undefined });
              }}
            >
              <option value="">Toujours afficher</option>
              {conditionSources.flatMap((r) =>
                r.opt.type === "select"
                  ? r.opt.choices.map((c) => (
                      <option key={`${r.opt.key}::${c.value}`} value={`${r.opt.key}::${c.value}`}>
                        {r.opt.labelFr || r.opt.key} = {c.labelFr || c.value}
                      </option>
                    ))
                  : [],
              )}
            </select>
          </Field>
          {o.type === "text" && (
            <Field label="Exemple dans le champ (FR / AR)">
              <div className="flex gap-2">
                <input className="field" value={o.placeholderFr ?? ""} onChange={(e) => onChange({ placeholderFr: e.target.value || undefined })} />
                <input className="field" dir="rtl" value={o.placeholderAr ?? ""} onChange={(e) => onChange({ placeholderAr: e.target.value || undefined })} />
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

function ChoicesEditor({ row, advanced, images, onRow }: { row: Row; advanced: boolean; images: string[]; onRow: (fn: (r: Row) => Row) => void }) {
  if (row.opt.type !== "select") return null;
  const choices = row.opt.choices;

  const setChoices = (fn: (cs: OptionChoice[], auto: boolean[]) => [OptionChoice[], boolean[]]) =>
    onRow((r) => {
      if (r.opt.type !== "select") return r;
      const [cs, auto] = fn(r.opt.choices, r.autoValues);
      return { ...r, autoValues: auto, opt: { ...r.opt, choices: cs } };
    });
  const uniqueValue = (label: string, cs: OptionChoice[], self: number) => {
    const base = slugify(label) || `choix-${self + 1}`;
    let v = base;
    for (let i = 2; cs.some((c, k) => k !== self && c.value === v); i++) v = `${base}-${i}`;
    return v;
  };
  const patch = (i: number, p: Partial<OptionChoice>) => setChoices((cs, auto) => [cs.map((c, k) => (k === i ? { ...c, ...p } : c)), auto]);

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold">Choix proposés</p>
      <div className="space-y-2">
        {choices.map((c, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-stone-50 p-2 [&>input]:min-w-0">
            <input
              className="field min-w-40 flex-1 py-1.5"
              placeholder="Libellé (FR), ex. 2 m × 1,5 m"
              value={c.labelFr}
              maxLength={80}
              onChange={(e) => {
                const labelFr = e.target.value;
                setChoices((cs, auto) => [cs.map((x, k) => (k === i ? { ...x, labelFr, ...(auto[i] ? { value: uniqueValue(labelFr, cs, i) } : {}) } : x)), auto]);
              }}
            />
            <input className="field min-w-32 flex-1 py-1.5" dir="rtl" placeholder="الاسم (AR)" value={c.labelAr} maxLength={80} onChange={(e) => patch(i, { labelAr: e.target.value })} />
            <span className="flex items-center gap-1 text-xs text-stone-500">
              +<MoneyInput value={c.priceDelta} onChange={(v) => patch(i, { priceDelta: v })} allowNegative />
            </span>
            <label className="flex items-center gap-1 text-xs text-stone-500" title="Pastille de couleur">
              <input type="checkbox" checked={!!c.swatch} onChange={(e) => patch(i, { swatch: e.target.checked ? "#c8102e" : undefined })} />
              {c.swatch ? <input type="color" value={c.swatch} onChange={(e) => patch(i, { swatch: e.target.value })} className="h-7 w-9 cursor-pointer rounded border border-stone-300" /> : "Couleur"}
            </label>
            {images.length > 0 && (
              <select className="field w-auto py-1.5 text-xs" value={c.image ?? ""} onChange={(e) => patch(i, { image: e.target.value || undefined })} title="Photo affichée quand ce choix est sélectionné">
                <option value="">Photo : —</option>
                {images.map((src, k) => (
                  <option key={src} value={src}>Photo {k + 1}</option>
                ))}
              </select>
            )}
            {advanced && (
              <input
                className="field w-32 py-1.5 font-mono text-xs"
                title="Valeur technique (utilisée par l'aperçu dessiné, ex. red, vertical, double)"
                value={c.value}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, "");
                  setChoices((cs, auto) => [cs.map((x, k) => (k === i ? { ...x, value } : x)), auto.map((a, k) => (k === i ? false : a))]);
                }}
              />
            )}
            <span className="flex">
              <button type="button" disabled={i === 0} onClick={() => setChoices((cs, auto) => { const n = [...cs], a = [...auto]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return [n, a]; })} className="rounded px-1.5 font-bold hover:bg-stone-200 disabled:opacity-30" aria-label="Monter">↑</button>
              <button type="button" disabled={choices.length === 1} onClick={() => setChoices((cs, auto) => [cs.filter((_, k) => k !== i), auto.filter((_, k) => k !== i)])} className="rounded px-1.5 font-bold text-stone-500 hover:bg-red-50 hover:text-brand disabled:opacity-30" aria-label="Supprimer le choix">✕</button>
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setChoices((cs, auto) => [[...cs, { value: uniqueValue(`choix-${cs.length + 1}`, cs, -1), labelFr: "", labelAr: "", priceDelta: 0 }], [...auto, true]])}
        className="mt-2 text-sm font-bold text-brand hover:underline"
      >
        + Ajouter un choix
      </button>
      <p className="mt-1 text-xs text-stone-500">Le premier choix est sélectionné par défaut.</p>
    </div>
  );
}
