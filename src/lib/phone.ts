import { onlyDigits } from "./format";

/**
 * Convierte un teléfono argentino escrito a mano ("0343 15 412-3456", "343 4123456")
 * en el número que espera WhatsApp: 549 + característica + número, sin 0 ni 15.
 * Si no se reconoce el formato, devuelve los dígitos tal cual.
 */
export function toWhatsAppNumber(phone: string): string {
  let digits = onlyDigits(phone);
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  digits = digits.replace(/^0/, "");
  if (digits.length === 12) {
    // Característica (2 a 4 dígitos) + "15" + número: el 15 no va en WhatsApp.
    const areaLengths = digits.startsWith("11") ? [2] : [4, 3, 2];
    for (const length of areaLengths) {
      if (digits.slice(length, length + 2) === "15") {
        digits = digits.slice(0, length) + digits.slice(length + 2);
        break;
      }
    }
  }
  return digits.length === 10 ? `549${digits}` : digits;
}
