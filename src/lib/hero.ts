// Nombre del local en la cabecera: la última palabra va aparte (en su renglón y
// resaltada, según el diseño). La letra se achica según la palabra más larga, así
// ninguna se corta en un celular angosto.

export interface NameParts {
  /** Todo menos la última palabra (vacío si el nombre es una sola palabra). */
  lead: string;
  last: string;
}

export function splitName(name: string): NameParts {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { lead: "", last: words[0] ?? "" };
  return { lead: words.slice(0, -1).join(" "), last: words[words.length - 1] };
}

// Ancho aproximado de cada letra, en "letras promedio".
const WIDE = /[MWÑ]/i;
const NARROW = /[IÍJL1.,'·-]/i;

function wordWidth(word: string): number {
  return [...word].reduce((sum, char) => sum + (WIDE.test(char) ? 1.4 : NARROW.test(char) ? 0.6 : 1), 0);
}

/** Ancho de la palabra más larga (en letras promedio). */
export function longestWord(name: string): number {
  const widths = name.trim().split(/\s+/).filter(Boolean).map(wordWidth);
  return Math.max(1, ...widths.map((width) => Math.round(width * 10) / 10));
}
