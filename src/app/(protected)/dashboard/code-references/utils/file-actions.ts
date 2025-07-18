// src/app/(protected)/dashboard/code-references/utils/file-actions.ts
import { toast } from 'sonner';

export function copyToClipboard(content: string, fileName: string): void {
  navigator.clipboard.writeText(content);
  toast.success(`${fileName} copied to clipboard`);
}

export function downloadFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${fileName} downloaded`);
}