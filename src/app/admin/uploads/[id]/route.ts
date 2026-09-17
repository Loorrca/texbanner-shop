import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { UPLOAD_DIR } from "@/lib/uploads";

/** Download a customer file. Behind admin Basic auth (middleware). Always served as an attachment. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const upload = await db.query.uploads.findFirst({ where: eq(schema.uploads.id, id) });
  if (!upload) return new Response("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, path.basename(upload.storedName));
  const data = await readFile(file).catch(() => null);
  if (!data) return new Response("File missing", { status: 410 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": upload.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(upload.originalName)}`,
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
