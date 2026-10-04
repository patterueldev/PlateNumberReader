import type { OcrProgress, OcrResult } from './types';

export async function recognizePlate(
  _imageUri: string,
  _onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  throw new Error('Camera text recognition runs in the web app. Type the plate number instead.');
}

export async function disposeOcr(): Promise<void> {}
