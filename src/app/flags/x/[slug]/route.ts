import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MEDIA_DIR, MEDIA_NAME } from "@/lib/media";

/** Image of a custom emblem, addressed by its picker code (x-<slug>). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return new Response("Not found", { status: 404 });
  const emblem = await db.query.emblems.findFirst({ where: eq(schema.emblems.code, `x-${slug}`) });
  const file = emblem?.image.replace(/^\/media\//, "") ?? "";
  if (!emblem || !MEDIA_NAME.test(file)) return new Response("Not found", { status: 404 });
  const data = await readFile(path.join(MEDIA_DIR, file)).catch(() => null);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
