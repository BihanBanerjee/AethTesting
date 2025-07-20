'use client'

import React from 'react';
import { MessageContainer } from '../components/message-container';
import { MessageHeader } from '../components/message-header';
import { GeneratedCodeSection } from '../components/generated-code-section';
import { DiffDisplaySection } from '../components/diff-display-section';
import { SuggestionsSection } from '../components/suggestions-section';
import { FileReferencesSection } from '../components/file-references-section';
import { useMessageActions } from '../hooks/use-message-actions';
import type { MessageDisplayProps } from '../types/message-display.types';

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const { handleCopy, handleDownload } = useMessageActions();

  return (
    <MessageContainer type={message.type}>
      <MessageHeader
        intent={message.intent}
        confidence={message.confidence}
        timestamp={message.timestamp}
      />
      
      <div className="prose prose-invert max-w-none">
        {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
      </div>

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