/* eslint-disable @next/next/no-img-element -- flag thumbnails */
import { asc } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { HiddenFlagsEditor } from "@/components/admin/HiddenFlagsEditor";
import { BUILTIN_EXTRAS, GROUP_LABELS, sortedCountries } from "@/lib/countries";
import { getCustomFlags, getHiddenFlags } from "@/lib/emblems";

export default async function AdminEmblems() {
  const [emblems, customFlags, hiddenFlags] = await Promise.all([
    db.select().from(schema.emblems).orderBy(asc(schema.emblems.sort), asc(schema.emblems.nameFr)),
    getCustomFlags(),
    getHiddenFlags(),
  ]);
  // Nothing filtered out here: the editor has to be able to list a flag in order to un-hide it.
  const allFlags = sortedCountries("fr", customFlags);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Drapeaux & emblèmes</h1>
          <p className="text-sm text-stone-500">Ajoutés à la liste « Choix du drapeau », après les 249 pays.</p>
        </div>
        <Link href="/admin/emblems/new" className="btn-primary py-2.5">+ Ajouter un emblème</Link>
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <strong>Droits d&apos;utilisation :</strong> les logos de marques, clubs, ligues sportives et les emblèmes officiels de certaines organisations
        (OTAN, UNESCO, UNICEF…) sont protégés. Ne les proposez à la vente qu&apos;avec l&apos;autorisation de leur titulaire.
        Pour une commande d&apos;un client qui fournit son propre logo (entreprise, club, municipalité), utilisez plutôt l&apos;option « Logo du client » du produit.
      </p>

      <section className="rounded-xl bg-white ring-1 ring-stone-200">
        <h2 className="border-b border-stone-100 px-5 py-3 font-extrabold">Vos emblèmes</h2>
        <ul className="divide-y divide-stone-100">
          {emblems.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/emblems/${e.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50">
                <img src={e.image} alt="" className="h-10 w-14 rounded-sm bg-stone-100 object-contain ring-1 ring-stone-200" />
                <span className="flex-1">
                  <span className={`block font-semibold ${e.active ? "" : "text-stone-400 line-through"}`}>{e.nameFr}</span>
                  <span className="text-xs text-stone-500">{GROUP_LABELS[e.group].fr} · <code>{e.code}</code></span>
                </span>
                {!e.active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600">Masqué</span>}
                <span className="text-stone-400">→</span>
              </Link>
            </li>
          ))}
          {!emblems.length && <li className="px-5 py-8 text-center text-sm text-stone-500">Aucun emblème ajouté pour l&apos;instant.</li>}
        </ul>
      </section>

      <HiddenFlagsEditor all={allFlags} initial={hiddenFlags} />

      <section className="rounded-xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="font-extrabold">Déjà inclus</h2>
        <p className="mb-4 text-sm text-stone-500">249 pays, plus ces organisations et régions (drapeaux libres de droits, licence MIT) :</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BUILTIN_EXTRAS.map((e) => (
            <li key={e.code} className="flex items-center gap-3 text-sm">
              <img src={`/flags/${e.code}.svg`} alt="" className="h-6 w-9 rounded-sm object-cover ring-1 ring-stone-200" />
              {e.fr} <span className="text-xs text-stone-400">({GROUP_LABELS[e.group].fr})</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
