// src/components/ui/dark-code-block.tsx
'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface DarkCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const DarkCodeBlock: React.FC<DarkCodeBlockProps> = ({
  code,
  language = 'text',
  filename,
  showLineNumbers = true,
  className = ''
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      kotlin: 'kt',
      swift: 'swift',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      markdown: 'md',
      bash: 'sh',
      sql: 'sql',
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  // Custom dark theme based on your glassmorphic design
  const customDarkTheme = {
    ...atomDark,
    'pre[class*="language-"]': {
      ...atomDark['pre[class*="language-"]'],
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '8px',
      margin: '0',
      padding: '1rem',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    'code[class*="language-"]': {
      ...atomDark['code[class*="language-"]'],
      background: 'transparent',
      fontSize: '14px',
      lineHeight: '1.5',
    },
  };


  return (
    <div className={`relative group ${className}`}>
      {/* Header */}
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-black/20 border border-white/10 border-b-0 rounded-t-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-white/80">{filename}</span>
            )}
            <span className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              {language}
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              title="Copy code"
            >
              <motion.div
                animate={copied ? { scale: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </motion.div>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadCode}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              title="Download code"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Code Block */}
      <div className="relative rounded-b-lg">
        <SyntaxHighlighter
          language={language}
          style={customDarkTheme}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: filename || language ? '0 0 8px 8px' : '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          codeTagProps={{
            style: {
              fontSize: '14px',
              fontFamily: '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
              lineHeight: '1.5',
            }
          }}
          lineNumberStyle={{
            color: 'rgba(255, 255, 255, 0.3)',
            paddingRight: '1rem',
            fontSize: '12px',
          }}
        >
          {code}
        </SyntaxHighlighter>

      </div>

      {/* Copy success feedback */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-2 right-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
        >
          Copied!
        </motion.div>
      )}
    </div>
  );
};