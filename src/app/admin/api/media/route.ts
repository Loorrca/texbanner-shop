import { NextResponse } from "next/server";
import { isAdminAuthorization } from "@/lib/admin-auth";
import { MAX_MEDIA_BYTES, saveMedia } from "@/lib/media";

/** Admin image upload (behind Basic auth: every /admin path is checked in src/middleware.ts). */
export async function POST(req: Request) {
  if (!isAdminAuthorization(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "emblem" ? "emblem" : "photo";
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  if (file.size > MAX_MEDIA_BYTES) return NextResponse.json({ error: "Fichier trop lourd (15 Mo max)" }, { status: 413 });
  try {
    const url = await saveMedia(Buffer.from(await file.arrayBuffer()), kind);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Image non reconnue (JPG, PNG, WEBP ou SVG)" }, { status: 415 });
  }
}
