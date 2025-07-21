'use client'

import React from 'react';
import type { StreamableValue } from 'ai/rsc';
import { MessageContainer } from '../components/message-container';
import { MessageHeader } from '../components/message-header';
import { GeneratedCodeSection } from '../components/generated-code-section';
import { DiffDisplaySection } from '../components/diff-display-section';
import { SuggestionsSection } from '../components/suggestions-section';
import { FileReferencesSection } from '../components/file-references-section';
import { useMessageActions } from '../hooks/use-message-actions';
import type { MessageDisplayProps } from '../types/message-display.types';

// Component to handle streamable content
const StreamableContent: React.FC<{ content: string | StreamableValue<string> }> = ({ content }) => {
  // Debug logging to understand the structure
  console.log('StreamableContent - Processing content:', content);
  console.log('StreamableContent - Content type:', typeof content);
  
  // Check if content is a string
  if (typeof content === 'string') {
    console.log('StreamableContent - Rendering string content');
    return <div className="prose prose-invert max-w-none">{content}</div>;
  }
  
  // Handle StreamableValue object - avoid the problematic useStreamableValue hook
  if (content && typeof content === 'object') {
    console.log('StreamableContent - Handling object content');
    console.log('StreamableContent - Object keys:', Object.keys(content));
    
    // Check if this has the StreamableValue structure {curr: ..., next: ...}
    if ('curr' in content || 'next' in content) {
      console.log('StreamableContent - Found StreamableValue structure');
      
      const streamableObj = content as { curr?: string; next?: any };
      let extractedContent = '';
      
      // Get current value
      if (streamableObj.curr !== undefined && streamableObj.curr !== null) {
        extractedContent += String(streamableObj.curr);
        console.log('StreamableContent - Found curr:', streamableObj.curr);
      }
      
      // Handle next value
      if (streamableObj.next !== undefined && streamableObj.next !== null) {
        console.log('StreamableContent - Processing next:', streamableObj.next);
        
        if (typeof streamableObj.next === 'string') {
          extractedContent += streamableObj.next;
        } else if (typeof streamableObj.next === 'object') {
          // Next is an object, check if it has value property or other content
          const nextObj = streamableObj.next as any;
          console.log('StreamableContent - Next object keys:', Object.keys(nextObj));
          
          // Try to find content in the next object
          if ('value' in nextObj && nextObj.value) {
            extractedContent += String(nextObj.value);
            console.log('StreamableContent - Found value in next:', nextObj.value);
          } else if ('curr' in nextObj && nextObj.curr) {
            extractedContent += String(nextObj.curr);
            console.log('StreamableContent - Found curr in next:', nextObj.curr);
          } else if ('content' in nextObj && nextObj.content) {
            extractedContent += String(nextObj.content);
            console.log('StreamableContent - Found content in next:', nextObj.content);
          } else {
            // If next is an empty object {}, it might be streaming
            console.log('StreamableContent - Next is empty or unknown structure, showing loading...');
            extractedContent = extractedContent || 'Loading response...';
          }
        }
      }
      
      console.log('StreamableContent - Final extracted content:', extractedContent);
      return <div className="prose prose-invert max-w-none">{extractedContent || 'Processing...'}</div>;
    }
    
    // If not a StreamableValue structure, show as JSON
    console.log('StreamableContent - Not a StreamableValue, showing as JSON');
    return <div className="prose prose-invert max-w-none">{JSON.stringify(content)}</div>;
  }
  
  // Final fallback
  console.log('StreamableContent - Using final fallback');
  return <div className="prose prose-invert max-w-none">{String(content) || 'No content available'}</div>;
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
      
      <StreamableContent content={message.content} />

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