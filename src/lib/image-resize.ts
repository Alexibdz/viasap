// Achica una foto en el navegador antes de subirla: las del celular pesan varios MB
// y en la tienda alcanza con 1400 px. Respeta la orientación de la cámara.

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function shrinkImage(file: File, maxSide = 1400): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // WebP pesa menos; si el navegador no lo genera, JPG.
  const webp = await canvasToBlob(canvas, "image/webp", 0.82);
  if (webp?.type === "image/webp") return webp;
  return (await canvasToBlob(canvas, "image/jpeg", 0.85)) ?? file;
}
