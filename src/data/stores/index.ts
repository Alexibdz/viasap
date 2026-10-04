import type { StoreSeed } from "@/lib/types";
import { dobleQueso } from "./doble-queso";
import { laEsquina } from "./la-esquina";

// Para sumar una tienda: crear su archivo en esta carpeta y agregarla a la lista.
export const stores: StoreSeed[] = [dobleQueso, laEsquina];
