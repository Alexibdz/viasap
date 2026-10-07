import { Anton, Archivo, Instrument_Sans, Instrument_Serif, Space_Mono } from "next/font/google";

// Fuentes que usan los diseños de las tiendas. Se cargan una sola vez y quedan como
// variables en :root (también para las hojas, que se abren fuera de la página).
const anton = Anton({ weight: "400", subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"] });
const instrumentSans = Instrument_Sans({ subsets: ["latin"] });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

export const designFontsCss = `:root{${[
  `--font-anton:${anton.style.fontFamily}`,
  `--font-archivo:${archivo.style.fontFamily}`,
  `--font-instrument-serif:${instrumentSerif.style.fontFamily}`,
  `--font-instrument-sans:${instrumentSans.style.fontFamily}`,
  `--font-space-mono:${spaceMono.style.fontFamily}`,
].join(";")}}`;
