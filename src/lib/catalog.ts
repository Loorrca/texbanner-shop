import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

/** Categories that have at least one product on sale (for navigation and the home page). */
export async function getCategories() {
  const rows = await db.query.categories.findMany({
    orderBy: asc(schema.categories.sort),
    with: { products: { where: eq(schema.products.active, true), orderBy: asc(schema.products.sort) } },
  });
  return rows.filter((c) => c.products.length > 0);
}

export async function getCategory(slug: string) {
  return db.query.categories.findFirst({
    where: eq(schema.categories.slug, slug),
    with: { products: { where: eq(schema.products.active, true), orderBy: asc(schema.products.sort) } },
  });
}

export async function getProduct(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(schema.products.slug, slug), eq(schema.products.active, true)),
    with: { category: true },
  });
}

/** Lowest possible price: base + the cheapest choice of each select. */
export function fromPrice(p: schema.Product) {
  let price = p.basePrice;
  for (const o of p.options) {
    if (o.type === "select" && !o.showIf) price += Math.min(...o.choices.map((c) => c.priceDelta));
  }
  return price;
}
