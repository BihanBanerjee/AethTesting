'use client'

import { copyToClipboard, downloadCode } from '@/lib/intent';

export function useMessageActions() {
  const handleCopy = (text: string) => {
    copyToClipboard(text, 'Copied to clipboard');
  };

  const handleDownload = (code: string, filename: string) => {
    downloadCode(code, filename, 'Code downloaded');
  };

  return {
    handleCopy,
    handleDownload
  };
}