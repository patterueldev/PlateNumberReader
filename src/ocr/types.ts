export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResult {
  text: string;
  cleaned: string;
  confidence: number;
}
