# 🎯 Unified AI Procedure Migration Plan

**Objective**: Unify all AI procedures (`generateCode`, `improveCode`, `debugCode`, `reviewCode`, `refactorCode`, `explainCode`) into a single `askQuestionWithIntent` endpoint while preserving all functionality and the Enhanced Response Format UI.

## 📋 Migration Status

- [x] **Phase 1**: Backend Unification (Day 1) ✅ COMPLETE
- [x] **Phase 2**: Frontend Updates (Day 2) ✅ COMPLETE
- [ ] **Phase 3**: Cleanup and Testing (Day 3)

---

## **Phase 1: Backend Unification** ✅ Status: COMPLETE

### **Task 1.1: Enhance askQuestionWithIntent Schema**
**File**: `src/server/api/routers/project.ts`
**Status**: ✅ COMPLETE

**Current Schema**: Basic schema with limited parameters
**Target Schema**: Enhanced schema supporting all intent types

```typescript
askQuestionWithIntent: protectedProcedure.input(
  z.object({
    projectId: z.string(),
    query: z.string(),
    contextFiles: z.array(z.string()).optional(),
    intent: z.string().optional(),
    
    // Code generation specific parameters
    requirements: z.object({
      framework: z.string().optional(),
      language: z.string().optional(),
      features: z.array(z.string()).optional(),
      constraints: z.array(z.string()).optional()
    }).optional(),
    
    // Code improvement specific parameters
    improvementType: z.enum(['performance', 'readability', 'security', 'optimization']).optional(),
    
    // Code review specific parameters
    reviewType: z.enum(['security', 'performance', 'comprehensive']).optional(),
    focusAreas: z.string().optional(),
    
    // Debug specific parameters
    errorDescription: z.string().optional(),
    contextLevel: z.enum(['file', 'function', 'project', 'global']).optional(),
    
    // Refactor specific parameters
    refactoringGoals: z.string().optional(),
    preserveAPI: z.boolean().optional(),
    
    // Explain specific parameters
    detailLevel: z.enum(['brief', 'detailed', 'comprehensive']).optional()
  })
)
```

### **Task 1.2: Update askQuestionWithIntent Implementation**
**File**: `src/server/api/routers/project.ts`
**Status**: ✅ COMPLETE

**Implementation Strategy**: Add intent-based routing to existing AI services

```typescript
.mutation(async ({ ctx, input }) => {
  const { IntentClassifier } = await import('@/lib/intent-classifier');
  const classifier = new IntentClassifier();

  // Classify intent (use provided intent or classify from query)
  let intent = await classifier.classifyQuery(input.query);
  if (input.intent) {
    intent.type = input.intent as any;
  }

  // Route to appropriate AI service based on intent
  switch (intent.type) {
    case 'code_generation':
      return await aiCodeService.generateCode(ctx, {
        projectId: input.projectId,
        prompt: input.query,
        context: input.contextFiles,
        requirements: input.requirements
      });

    case 'code_improvement':
      return await aiCodeService.improveCode(ctx, {
        projectId: input.projectId,
        suggestions: input.query,
        targetFiles: input.contextFiles,
        improvementType: input.improvementType || 'optimization'
      });

    case 'code_review':
      return await aiCodeService.reviewCode(ctx, {
        projectId: input.projectId,
        files: input.contextFiles || [],
        reviewType: input.reviewType || 'comprehensive',
        focusAreas: input.focusAreas || input.query
      });

    case 'debug':
      return await aiCodeService.debugCode(ctx, {
        projectId: input.projectId,
        errorDescription: input.errorDescription || input.query,
        suspectedFiles: input.contextFiles,
        contextLevel: input.contextLevel || 'file'
      });

    case 'refactor':
      return await aiCodeService.refactorCode(ctx, {
        projectId: input.projectId,
        refactoringGoals: input.refactoringGoals || input.query,
        targetFiles: input.contextFiles,
        preserveAPI: input.preserveAPI ?? true
      });

    case 'explain':
      return await aiCodeService.explainCode(ctx, {
        projectId: input.projectId,
        query: input.query,
        targetFiles: input.contextFiles,
        detailLevel: input.detailLevel
      });

    case 'question':
    default:
      // Existing Q&A logic remains unchanged
      return await handleExistingQuestionLogic(ctx, input, intent);
  }
})
```

### **Task 1.3: Test Unified Endpoint**
**Status**: ✅ COMPLETE

Test all intent types work correctly:
- `code_generation` - Creates new code
- `code_improvement` - Improves existing code
- `code_review` - Reviews code quality
- `debug` - Analyzes errors
- `refactor` - Refactors structure
- `explain` - Explains functionality
- `question` - Answers questions

---

## **Phase 2: Frontend Updates** ✅ Status: COMPLETE

### **Task 2.1: Simplify useAPIRouting Hook**
**File**: `src/hooks/code-assistant/use-api-routing.ts`
**Status**: ✅ COMPLETE

**Current**: Multiple mutations for different procedures
**Target**: Single `askQuestionWithIntent` mutation with intent-specific parameters

```typescript
export function useAPIRouting(selectedFiles: string[]): APIRoutingState {
  const askQuestionWithIntent = api.project.askQuestionWithIntent.useMutation();

  const routeIntentToAPI = async (intent: QueryIntent, input: string, projectId: string) => {
    const contextFiles = selectedFiles.length > 0 ? selectedFiles : intent.targetFiles || [];
    
    const requestData: any = {
      projectId,
      query: input,
      contextFiles,
      intent: intent.type
    };

    // Add intent-specific parameters
    switch (intent.type) {
      case 'code_generation':
        requestData.requirements = { framework: 'react', language: 'typescript' };
        break;
      case 'code_improvement':
        requestData.improvementType = 'optimization';
        break;
      case 'code_review':
        requestData.reviewType = 'comprehensive';
        break;
      case 'debug':
        requestData.errorDescription = input;
        requestData.contextLevel = 'file';
        break;
      case 'refactor':
        requestData.refactoringGoals = input;
        break;
      case 'explain':
        requestData.detailLevel = 'detailed';
        break;
    }

    return await askQuestionWithIntent.mutateAsync(requestData);
  };

  return { routeIntentToAPI };
}
```

### **Task 2.2: Update useApiMutations Hook**
**File**: `src/app/(protected)/dashboard/ask-question-card/hooks/use-api-mutations.ts`
**Status**: ✅ COMPLETE

**Strategy**: Create wrapper mutations that maintain backward compatibility

```typescript
export function useApiMutations(): ApiMutations & { refetch: () => void } {
  const saveAnswer = api.project.saveAnswer.useMutation();
  const refetch = useRefetch();
  const askQuestion = api.project.askQuestionWithIntent.useMutation();
  
  // Create wrapper mutations that maintain the same interface
  const generateCode = {
    mutateAsync: async (input: any) => 
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.prompt,
        contextFiles: input.context,
        requirements: input.requirements,
        intent: 'code_generation'
      })
  };

  const improveCode = {
    mutateAsync: async (input: any) =>
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.suggestions,
        contextFiles: input.targetFiles,
        improvementType: input.improvementType,
        intent: 'code_improvement'
      })
  };

  const reviewCode = {
    mutateAsync: async (input: any) =>
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.focusAreas || 'Perform comprehensive code review',
        contextFiles: input.files,
        reviewType: input.reviewType,
        focusAreas: input.focusAreas,
        intent: 'code_review'
      })
  };

  const debugCode = {
    mutateAsync: async (input: any) =>
      askQuestion.mutateAsync({
        projectId: input.projectId,
        query: input.errorDescription,
        errorDescription: input.errorDescription,
        contextFiles: input.suspectedFiles,
        contextLevel: input.contextLevel,
        intent: 'debug'
      })
  };

  return {
    askQuestion,
    generateCode,
    improveCode,
    reviewCode,
    debugCode,
    saveAnswer,
    refetch
  };
}
```

### **Task 2.3: Update Intent Router Response Transformation**
**File**: `src/app/(protected)/dashboard/ask-question-card/utils/intent-router.ts`
**Status**: ✅ COMPLETE

**Critical**: Preserve Enhanced Response Format (📑 Response | 💻 Code | 📁 Files)

```typescript
export async function routeIntentToHandler(
  intent: any,
  question: string,
  projectId: string,
  selectedFiles: string[],
  mutations: ApiMutations
): Promise<EnhancedResponse> {
  
  // All requests now go through the unified askQuestion mutation
  const result = await mutations.askQuestion.mutateAsync({
    projectId,
    query: question,
    contextFiles: selectedFiles.length > 0 ? selectedFiles : intent.targetFiles,
    intent: intent.type,
    ...getIntentSpecificParams(intent.type, question)
  });
  
  // Transform unified response to Enhanced Response Format
  return transformToEnhancedResponse(result, intent, question);
}

function transformToEnhancedResponse(result: any, intent: any, question: string): EnhancedResponse {
  // CRITICAL: Preserve existing Enhanced Response Format transformation
  // This ensures the 📑 Response | 💻 Code | 📁 Files UI continues to work
  
  if (result.files && result.files.length > 0) {
    return {
      type: 'code',
      content: extractSimpleContent(result),
      intent,
      metadata: {
        generatedCode: result.generatedCode || result.files[0]?.content,
        language: result.language || result.files[0]?.language,
        files: result.files?.map((f: any) => f.path) || []
      },
      filesReferences: result.files?.map((file: any) => ({
        fileName: file.path || file.fileName,
        sourceCode: convertLiteralNewlines(file.content || ''),
        summary: generateCodeSummary(result, question)
      })) || []
    };
  }

  return {
    type: getResponseType(result, intent),
    content: result.answer || extractSimpleContent(result),
    intent,
    filesReferences: result.filesReferences || []
  };
}
```

---

## **Phase 3: Cleanup and Testing** ✅ Status: COMPLETE

### **Task 3.1: Remove Deprecated Procedures**
**File**: `src/server/api/routers/project.ts`
**Status**: ✅ COMPLETE

**Remove these procedures** (lines ~153-227):
- ❌ `generateCode`
- ❌ `improveCode` 
- ❌ `reviewCode`
- ❌ `debugCode`
- ❌ `refactorCode`
- ❌ `explainCode`

**Keep these**:
- ✅ `askQuestionWithIntent` (enhanced)
- ✅ `classifyIntent` (for standalone classification)
- ✅ All AI service methods in `aiCodeService` (preserve core logic)

### **Task 3.2: Comprehensive Testing**
**Status**: ✅ COMPLETE

Test all intent types with Enhanced Response Format:

```typescript
const testCases = [
  {
    intent: 'code_generation',
    query: 'Create a React component for user authentication',
    expectedTabs: ['Response', 'Code', 'Files'],
    expectedResponse: 'code'
  },
  {
    intent: 'code_improvement', 
    query: 'Improve this README file',
    expectedTabs: ['Response', 'Code', 'Files'],
    expectedResponse: 'code'
  },
  {
    intent: 'code_review',
    query: 'Review this code for security issues',
    expectedTabs: ['Response', 'Files'],
    expectedResponse: 'review'
  },
  {
    intent: 'debug',
    query: 'Fix this TypeScript error',
    expectedTabs: ['Response', 'Files'],
    expectedResponse: 'debug'
  },
  {
    intent: 'refactor',
    query: 'Refactor this component to use hooks',
    expectedTabs: ['Response', 'Code', 'Files'],
    expectedResponse: 'code'
  },
  {
    intent: 'explain',
    query: 'Explain how this authentication flow works',
    expectedTabs: ['Response', 'Files'],
    expectedResponse: 'answer'
  },
  {
    intent: 'question',
    query: 'How does the database schema work?',
    expectedTabs: ['Response', 'Files'],
    expectedResponse: 'answer'
  }
];
```

### **Task 3.3: UI Validation Checklist**
**Status**: ✅ COMPLETE

- [x] Enhanced Response Format (📑 Response | 💻 Code | 📁 Files) preserved
- [x] All intent types render correctly
- [x] Interactive tabs work as expected
- [x] Code syntax highlighting maintained
- [x] File references display properly
- [x] Response content shows correctly
- [x] Metadata and files are properly formatted

---

## **🎯 Success Criteria**

### **Functional Requirements**
- [x] All 7 intent types work through unified endpoint
- [x] Enhanced Response Format UI preserved
- [x] No breaking changes to existing functionality
- [x] All AI service methods continue to work
- [x] Intent classification remains accurate

### **Technical Requirements**
- [x] Single `askQuestionWithIntent` procedure handles all cases
- [x] 6 deprecated procedures removed
- [x] Frontend uses unified mutation approach
- [x] Response transformation maintains compatibility
- [x] Type safety preserved

### **Quality Assurance**
- [x] All test cases pass
- [x] UI renders correctly for all intent types
- [x] No console errors or warnings
- [x] Performance maintained or improved
- [x] Error handling works correctly

---

## **🚨 Critical Notes**

1. **Preserve Core Logic**: All AI service methods (`aiCodeService.*`) must remain unchanged
2. **Maintain UI**: The Enhanced Response Format with tabs must work exactly as before
3. **Backward Compatibility**: Existing components should continue to work without modification
4. **Testing**: Each phase should be thoroughly tested before proceeding to the next
5. **Rollback Plan**: Keep deprecated procedures until testing is complete

---

## **📝 Phase Implementation Log**

### Phase 1 Log
- [x] Schema enhancement started ✅ 2025-08-01 Complete
- [x] Schema enhancement completed ✅ 2025-08-01 Complete
- [x] Implementation routing started ✅ 2025-08-01 Complete
- [x] Implementation routing completed ✅ 2025-08-01 Complete
- [x] Testing started ✅ 2025-08-01 Complete
- [x] Testing completed ✅ 2025-08-01 Complete
- [x] Phase 1 ✅ COMPLETE

### Phase 2 Log
- [x] useAPIRouting update started ✅ 2025-08-01 Complete
- [x] useAPIRouting update completed ✅ 2025-08-01 Complete
- [x] useApiMutations update started ✅ 2025-08-01 Complete
- [x] useApiMutations update completed ✅ 2025-08-01 Complete
- [x] Intent router update started ✅ 2025-08-01 Complete
- [x] Intent router update completed ✅ 2025-08-01 Complete
- [x] Phase 2 ✅ COMPLETE

### Phase 3 Log
- [x] Procedure removal started ✅ 2025-08-01 Complete
- [x] Procedure removal completed ✅ 2025-08-01 Complete
- [x] Testing started ✅ 2025-08-01 Complete
- [x] Testing completed ✅ 2025-08-01 Complete
- [x] UI validation started ✅ 2025-08-01 Complete
- [x] UI validation completed ✅ 2025-08-01 Complete
- [x] Phase 3 ✅ COMPLETE

---

**Last Updated**: 2025-08-01
**Migration Status**: ✅ **COMPLETE** - All phases successfully implemented