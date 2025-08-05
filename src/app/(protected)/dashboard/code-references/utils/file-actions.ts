// src/app/(protected)/dashboard/code-references/utils/file-actions.ts
import { copyToClipboard as copyToClipboardUtil, downloadCode } from '@/lib/intent';

export function copyToClipboard(content: string, fileName: string): void {
  copyToClipboardUtil(content, `${fileName} copied to clipboard`);
}

export function downloadFile(content: string, fileName: string): void {
  downloadCode(content, fileName, `${fileName} downloaded`);
}