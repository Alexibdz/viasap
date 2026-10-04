import "server-only";

import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// Persistencia de la beta: archivos JSON en /data (fuera de src y public).
// Funciona en tu PC o en un servidor propio. En plataformas sin disco persistente
// (Vercel, por ejemplo) los cambios se pierden: ahí corresponde pasar a Supabase,
// reemplazando este módulo y los repositorios que lo usan.

const DATA_DIR = process.env.VIASAP_DATA_DIR ?? path.join(process.cwd(), "data");

export function dataPath(...segments: string[]): string {
  // Son datos de ejecución, no código: sin el comentario, el build empaqueta todo el proyecto.
  return path.join(/*turbopackIgnore: true*/ DATA_DIR, ...segments);
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Escribe en un archivo temporal y lo renombra: nunca queda un JSON a medio escribir. */
export async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), "utf8");
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(temp, file);
      return;
    } catch (error) {
      // En Windows el antivirus o un lector pueden bloquear el archivo un instante.
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 5 || (code !== "EPERM" && code !== "EBUSY")) throw error;
      await sleep(40 * attempt);
    }
  }
}

export async function listJsonNames(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

const locks = new Map<string, Promise<unknown>>();

/** Ejecuta las lecturas-modificaciones-escrituras de un mismo archivo de a una. */
export function withFileLock<T>(file: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(file) ?? Promise.resolve();
  const run = previous.then(task, task);
  locks.set(
    file,
    run.catch(() => undefined),
  );
  return run;
}
