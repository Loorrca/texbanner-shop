import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@/db";
import { UPLOAD_DIR } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * Shows a customer their own artwork — on the product page, in the cart and on their order page.
 *
 * Unauthenticated by necessity: the buyer has no account. The upload id is a random v4 UUID that
 * only the person who uploaded the file ever receives, which is the same protection the order
 * pages rely on. Nothing here lists or enumerates uploads.
 *
 * SVG is rasterised rather than served: an uploaded SVG is untrusted markup, and turning it into
 * a PNG removes the question entirely. PDFs get no preview; the interface falls back to the
 * file name.
 */
const DIRECT = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });

  const upload = await db.query.uploads.findFirst({ where: eq(schema.uploads.id, id) });
  if (!upload) return new Response("Not found", { status: 404 });
  if (!DIRECT.has(upload.mime) && upload.mime !== "image/svg+xml") {
    return new Response("No preview for this file type", { status: 415 });
  }

  // basename(): the stored name comes from our own uploader, but never build a path from a
  // database string without flattening it first.
  const file = path.join(UPLOAD_DIR, path.basename(upload.storedName));
  const data = await readFile(file).catch(() => null);
  if (!data) return new Response("File missing", { status: 410 });

  let body: Buffer = data;
  let mime = upload.mime;
  if (mime === "image/svg+xml") {
    body = await sharp(data).resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
    mime = "image/png";
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(upload.originalName)}`,
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
