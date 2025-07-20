'use client'

import { toast } from 'sonner';
import { copyToClipboard, downloadCode } from '@/utils/intent-helpers';

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