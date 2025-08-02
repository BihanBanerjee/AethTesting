// src/lib/code-generation/index.ts
export { CodeGenerationEngine } from "./engine";
export { UnifiedResponseAdapter } from "./unified-response-adapter";
export type { 
  CodeGenerationRequest, 
  CodeGenerationResult, 
  GeneratedFile, 
  ProjectContext 
} from "./types";
export type {
  UnifiedResponse,
  FileReference,
  Suggestion
} from "./response-types";
export { ResponseTransformer } from "./response-types";