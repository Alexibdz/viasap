// Título de la portada: el nombre del local en hasta tres renglones, con el del
// medio resaltado ("Título / del / negocio").

export interface TitleLine {
  text: string;
  mark: boolean;
}

/** Reparte las palabras en tres renglones lo más parejos posible (el más largo, lo más corto). */
function balance(words: string[]): string[] {
  const join = (from: number, to: number) => words.slice(from, to).join(" ");
  let best: string[] = [];
  let bestWidth = Infinity;
  for (let i = 1; i < words.length - 1; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const lines = [join(0, i), join(i, j), join(j, words.length)];
      const width = Math.max(...lines.map((line) => line.length));
      if (width < bestWidth) {
        best = lines;
        bestWidth = width;
      }
    }
  }
  return best;
}

export function heroTitleLines(name: string): TitleLine[] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  if (words.length === 1) return [{ text: words[0], mark: false }];
  // Con dos palabras se resalta la segunda ("Doble / QUESO").
  if (words.length === 2) return [{ text: words[0], mark: false }, { text: words[1], mark: true }];
  const lines = words.length === 3 ? words : balance(words);
  return lines.map((text, index) => ({ text, mark: index === 1 }));
}

// Ancho aproximado de cada letra en mayúscula, en "letras promedio".
const WIDE = /[MWÑ]/i;
const NARROW = /[IÍJL1 .,'·-]/i;

function lineWidth(text: string): number {
  return [...text].reduce((sum, char) => sum + (WIDE.test(char) ? 1.4 : NARROW.test(char) ? 0.6 : 1), 0);
}

/** Ancho del renglón más largo (en letras promedio): con eso se achica la letra para que entre. */
export function longestLine(lines: TitleLine[]): number {
  return Math.max(1, ...lines.map((line) => Math.round(lineWidth(line.text) * 10) / 10));
}
