'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, RefreshCw, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { EnhancedCodeBlock as CodeBlock } from '@/components/code/code-viewer';
import { DiffViewer } from '@/components/code/diff-viewer/index';
import { getIntentIcon, getIntentColor, copyToClipboard, downloadCode } from '@/utils/intent-helpers';
import type { Message } from '@/types/code-assistant';


interface MessageDisplayProps {
  message: Message;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const handleCopy = (text: string) => {
    copyToClipboard(text);
    toast.success('Copied to clipboard');
  };

  const handleDownload = (code: string, filename: string) => {
    downloadCode(code, filename);
    toast.success('Code downloaded');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-4xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
        <GlassmorphicCard className={`p-4 ${
          message.type === 'user' 
            ? 'bg-indigo-600/20 border-indigo-500/30' 
            : 'bg-white/10 border-white/20'
        }`}>
          {message.intent && (
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${getIntentColor(message.intent)}`}>
                {getIntentIcon(message.intent)}
                <span className="ml-1">{message.intent.replace('_', ' ')}</span>
              </Badge>
              {message.confidence && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(message.confidence * 100)}% confidence
                </Badge>
              )}
              <span className="text-xs text-white/60">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
          </div>

          {/* Enhanced Code Generation Result */}
          {message.metadata?.generatedCode && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-white flex items-center">
                  {getIntentIcon(message.intent)}
                  <span className="ml-1">Generated Code</span>
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(message.metadata!.generatedCode!)}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(
                      message.metadata!.generatedCode!, 
                      `generated-${message.intent}.${message.metadata!.language === 'typescript' ? 'ts' : 'js'}`
                    )}
                    className="border-white/20 bg-white/10 text-white"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CodeBlock
                code={message.metadata.generatedCode}
                language={message.metadata.language || 'typescript'}
                actions={{
                  copy: true,
                  download: true
                }}
              />
            </div>
          )}

          {/* Enhanced Diff Display */}
          {message.metadata?.diff && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                <RefreshCw className="h-4 w-4 mr-1" />
                Suggested Changes
              </h4>
              <DiffViewer
                original={message.metadata.diff.original}
                modified={message.metadata.diff.modified}
                filename={message.metadata.diff.filename}
              />
            </div>
          )}

          {/* Enhanced Suggestions */}
          {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1" />
                AI Suggestions
              </h4>
              <div className="space-y-2">
                {message.metadata.suggestions.map((suggestion, index) => (
                  <GlassmorphicCard key={index} className="p-3 bg-white/5">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          suggestion.type === 'improvement' ? 'border-green-500/30 text-green-300' :
                          suggestion.type === 'bug_fix' ? 'border-red-500/30 text-red-300' :
                          suggestion.type === 'security' ? 'border-orange-500/30 text-orange-300' :
                          'border-blue-500/30 text-blue-300'
                        }`}
                      >
                        {suggestion.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/80 mt-1">{suggestion.description}</p>
                    {suggestion.code && (
                      <CodeBlock
                        code={suggestion.code}
                        language="typescript"
                        className="mt-2"
                        actions={{ copy: true }}
                      />
                    )}
                  </GlassmorphicCard>
                ))}
              </div>
            </div>
          )}

          {/* File References */}
          {message.metadata?.files && message.metadata.files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-white mb-2">Referenced Files</h4>
              <div className="flex flex-wrap gap-1">
                {message.metadata.files.map((file, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {file.split('/').pop()}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </GlassmorphicCard>
      </div>
    </motion.div>
  );
};