'use client'

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { Message } from '@/components/code-assistant/types';
import type { MessageManagementState } from '../types/use-code-assistant.types';

interface PersistedMessageState {
  messages: Message[];
}

// Serialize message content to handle StreamableValue and other complex objects
const serializeMessageContent = (content: string | any): string => {
  if (typeof content === 'string') {
    return content;
  }
  
  if (content && typeof content === 'object') {
    // Handle StreamableValue objects
    const streamableObj = content as { curr?: string; next?: unknown };
    let extractedContent = '';
    
    if (streamableObj.curr !== undefined && streamableObj.curr !== null) {
      extractedContent += String(streamableObj.curr);
    }
    
    if (streamableObj.next !== undefined && streamableObj.next !== null) {
      if (typeof streamableObj.next === 'string') {
        extractedContent += streamableObj.next;
      } else if (typeof streamableObj.next === 'object') {
        const nextObj = streamableObj.next as Record<string, unknown>;
        if ('value' in nextObj && nextObj.value) {
          extractedContent += String(nextObj.value);
        } else if ('curr' in nextObj && nextObj.curr) {
          extractedContent += String(nextObj.curr);
          // Recursively handle nested StreamableValue objects
          if ('next' in nextObj && nextObj.next) {
            extractedContent += serializeMessageContent(nextObj);
          }
        }
      }
    }
    
    return extractedContent || JSON.stringify(content);
  }
  
  return String(content);
};

// Serialize messages for localStorage storage
const serializeMessages = (messages: Message[]) => {
  return messages.map(message => ({
    ...message,
    content: serializeMessageContent(message.content),
    timestamp: message.timestamp.toISOString() // Convert Date to string
  }));
};

// Deserialize messages from localStorage
const deserializeMessages = (messages: any[]): Message[] => {
  return messages.map(message => ({
    ...message,
    content: message.content, // Already a string after serialization
    timestamp: new Date(message.timestamp) // Convert string back to Date
  }));
};

// Check localStorage size and availability
const validateStorageSize = (data: string, key: string): boolean => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit (conservative)
  
  if (data.length > MAX_SIZE) {
    console.warn(`🚨 localStorage: Data for ${key} exceeds 5MB limit (${(data.length / (1024 * 1024)).toFixed(2)}MB)`);
    return false;
  }
  
  return true;
};

// localStorage persistence functions
const saveMessagesToStorage = (key: string, messages: Message[]) => {
  try {
    if (typeof window !== 'undefined') {
      const serializedMessages = serializeMessages(messages);
      const dataString = JSON.stringify({ messages: serializedMessages });
      
      // Validate size before storing
      if (!validateStorageSize(dataString, key)) {
        console.warn('🚨 Truncating old messages due to size limit');
        // Keep only the last 50 messages to stay within limits
        const truncatedMessages = messages.slice(-50);
        const truncatedSerialized = serializeMessages(truncatedMessages);
        const truncatedDataString = JSON.stringify({ messages: truncatedSerialized });
        
        if (validateStorageSize(truncatedDataString, key)) {
          window.localStorage.setItem(key, truncatedDataString);
          console.log(`✅ Saved ${truncatedMessages.length} messages (truncated from ${messages.length})`);
        } else {
          console.error('❌ Even truncated messages exceed storage limits');
        }
        return;
      }
      
      window.localStorage.setItem(key, dataString);
      console.log(`💾 Code Assistant: Saved ${messages.length} messages to localStorage`);
    }
  } catch (error) {
    console.error('Error saving messages to localStorage:', error);
    
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('🚨 localStorage quota exceeded, clearing old data');
      try {
        // Try to clear old messages and save current ones
        const truncatedMessages = messages.slice(-20);
        const truncatedSerialized = serializeMessages(truncatedMessages);
        window.localStorage.setItem(key, JSON.stringify({ messages: truncatedSerialized }));
        console.log(`✅ Saved ${truncatedMessages.length} messages after clearing storage`);
      } catch (fallbackError) {
        console.error('❌ Failed to save even after clearing storage:', fallbackError);
      }
    }
  }
};

const loadMessagesFromStorage = (key: string): Message[] => {
  try {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) as PersistedMessageState : null;
      if (parsed?.messages) {
        return deserializeMessages(parsed.messages as any[]);
      }
    }
  } catch (error) {
    console.error('Error loading messages from localStorage:', error);
  }
  return [];
};

const clearMessagesFromStorage = (key: string) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error clearing messages from localStorage:', error);
  }
};

export function useMessageManagement(): MessageManagementState {
  const { user, isLoaded } = useUser();
  
  // Create user-specific storage key
  const storageKey = isLoaded && user?.id ? `Aetheria-codeAssistant-messages-${user.id}` : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restore messages from localStorage when storage key is ready
  useEffect(() => {
    if (storageKey && !hasRestored) {
      console.log('🔄 Code Assistant: Restoring messages from localStorage');
      const savedMessages = loadMessagesFromStorage(storageKey);
      if (savedMessages.length > 0) {
        console.log(`✅ Code Assistant: Restored ${savedMessages.length} messages`);
        setMessages(savedMessages);
      }
      setHasRestored(true);
    }
  }, [storageKey, hasRestored]);

  // Persist messages when they change (debounced)
  useEffect(() => {
    if (storageKey && hasRestored && messages.length > 0) {
      console.log('💾 Code Assistant: Persisting messages to localStorage');
      saveMessagesToStorage(storageKey, messages);
    }
  }, [messages, storageKey, hasRestored]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced setMessages that includes persistence
  const setMessagesWithPersistence = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setMessages(newMessages);
  };

  // Clear messages and storage
  const clearMessages = () => {
    setMessages([]);
    if (storageKey) {
      clearMessagesFromStorage(storageKey);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    textareaRef,
    setMessages: setMessagesWithPersistence,
    setIsLoading,
    clearMessages,
  };
}