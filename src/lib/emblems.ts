import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { CustomFlag } from "./countries";

/** Flag codes hidden from the picker in /admin/emblems (countries, organisations or custom emblems). */
export async function getHiddenFlags(): Promise<string[]> {
  const rows = await db.select({ code: schema.hiddenFlags.code }).from(schema.hiddenFlags);
  return rows.map((r) => r.code);
}

/** Active custom emblems, in the shape the flag picker and pricing need. */
export async function getCustomFlags(): Promise<CustomFlag[]> {
  const rows = await db
    .select({ code: schema.emblems.code, nameFr: schema.emblems.nameFr, nameAr: schema.emblems.nameAr, group: schema.emblems.group })
    .from(schema.emblems)
    .where(eq(schema.emblems.active, true))
    .orderBy(asc(schema.emblems.sort), asc(schema.emblems.nameFr));
  return rows;
}
