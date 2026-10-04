// Aviso sonoro de pedido nuevo, generado con Web Audio (sin archivos de sonido).
// Los navegadores lo habilitan recién después de que la persona tocó algo en la página.

let context: AudioContext | null = null;

export function playChime() {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime;
    [880, 1175].forEach((frequency, index) => {
      const at = start + index * 0.18;
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      oscillator.connect(gain).connect(context!.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.45);
    });
  } catch {
    // Sin audio disponible: el aviso visual alcanza.
  }
}
