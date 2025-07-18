export interface User {
  imageUrl: string | null;
  firstName: string | null;
}

export interface DisplayProperties {
  intentIcon: string;
  intentColor: string;
  confidenceLevel?: string;
  satisfactionLevel?: string;
  processingTimeFormatted?: string;
}

export interface Analytics {
  estimatedImpact?: string;
  hasEnhancedData?: boolean;
}

export interface FileReference {
  fileName: string;
  sourceCode: string;
  summary?: string;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  createdAt: string | Date;
  intent?: string | null;
  user: User;
  displayProperties: DisplayProperties;
  analytics: Analytics;
  filesReferences: FileReference[] | null;
  metadata?: Record<string, unknown> | string | number | boolean | null | undefined;
}