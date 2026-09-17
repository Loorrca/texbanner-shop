"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { OptionsSchema, type ProductOption } from "@/lib/options";
import { PREVIEW_KINDS } from "@/lib/preview-kinds";
import { requireAdmin } from "@/lib/require-admin";

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const imageUrl = z.string().regex(/^\/(media\/[0-9a-f-]{36}\.(webp|png)|images\/[a-z0-9/_.-]+\.(webp|png|jpe?g))$/, "Image invalide");
const text = (max: number) => z.string().trim().max(max);
const required = (max: number, what: string) => z.string().trim().min(1, `${what} obligatoire`).max(max);

function firstError(e: z.ZodError) {
  const i = e.issues[0];
  if (!i) return "Formulaire invalide";
  // Our own messages are self-explanatory; generic zod ones get the field path for context.
  return /obligatoire|invalide|minuscules|négatif|maximum/i.test(i.message) ? i.message : `${i.path.join(" › ")} : ${i.message}`;
}

function refresh() {
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------- categories */

const CategoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(slugRe, "Identifiant URL : minuscules, chiffres et tirets"),
  nameFr: required(80, "Nom (FR)"),
  nameAr: required(80, "Nom (AR)"),
  descFr: text(500),
  descAr: text(500),
  image: imageUrl.nullable(),
  sort: z.number().int().min(0).max(999),
});

export async function saveCategory(input: z.input<typeof CategoryInput>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;

  const clash = await db.query.categories.findFirst({
    where: id ? and(eq(schema.categories.slug, data.slug), ne(schema.categories.id, id)) : eq(schema.categories.slug, data.slug),
  });
  if (clash) return { ok: false, error: "Cet identifiant URL est déjà utilisé par une autre catégorie" };

  if (id) {
    await db.update(schema.categories).set(data).where(eq(schema.categories.id, id));
    refresh();
    return { ok: true, id };
  }
  const [row] = await db.insert(schema.categories).values(data).returning({ id: schema.categories.id });
  refresh();
  return { ok: true, id: row.id };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  z.string().uuid().parse(id);
  const [{ n }] = await db.select({ n: count() }).from(schema.products).where(eq(schema.products.categoryId, id));
  if (n > 0) return { ok: false, error: `Impossible : cette catégorie contient encore ${n} produit(s). Déplacez-les ou supprimez-les d'abord.` };
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  refresh();
  return { ok: true, id };
}

/* ------------------------------------------------------------------ products */

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid("Catégorie obligatoire"),
  slug: z.string().regex(slugRe, "Identifiant URL : minuscules, chiffres et tirets"),
  nameFr: required(120, "Nom (FR)"),
  nameAr: required(120, "Nom (AR)"),
  descFr: text(2000),
  descAr: text(2000),
  preview: z.enum(PREVIEW_KINDS.map((k) => k.value) as [string, ...string[]]).nullable(),
  images: z.array(imageUrl).max(12, "12 photos maximum"),
  basePrice: z.number().int("Prix invalide").min(0, "Le prix ne peut pas être négatif").max(100_000_000),
  options: OptionsSchema,
  active: z.boolean(),
  sort: z.number().int().min(0).max(999),
});

/** Friendly message for the most common mistake: an option or choice left without a title. */
function emptyLabel(options: unknown): string | null {
  if (!Array.isArray(options)) return null;
  for (const [i, o] of options.entries()) {
    const name = o?.labelFr?.trim() || `n° ${i + 1}`;
    if (!o?.labelFr?.trim() || !o?.labelAr?.trim()) return `Option ${name} : le titre en français et en arabe est obligatoire`;
    if (o.type === "select") {
      if (!o.choices?.length) return `Option « ${name} » : ajoutez au moins un choix`;
      for (const [k, c] of o.choices.entries()) {
        if (!c?.labelFr?.trim() || !c?.labelAr?.trim()) return `Option « ${name} », choix n° ${k + 1} : libellé français et arabe obligatoires`;
      }
    }
  }
  return null;
}

/** Checks the zod schema cannot express: unique keys/values and valid conditions. */
function optionProblems(options: ProductOption[]): string | null {
  const keys = new Set<string>();
  for (const o of options) {
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(o.key)) return `Option « ${o.labelFr} » : clé technique invalide`;
    if (keys.has(o.key)) return `Deux options utilisent la même clé « ${o.key} »`;
    keys.add(o.key);
    if (o.type === "select") {
      const values = new Set<string>();
      for (const c of o.choices) {
        if (values.has(c.value)) return `Option « ${o.labelFr} » : deux choix ont la même valeur « ${c.value} »`;
        values.add(c.value);
      }
    }
  }
  for (const o of options) {
    if (!o.showIf) continue;
    const dep = options.find((x) => x.key === o.showIf!.key);
    if (!dep || dep === o || dep.type !== "select" || !dep.choices.some((c) => c.value === o.showIf!.value)) {
      return `Option « ${o.labelFr} » : la condition d'affichage ne correspond à aucun choix existant`;
    }
  }
  return null;
}

export async function saveProduct(input: z.input<typeof ProductInput>): Promise<ActionResult> {
  await requireAdmin();
  const unnamed = emptyLabel(input.options);
  if (unnamed) return { ok: false, error: unnamed };
  const parsed = ProductInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  if (!data.preview && data.images.length === 0) return { ok: false, error: "Ajoutez au moins une photo, ou choisissez un aperçu dessiné" };
  const problem = optionProblems(data.options);
  if (problem) return { ok: false, error: problem };

  const category = await db.query.categories.findFirst({ where: eq(schema.categories.id, data.categoryId) });
  if (!category) return { ok: false, error: "Catégorie introuvable" };
  const clash = await db.query.products.findFirst({
    where: id ? and(eq(schema.products.slug, data.slug), ne(schema.products.id, id)) : eq(schema.products.slug, data.slug),
  });
  if (clash) return { ok: false, error: "Cet identifiant URL est déjà utilisé par un autre produit" };

  if (id) {
    const res = await db.update(schema.products).set(data).where(eq(schema.products.id, id)).returning({ id: schema.products.id });
    if (!res.length) return { ok: false, error: "Produit introuvable" };
    refresh();
    return { ok: true, id };
  }
  const [row] = await db.insert(schema.products).values(data).returning({ id: schema.products.id });
  refresh();
  return { ok: true, id: row.id };
}

export async function duplicateProduct(id: string) {
  await requireAdmin();
  z.string().uuid().parse(id);
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (!p) throw new Error("Produit introuvable");
  let slug = `${p.slug}-copie`;
  for (let i = 2; await db.query.products.findFirst({ where: eq(schema.products.slug, slug) }); i++) slug = `${p.slug}-copie-${i}`;
  const [row] = await db
    .insert(schema.products)
    .values({
      categoryId: p.categoryId, slug, nameFr: `${p.nameFr} (copie)`, nameAr: `${p.nameAr} (نسخة)`, descFr: p.descFr, descAr: p.descAr,
      preview: p.preview, images: p.images, basePrice: p.basePrice, options: p.options, active: false, sort: p.sort + 1,
    })
    .returning({ id: schema.products.id });
  refresh();
  redirect(`/admin/products/${row.id}?copie=1`);
}

/** Deletes a product, or hides it when orders reference it (keeps order history intact). */
export async function deleteProduct(id: string): Promise<{ ok: true; hidden: boolean; categorySlug: string } | { ok: false; error: string }> {
  await requireAdmin();
  z.string().uuid().parse(id);
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id), with: { category: true } });
  if (!p) return { ok: false, error: "Produit introuvable" };
  const [{ n }] = await db.select({ n: count() }).from(schema.orderItems).where(eq(schema.orderItems.productId, id));
  if (n > 0) {
    await db.update(schema.products).set({ active: false }).where(eq(schema.products.id, id));
  } else {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  }
  refresh();
  return { ok: true, hidden: n > 0, categorySlug: p.category.slug };
}

/* ------------------------------------------------------------------- emblems */

const EmblemInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().regex(slugRe, "Identifiant : minuscules, chiffres et tirets").max(60),
  nameFr: required(80, "Nom (FR)"),
  nameAr: required(80, "Nom (AR)"),
  group: z.enum(schema.emblemGroup.enumValues),
  image: z.string().regex(/^\/media\/[0-9a-f-]{36}\.png$/, "Image obligatoire"),
  active: z.boolean(),
  sort: z.number().int().min(0).max(999),
});

export async function saveEmblem(input: z.input<typeof EmblemInput>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = EmblemInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, slug, ...rest } = parsed.data;
  const code = `x-${slug}`;
  const clash = await db.query.emblems.findFirst({
    where: id ? and(eq(schema.emblems.code, code), ne(schema.emblems.id, id)) : eq(schema.emblems.code, code),
  });
  if (clash) return { ok: false, error: "Cet identifiant est déjà utilisé" };
  if (id) {
    await db.update(schema.emblems).set({ ...rest, code }).where(eq(schema.emblems.id, id));
  } else {
    await db.insert(schema.emblems).values({ ...rest, code });
  }
  revalidatePath("/admin/emblems");
  return { ok: true, id: id ?? code };
}

export async function deleteEmblem(id: string): Promise<ActionResult> {
  await requireAdmin();
  z.string().uuid().parse(id);
  await db.delete(schema.emblems).where(eq(schema.emblems.id, id));
  revalidatePath("/admin/emblems");
  return { ok: true, id };
}
