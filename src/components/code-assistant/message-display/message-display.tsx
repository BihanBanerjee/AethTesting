'use client'

import React, { useState } from 'react';
import type { StreamableValue } from 'ai/rsc';
import { Copy, Check } from 'lucide-react';
import { MessageContainer } from '../components/message-container';
import { MessageHeader } from '../components/message-header';
import { GeneratedCodeSection } from '../components/generated-code-section';
import { DiffDisplaySection } from '../components/diff-display-section';
import { SuggestionsSection } from '../components/suggestions-section';
import { FileReferencesSection } from '../components/file-references-section';
import { EnhancedResponseDisplay } from '../enhanced-response/enhanced-response-display';
import { useMessageActions } from '../hooks/use-message-actions';
import type { MessageDisplayProps } from '../types/message-display.types';

// ChatGPT-style streamable content component with markdown support
const StreamableContent: React.FC<{ content: string | StreamableValue<string>, messageType: 'user' | 'assistant' }> = ({ content, messageType }) => {
  const [copied, setCopied] = useState(false);
  
  // Extract content from various formats
  const extractContent = (): string => {
    if (typeof content === 'string') {
      return content;
    }
    
    if (content && typeof content === 'object') {
      const streamableObj = content as { curr?: string; next?: unknown };
      let extractedContent = '';
      
      // Get current value
      if (streamableObj.curr !== undefined && streamableObj.curr !== null) {
        extractedContent += String(streamableObj.curr);
      }
      
      // Handle next value
      if (streamableObj.next !== undefined && streamableObj.next !== null) {
        if (typeof streamableObj.next === 'string') {
          extractedContent += streamableObj.next;
        } else if (typeof streamableObj.next === 'object') {
          const nextObj = streamableObj.next as Record<string, unknown>;
          if ('value' in nextObj && nextObj.value) {
            extractedContent += String(nextObj.value);
          } else if ('curr' in nextObj && nextObj.curr) {
            extractedContent += String(nextObj.curr);
          } else if ('content' in nextObj && nextObj.content) {
            extractedContent += String(nextObj.content);
          }
        }
      }
      
      return extractedContent || 'Processing...';
    }
    
    return String(content) || 'No content available';
  };

  const contentText = extractContent();
  
  // Copy message content
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // User messages: simple text with copy button
  if (messageType === 'user') {
    return (
      <div className="relative group">
        <div className="text-white/90 leading-relaxed break-words">
          {contentText}
        </div>
        
        {/* Copy button for user messages */}
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded bg-white/10 hover:bg-white/20 ${copied ? 'copy-button-success' : ''}`}
          title="Copy message"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 text-white/60 hover:text-white/80" />
          )}
        </button>
      </div>
    );
  }

  // Assistant messages: enhanced display for long responses, simple markdown for short ones
  return (
    <div className="relative group">
      {/* Use enhanced display for long responses, simple markdown for short ones */}
      <EnhancedResponseDisplay 
        content={contentText} 
        messageType={messageType}
      />
      
      {/* Streaming indicator */}
      {contentText === 'Processing...' && (
        <div className="flex items-center gap-2 mt-4 text-white/50">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
          <span className="text-sm">AI is thinking...</span>
        </div>
      )}
    </div>
  );
};

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const { handleCopy, handleDownload } = useMessageActions();

  return (
    <MessageContainer type={message.type}>
      <MessageHeader
        intent={message.intent}
        confidence={message.confidence}
        timestamp={message.timestamp}
      />
      
      <StreamableContent content={message.content} messageType={message.type} />

      {/* Generated Code Section */}
      {message.metadata?.generatedCode && (
        <GeneratedCodeSection
          generatedCode={message.metadata.generatedCode}
          language={message.metadata.language}
          intent={message.intent}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      )}

      {/* Diff Display Section */}
      {message.metadata?.diff && (
        <DiffDisplaySection diff={message.metadata.diff} />
      )}

      {/* Suggestions Section */}
      {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
        <SuggestionsSection suggestions={message.metadata.suggestions} />
      )}

      {/* File References Section */}
      {message.metadata?.files && message.metadata.files.length > 0 && (
        <FileReferencesSection files={message.metadata.files} />
      )}
    </MessageContainer>
  );
};