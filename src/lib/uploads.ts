import "server-only";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Allowed customer artwork. Detected from magic bytes, never from the client-provided type. */
export function sniffMime(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return { mime: "image/webp", ext: "webp" };
  const head = buf.subarray(0, 1024).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return { mime: "image/svg+xml", ext: "svg" };
  return null;
}
