'use client'

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, FileText } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  selectedFiles: string[];
  onRemoveFile: (file: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSendMessage,
  onKeyPress,
  isLoading,
  selectedFiles,
  onRemoveFile,
  textareaRef
}) => {
  return (
    <>
      {/* Context Files Display */}
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-white/60" />
            <span className="text-sm text-white/60">Context Files:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedFiles.map((file, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-white/20 bg-white/10 cursor-pointer"
                onClick={() => onRemoveFile(file)}
              >
                {file.split('/').pop()}
                <span className="ml-1 text-white/40">×</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Describe what you want to do with your code... (I'll understand your intent automatically!)"
          className="min-h-[100px] pr-12 bg-white/10 border-white/20 text-white resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={onSendMessage}
          disabled={!input.trim() || isLoading}
          className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700"
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};