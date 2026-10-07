import type { StoreSeed } from "@/lib/types";
import { costaneraBurgers } from "./costanera-burgers";
import { rotiseriaAlexis } from "./rotiseria-alexis";

// Para sumar una tienda: crear su archivo en esta carpeta y agregarla a la lista.
export const stores: StoreSeed[] = [rotiseriaAlexis, costaneraBurgers];
