// Complete Question type definitions matching the backend API structure

// JSON data types for flexible content storage
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

// Context files structure
export interface ContextFile {
  fileName: string;
  content: string;
  path?: string;
  language?: string;
}

// Metadata structure for questions
export interface QuestionMetadata {
  generatedCode?: string;
  language?: string;
  complexity?: number;
  estimatedTime?: number;
  tags?: string[];
  relatedQuestions?: string[];
  [key: string]: JsonValue | undefined;
}

// Requirements structure for code generation
export interface CodeRequirements {
  functionality: string;
  constraints?: string[];
  preferredApproach?: string;
  dependencies?: string[];
  [key: string]: JsonValue | undefined;
}

export interface User {
  id: string;
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface DisplayProperties {
  intentIcon: string;
  intentColor: string;
  confidenceLevel: string | null;
  satisfactionLevel: string | null;
  hasGeneratedCode: boolean;
  hasFileReferences: boolean;
  processingTimeFormatted: string | null;
}

export interface AiInteraction {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  query: string;
  intent: string;
  confidence: number | null;
  helpful: boolean | null;
  rating: number | null;
  responseTime: number | null;
  userId: string;
  projectId: string;
  contextFiles: ContextFile[] | null;
  metadata: JsonObject | null;
  modelUsed: string | null;
  responseType: string | null;
  success: boolean;
  errorMessage: string | null;
  feedback: string | null;
  tokenCount: number | null;
}

export interface CodeGeneration {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  projectId: string;
  prompt: string;
  intent: string;
  requirements: CodeRequirements | null;
  contextFiles: ContextFile[] | null;
  generatedCode: string | null;
  filename: string | null;
  language: string | null;
  complexity: number | null;
  linesOfCode: number | null;
  applied: boolean;
  modified: boolean;
  satisfaction: number | null;
  modelUsed: string | null;
  tokenCount: number | null;
  generationTime: number | null;
  timesSaved: number | null;
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
  filesReferences: JsonValue | null; // Json type from Prisma - can be array or other structures
  projectId: string;
  userId: string;
  intent: string | null;
  confidence: number | null;
  processingTime: number | null;
  satisfaction: number | null;
  
  // Joined user data
  user: User;
  
  // Enhanced fields added by API
  metadata: QuestionMetadata | null; // Parsed JSON metadata
  analytics: Analytics;
  displayProperties: DisplayProperties;
}

// Type guards for runtime safety
export function isFileReferenceArray(value: unknown): value is FileReference[] {
  return Array.isArray(value) && value.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'fileName' in item && 
    'sourceCode' in item &&
    typeof item.fileName === 'string' &&
    typeof item.sourceCode === 'string'
  );
}

export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return typeof obj.id === 'string' &&
         (obj.imageUrl === null || typeof obj.imageUrl === 'string') &&
         (obj.firstName === null || typeof obj.firstName === 'string') &&
         (obj.lastName === null || typeof obj.lastName === 'string');
}

export function isDisplayProperties(value: unknown): value is DisplayProperties {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return typeof obj.intentIcon === 'string' &&
         typeof obj.intentColor === 'string' &&
         (obj.confidenceLevel === null || typeof obj.confidenceLevel === 'string') &&
         (obj.satisfactionLevel === null || typeof obj.satisfactionLevel === 'string') &&
         typeof obj.hasGeneratedCode === 'boolean' &&
         typeof obj.hasFileReferences === 'boolean' &&
         (obj.processingTimeFormatted === null || typeof obj.processingTimeFormatted === 'string');
}

// Type guard for ContextFile
export function isContextFile(value: unknown): value is ContextFile {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return typeof obj.fileName === 'string' &&
         typeof obj.content === 'string' &&
         (obj.path === undefined || typeof obj.path === 'string') &&
         (obj.language === undefined || typeof obj.language === 'string');
}

// Type guard for ContextFile array
export function isContextFileArray(value: unknown): value is ContextFile[] {
  return Array.isArray(value) && value.every(isContextFile);
}

// Type guard for QuestionMetadata
export function isQuestionMetadata(value: unknown): value is QuestionMetadata {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check optional properties if they exist
  return (obj.generatedCode === undefined || typeof obj.generatedCode === 'string') &&
         (obj.language === undefined || typeof obj.language === 'string') &&
         (obj.complexity === undefined || typeof obj.complexity === 'number') &&
         (obj.estimatedTime === undefined || typeof obj.estimatedTime === 'number') &&
         (obj.tags === undefined || (Array.isArray(obj.tags) && obj.tags.every(tag => typeof tag === 'string'))) &&
         (obj.relatedQuestions === undefined || (Array.isArray(obj.relatedQuestions) && obj.relatedQuestions.every(q => typeof q === 'string')));
}

// Type guard for CodeRequirements
export function isCodeRequirements(value: unknown): value is CodeRequirements {
  if (typeof value !== 'object' || value === null) return false;
  
  const obj = value as Record<string, unknown>;
  
  return typeof obj.functionality === 'string' &&
         (obj.constraints === undefined || (Array.isArray(obj.constraints) && obj.constraints.every(c => typeof c === 'string'))) &&
         (obj.preferredApproach === undefined || typeof obj.preferredApproach === 'string') &&
         (obj.dependencies === undefined || (Array.isArray(obj.dependencies) && obj.dependencies.every(d => typeof d === 'string')));
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

// Helper function to safely get context files
export function getContextFilesFromInteraction(interaction: AiInteraction): ContextFile[] {
  if (!interaction.contextFiles) {
    return [];
  }
  
  if (isContextFileArray(interaction.contextFiles)) {
    return interaction.contextFiles;
  }
  
  return [];
}

// Helper function to safely get context files from code generation
export function getContextFilesFromCodeGeneration(codeGen: CodeGeneration): ContextFile[] {
  if (!codeGen.contextFiles) {
    return [];
  }
  
  if (isContextFileArray(codeGen.contextFiles)) {
    return codeGen.contextFiles;
  }
  
  return [];
}

// Helper function to safely get metadata from question
export function getQuestionMetadataFromQuestion(question: Question): QuestionMetadata | null {
  if (!question.metadata) {
    return null;
  }
  
  if (isQuestionMetadata(question.metadata)) {
    return question.metadata;
  }
  
  return null;
}

// Helper function to safely get requirements from code generation
export function getRequirementsFromCodeGeneration(codeGen: CodeGeneration): CodeRequirements | null {
  if (!codeGen.requirements) {
    return null;
  }
  
  if (isCodeRequirements(codeGen.requirements)) {
    return codeGen.requirements;
  }
  
  return null;
}

// Helper function to safely get user display name
export function getUserDisplayName(user: User): string {
  return user.firstName || 'Anonymous User';
}

// Helper function to safely get user image
export function getUserImageUrl(user: User): string {
  return user.imageUrl || '';
}