// src/components/ui/dark-markdown.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DarkCodeBlock } from './dark-code-block';

interface DarkMarkdownProps {
  content: string;
  className?: string;
}

export const DarkMarkdown: React.FC<DarkMarkdownProps> = ({ 
  content, 
  className = '' 
}) => {
  return (
    <div className={`prose prose-invert prose-lg max-w-full break-words overflow-wrap-anywhere ${className}`}>
      <ReactMarkdown
        components={{
          // Custom code block renderer
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const inline = !match;
            
            if (!inline && match) {
              const code = String(children).replace(/\n$/, '');
              return (
                <DarkCodeBlock
                  code={code}
                  language={language}
                  className="my-4"
                />
              );
            }
            
            // Inline code
            return (
              <code 
                className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-sm font-mono border border-indigo-500/30" 
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white mb-3 mt-5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-white mb-2 mt-4">
              {children}
            </h3>
          ),
          
          // Custom paragraph styles
          p: ({ children }) => (
            <p className="text-white/90 mb-4 leading-relaxed break-words overflow-wrap-anywhere">
              {children}
            </p>
          ),
          
          // Custom list styles
          ul: ({ children }) => (
            <ul className="text-white/90 mb-4 pl-6 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-white/90 mb-4 pl-6 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative">
              <span className="absolute -left-6 text-indigo-400">•</span>
              {children}
            </li>
          ),
          
          // Custom blockquote styles
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-2 my-4 bg-indigo-500/10 rounded-r-lg">
              <div className="text-white/80 italic">
                {children}
              </div>
            </blockquote>
          ),
          
          // Custom table styles
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 max-w-full">
              <table className="min-w-full border-collapse border border-white/20 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/10">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-white/20 px-3 py-2 text-left text-white font-semibold break-words">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-white/20 px-3 py-2 text-white/90 break-words overflow-wrap-anywhere">
              {children}
            </td>
          ),
          
          // Custom link styles
          a: ({ children, href }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/50 hover:decoration-indigo-300 transition-colors"
            >
              {children}
            </a>
          ),
          
          // Custom horizontal rule
          hr: () => (
            <hr className="border-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-8" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};