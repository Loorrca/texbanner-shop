import { readFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA_DIR, MEDIA_NAME } from "@/lib/media";

/** Serves admin-uploaded catalog images. File names are random and never change, so cache forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!MEDIA_NAME.test(file)) return new Response("Not found", { status: 404 });
  const data = await readFile(path.join(MEDIA_DIR, file)).catch(() => null);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": file.endsWith(".webp") ? "image/webp" : "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
