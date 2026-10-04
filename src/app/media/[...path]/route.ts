import { readFile } from "node:fs/promises";
import { dataPath } from "@/lib/server/storage";
import { SAFE_NAME } from "@/lib/validation";

// Fotos subidas desde el panel (data/uploads/<slug>/<archivo>). Los nombres son
// aleatorios y nunca se reescriben, así que se pueden cachear para siempre.

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };
const FILE_NAME = /^[a-f0-9]{16}\.(webp|jpg|png)$/;

export async function GET(_request: Request, context: RouteContext<"/media/[...path]">) {
  const { path } = await context.params;
  const [slug, file] = path;
  if (path.length !== 2 || !SAFE_NAME.test(slug) || !FILE_NAME.test(file)) {
    return new Response("No encontrado", { status: 404 });
  }
  try {
    const body = await readFile(dataPath("uploads", slug, file));
    return new Response(body, {
      headers: {
        "Content-Type": TYPES[file.split(".")[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
