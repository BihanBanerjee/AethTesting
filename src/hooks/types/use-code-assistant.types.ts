import type { QueryIntent } from '@/lib/intent-classifier';
import type { Message, ProcessingStage, ActiveTab, IntentType } from '@/components/code-assistant/types';
import type { Project } from '@prisma/client';

export interface MessageManagementState {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  clearMessages: () => void;
}

export interface FileSelectionState {
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  availableFiles: string[];
}

export interface ProcessingState {
  currentIntent: IntentType | undefined;
  processingStage: ProcessingStage;
  progress: number;
  setCurrentIntent: (intent: IntentType | undefined) => void;
  setProcessingStage: (stage: ProcessingStage) => void;
  setProgress: (progress: number) => void;
}

export interface APIRoutingState {
  routeIntentToAPI: (intent: QueryIntent, input: string, projectId: string) => Promise<unknown>;
}

export interface ProjectContextData {
  projectId?: string;
  availableFiles: string[];
  techStack: string[];
  recentQueries: string[];
  [key: string]: unknown;
}

export interface CodeAssistantHookReturn {
  // Message state
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  
  // File state
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  availableFiles: string[];
  
  // Processing state
  currentIntent: IntentType | undefined;
  processingStage: ProcessingStage;
  progress: number;
  
  // API routing
  routeIntentToAPI: (intent: QueryIntent, input: string, projectId: string) => Promise<unknown>;
  
  // UI state
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Handlers
  handleSendMessage: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  
  // Project context
  project: Project | undefined;
  projectContext: ProjectContextData;
}