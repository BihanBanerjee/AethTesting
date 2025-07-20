'use client'

import { toast } from 'sonner';
import { copyToClipboard, downloadCode } from '@/lib/intent';

export function useMessageActions() {
  const handleCopy = (text: string) => {
    copyToClipboard(text);
    toast.success('Copied to clipboard');
  };

  const handleDownload = (code: string, filename: string) => {
    downloadCode(code, filename);
    toast.success('Code downloaded');
  };

  return {
    handleCopy,
    handleDownload
  };
}