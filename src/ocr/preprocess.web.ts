export async function loadImage(uri: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not read the captured photo.'));
  });
  image.src = uri;
  await loaded;
  return image;
}

export async function preprocessForOcr(uri: string): Promise<string> {
  if (typeof document === 'undefined') return uri;
  const image = await loadImage(uri);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) return uri;

  const cropWidth = Math.floor(width * 0.94);
  const cropHeight = Math.floor(height * 0.36);
  const sourceX = Math.floor((width - cropWidth) / 2);
  const sourceY = Math.floor((height - cropHeight) / 2);

  const scale = Math.min(1, 1400 / cropWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));

  const context = canvas.getContext('2d');
  if (!context) return uri;
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const grays = new Uint8ClampedArray(pixels.length / 4);
  let min = 255;
  let max = 0;

  for (let i = 0, j = 0; i < pixels.length; i += 4, j += 1) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    grays[j] = gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }

  const range = Math.max(1, max - min);
  for (let i = 0, j = 0; i < pixels.length; i += 4, j += 1) {
    const value = ((grays[j] - min) / range) * 255;
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}
