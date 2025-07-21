'use client'

import { useState } from 'react';
import { toast } from 'sonner';
import { getFileExtension } from './utils';

export const useCodeActions = (code: string, language: string, filename?: string) => {
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const handleApply = async (onApply?: () => Promise<void>) => {
    if (!onApply) return;
    
    setIsApplying(true);
    try {
      await onApply();
      toast.success('Code changes applied successfully');
    } catch {
      toast.error('Failed to apply changes');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRun = () => {
    toast.info('Code execution would happen here');
  };

  return {
    copied,
    isApplying,
    handleCopy,
    handleDownload,
    handleApply,
    handleRun
  };
};