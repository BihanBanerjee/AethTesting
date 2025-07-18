// Complete Question type definitions matching the backend API structure

export interface User {
  id: string;
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface DisplayProperties {
  intentIcon: string;
  intentColor: string;
  confidenceLevel: string;
  satisfactionLevel: string;
  hasGeneratedCode: boolean;
  hasFileReferences: boolean;
  processingTimeFormatted: string | null;
}

export interface AiInteraction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  query: string;
  answer: string;
  intent: string;
  confidence: number | null;
  helpful: boolean | null;
  rating: number | null;
  responseTime: number | null;
  userId: string;
  projectId: string;
  sessionId: string | null;
  contextUsed: boolean;
  filesUsed: string[];
  metadata: any | null;
  modelUsed: string | null;
}

export interface CodeGeneration {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId: string;
  aiInteractionId: string;
  fileName: string;
  originalCode: string | null;
  generatedCode: string;
  applied: boolean;
  satisfaction: number | null;
  language: string | null;
  linesOfCode: number | null;
  complexity: number | null;
  changeType: string | null;
  description: string | null;
  dependencies: string[];
  testCoverage: number | null;
  performanceImpact: string | null;
  securityChecked: boolean;
  metadata: any | null;
}

export interface Analytics {
  interactions: AiInteraction[];
  codeGenerations: CodeGeneration[];
  hasEnhancedData: boolean;
  estimatedImpact: number;
}

export interface FileReference {
  fileName: string;
  sourceCode: string;
  summary?: string;
}

// Main Question interface matching the backend API response
export interface Question {
  // Core database fields
  id: string;
  createdAt: Date;
  updatedAt: Date;
  question: string;
  answer: string;
  filesReferences: any | null; // Json type from Prisma - can be array or other structures
  projectId: string;
  userId: string;
  intent: string | null;
  confidence: number | null;
  processingTime: number | null;
  satisfaction: number | null;
  
  // Joined user data
  user: User;
  
  // Enhanced fields added by API
  metadata: any | null; // Parsed JSON metadata
  analytics: Analytics;
  displayProperties: DisplayProperties;
}

// Type guards for runtime safety
export function isFileReferenceArray(value: any): value is FileReference[] {
  return Array.isArray(value) && value.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'fileName' in item && 
    'sourceCode' in item &&
    typeof item.fileName === 'string' &&
    typeof item.sourceCode === 'string'
  );
}

export function isUser(value: any): value is User {
  return typeof value === 'object' && 
         value !== null && 
         'id' in value &&
         typeof value.id === 'string' &&
         (value.imageUrl === null || typeof value.imageUrl === 'string') &&
         (value.firstName === null || typeof value.firstName === 'string') &&
         (value.lastName === null || typeof value.lastName === 'string');
}

export function isDisplayProperties(value: any): value is DisplayProperties {
  return typeof value === 'object' && 
         value !== null && 
         'intentIcon' in value &&
         'intentColor' in value &&
         typeof value.intentIcon === 'string' &&
         typeof value.intentColor === 'string';
}

// Helper function to safely get file references from filesReferences
export function getFileReferencesFromQuestion(question: Question): FileReference[] {
  if (!question.filesReferences) {
    return [];
  }
  
  if (isFileReferenceArray(question.filesReferences)) {
    return question.filesReferences;
  }
  
  // Handle other possible formats
  return [];
}

// Helper function to safely get user display name
export function getUserDisplayName(user: User): string {
  return user.firstName || 'Anonymous User';
}

// Helper function to safely get user image
export function getUserImageUrl(user: User): string {
  return user.imageUrl || '';
}