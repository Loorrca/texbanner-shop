import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Public catalog images uploaded from the admin (product photos, category covers, emblems). */
export const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR ?? "./storage/media");
export const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
export const MEDIA_NAME = /^[0-9a-f-]{36}\.(webp|png)$/;

export type MediaKind = "photo" | "emblem";

/**
 * Re-encodes every upload with sharp: strips metadata, neutralises malicious files
 * (SVGs are rasterised) and keeps pages fast.
 *  - photo  → WebP, max 1600 px
 *  - emblem → PNG with transparency, max 1200 px
 */
export async function saveMedia(input: Buffer, kind: MediaKind): Promise<string> {
  const img = sharp(input, { density: 300, limitInputPixels: 80_000_000 }).rotate();
  const meta = await img.metadata();
  if (!meta.format || !["jpeg", "png", "webp", "svg", "gif", "avif", "heif", "tiff"].includes(meta.format)) {
    throw new Error("Unsupported image");
  }
  const name = `${randomUUID()}.${kind === "photo" ? "webp" : "png"}`;
  const out =
    kind === "photo"
      ? await img.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer()
      : await img.resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: meta.format !== "svg" }).png({ compressionLevel: 9 }).toBuffer();
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_DIR, name), out, { mode: 0o644 });
  return `/media/${name}`;
}
