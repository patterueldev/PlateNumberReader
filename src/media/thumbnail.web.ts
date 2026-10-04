import { loadImage } from '@/ocr/preprocess.web';

export async function createThumbnail(uri: string): Promise<string | undefined> {
  try {
    if (typeof document === 'undefined') return undefined;
    const image = await loadImage(uri);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return undefined;

    const scale = Math.min(1, 360 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return undefined;
  }
}
