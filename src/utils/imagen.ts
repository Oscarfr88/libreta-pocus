/** Lee un archivo como data URL. */
export function leerComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(archivo);
  });
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error('La imagen está dañada o no se puede abrir.'));
    img.src = src;
  });
}

/**
 * Prepara el logo: acepta PNG o JPG, lo achica a un máximo de 900×300 px
 * (suficiente para el PDF y liviano para guardar en el dispositivo) y conserva la transparencia del PNG.
 */
export async function prepararLogo(archivo: File): Promise<string> {
  const esPng = archivo.type === 'image/png' || /\.png$/i.test(archivo.name);
  const esJpg = archivo.type === 'image/jpeg' || /\.jpe?g$/i.test(archivo.name);
  if (!esPng && !esJpg) throw new Error('El logo tiene que ser una imagen PNG o JPG.');
  if (archivo.size > 8 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máximo 8 MB).');

  const img = await cargarImagen(await leerComoDataUrl(archivo));
  const escala = Math.min(1, 900 / img.naturalWidth, 300 / img.naturalHeight);
  const ancho = Math.max(1, Math.round(img.naturalWidth * escala));
  const alto = Math.max(1, Math.round(img.naturalHeight * escala));
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  if (!esPng) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, ancho, alto);
  return esPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
}
