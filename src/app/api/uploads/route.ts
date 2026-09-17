import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, sniffMime, UPLOAD_DIR } from "@/lib/uploads";

export async function POST(req: Request) {
  if (!rateLimit(`upload:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 64_000) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffMime(buf);
  if (!type) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });

  const storedName = `${randomUUID()}.${type.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storedName), buf, { mode: 0o640 });

  const originalName = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "logo";
  const [row] = await db.insert(schema.uploads).values({ originalName, storedName, mime: type.mime, size: file.size }).returning({ id: schema.uploads.id });
  return NextResponse.json({ id: row.id });
}
