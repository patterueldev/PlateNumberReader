import { notify } from '@/ui/dialog';

export function downloadTextFile(filename: string, content: string, mime = 'text/plain'): void {
  void filename;
  void content;
  void mime;
  notify('Download available on web', 'Open the web app to export files. This will work natively in a future build.');
}

export async function pickTextFile(): Promise<string | null> {
  notify('Import available on web', 'Open the web app to import a backup file. This will work natively in a future build.');
  return null;
}
