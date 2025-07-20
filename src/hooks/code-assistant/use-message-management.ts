'use client'

import { useState, useRef, useEffect } from 'react';
import type { Message } from '@/types/code-assistant';
import type { MessageManagementState } from '../types/use-code-assistant.types';

export function useMessageManagement(): MessageManagementState {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    messagesEndRef,
    textareaRef,
    setMessages,
    setIsLoading,
  };
}