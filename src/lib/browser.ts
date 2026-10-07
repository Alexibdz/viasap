// Utilidades de navegador que también funcionan sin HTTPS (por ejemplo, probando
// desde el celular con http://192.168.x.x:3000), donde no existen
// crypto.randomUUID ni navigator.clipboard.

export function createId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Copia texto al portapapeles. `container` permite crear el textarea auxiliar
 * dentro de un modal, para que el foco del modal no anule la selección.
 */
export async function copyText(text: string, container: HTMLElement = document.body): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Sigue con el método alternativo.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  container.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

/** Celular o tablet (pantalla táctil como puntero principal): ahí WhatsApp es una app. */
export function isHandheld(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Abre un chat de WhatsApp (link wa.me). En el celular va en la misma pestaña: la app
 * toma el link y la página queda como estaba. En una pestaña nueva, el navegador se
 * quedaría con una pestaña en blanco (about:blank). En la compu, pestaña nueva con
 * WhatsApp Web.
 */
export function openWhatsApp(url: string) {
  if (isHandheld()) window.location.href = url;
  else window.open(url, "_blank");
}
