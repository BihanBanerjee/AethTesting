#!/usr/bin/env node

/**
 * Comprehensive Test Suite for AI-based tRPC Routes
 * Tests all code generation, improvement, review, debug, refactor, and explain endpoints
 * Also verifies frontend-backend response parsing compatibility
 */

const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/trpc`;
const TEST_PROJECT_ID = 'test-project-123';

// Mock authentication headers (you'll need to replace with actual auth)
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer test-token', // Replace with actual auth
  'Cookie': 'your-auth-cookie=value' // Replace with actual cookie
};

// Test data structures
const TEST_DATA = {
  projectId: TEST_PROJECT_ID,
  sampleFiles: [
    'src/components/UserProfile.tsx',
    'src/hooks/useAuth.ts',
    'src/utils/api.ts'
  ],
  codeGenPrompt: 'Create a React component for user authentication',
  improvementSuggestions: 'Improve the error handling in this authentication component',
  reviewFocusAreas: 'Focus on security vulnerabilities and performance issues',
  errorDescription: 'Getting "Cannot read property \'user\' of undefined" when accessing user data',
  refactoringGoals: 'Refactor the authentication logic to use a custom hook pattern',
  explainQuery: 'Explain how the user authentication flow works in this codebase'
};

// Utility functions
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

function createTRPCPayload(procedure, input) {
  return {
    "0": {
      json: input,
      meta: {
        values: {
          projectId: ["undefined"]
        }
      }
    }
  };
}

async function makeTRPCRequest(procedure, input) {
  const url = `${API_ENDPOINT}/project.${procedure}`;
  const payload = createTRPCPayload(procedure, input);
  
  try {
    console.log(`🔄 Testing ${procedure}...`);
    console.log(`📤 Request URL: ${url}`);
    console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await axios.post(url, payload, {
      headers: AUTH_HEADERS,
      timeout: 60000, // 60 second timeout for AI operations
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });
    
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📥 Response Headers:`, response.headers);
    
    return {
      success: response.status === 200,
      status: response.status,
      data: response.data,
      error: response.data?.error || null
    };
  } catch (error) {
    console.error(`❌ Request failed:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      success: false,
      status: error.response?.status || 0,
      data: null,
      error: error.message
    };
  }
}

// Validation functions
function validateUnifiedResponse(response, expectedIntent) {
  const errors = [];
  
  if (!response) {
    errors.push('Response is null or undefined');
    return errors;
  }
  
  // Check for required UnifiedResponse fields
  if (!response.content && !response.generatedCode && !response.explanation) {
    errors.push('Missing primary content (content, generatedCode, or explanation)');
  }
  
  if (!response.contentType) {
    errors.push('Missing contentType field');
  }
  
  if (!response.intent) {
    errors.push('Missing intent field');
  } else if (expectedIntent && response.intent !== expectedIntent) {
    errors.push(`Intent mismatch: expected ${expectedIntent}, got ${response.intent}`);
  }
  
  if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
    errors.push('Invalid confidence value (should be number between 0-1)');
  }
  
  return errors;
}

function validateCodeGenerationResponse(response) {
  const errors = validateUnifiedResponse(response, 'code_generation');
  
  if (response) {
    if (!response.generatedCode && (!response.files || response.files.length === 0)) {
      errors.push('Code generation response missing generatedCode and files array');
    }
    
    if (response.files && Array.isArray(response.files)) {
      response.files.forEach((file, index) => {
        if (!file.path && !file.fileName) {
          errors.push(`File ${index} missing path/fileName`);
        }
        if (!file.content) {
          errors.push(`File ${index} missing content`);
        }
      });
    }
    
    if (!response.language) {
      errors.push('Missing language field for code generation');
    }
  }
  
  return errors;
}

function validateCodeReviewResponse(response) {
  const errors = [];
  
  if (!response) {
    errors.push('Response is null or undefined');
    return errors;
  }
  
  if (!Array.isArray(response.issues)) {
    errors.push('Missing or invalid issues array');
  }
  
  if (!Array.isArray(response.suggestions)) {
    errors.push('Missing or invalid suggestions array');
  }
  
  if (!response.summary) {
    errors.push('Missing summary field');
  }
  
  if (typeof response.score !== 'number') {
    errors.push('Missing or invalid score field');
  }
  
  return errors;
}

function validateDebugResponse(response) {
  const errors = [];
  
  if (!response) {
    errors.push('Response is null or undefined');
    return errors;
  }
  
  if (!response.diagnosis) {
    errors.push('Missing diagnosis field');
  }
  
  if (!Array.isArray(response.solutions)) {
    errors.push('Missing or invalid solutions array');
  }
  
  return errors;
}

// Test cases
const TEST_CASES = [
  {
    name: 'Code Generation',
    procedure: 'generateCode',
    input: {
      projectId: TEST_DATA.projectId,
      prompt: TEST_DATA.codeGenPrompt,
      requirements: {
        framework: 'react',
        language: 'typescript',
        features: ['state management', 'form validation'],
        constraints: ['no external dependencies']
      }
    },
    validator: validateCodeGenerationResponse,
    frontendCompatibility: true
  },
  
  {
    name: 'Code Improvement',
    procedure: 'improveCode',
    input: {
      projectId: TEST_DATA.projectId,
      suggestions: TEST_DATA.improvementSuggestions,
      targetFiles: TEST_DATA.sampleFiles.slice(0, 2),
      improvementType: 'security'
    },
    validator: (response) => validateUnifiedResponse(response, 'code_improvement'),
    frontendCompatibility: true
  },
  
  {
    name: 'Code Review',
    procedure: 'reviewCode',
    input: {
      projectId: TEST_DATA.projectId,
      files: TEST_DATA.sampleFiles,
      reviewType: 'comprehensive',
      focusAreas: TEST_DATA.reviewFocusAreas
    },
    validator: validateCodeReviewResponse,
    frontendCompatibility: false // Different response format
  },
  
  {
    name: 'Debug Code',
    procedure: 'debugCode',
    input: {
      projectId: TEST_DATA.projectId,
      errorDescription: TEST_DATA.errorDescription,
      suspectedFiles: TEST_DATA.sampleFiles.slice(0, 1),
      contextLevel: 'file'
    },
    validator: validateDebugResponse,
    frontendCompatibility: false // Different response format
  },
  
  {
    name: 'Refactor Code',
    procedure: 'refactorCode',
    input: {
      projectId: TEST_DATA.projectId,
      refactoringGoals: TEST_DATA.refactoringGoals,
      targetFiles: TEST_DATA.sampleFiles.slice(0, 2),
      preserveAPI: true
    },
    validator: (response) => {
      const errors = [];
      if (!response) {
        errors.push('Response is null or undefined');
        return errors;
      }
      
      if (!response.refactoredCode && !response.explanation) {
        errors.push('Missing refactoredCode and explanation');
      }
      
      return errors;
    },
    frontendCompatibility: false // Different response format
  },
  
  {
    name: 'Explain Code',
    procedure: 'explainCode',
    input: {
      projectId: TEST_DATA.projectId,
      query: TEST_DATA.explainQuery,
      targetFiles: TEST_DATA.sampleFiles,
      detailLevel: 'detailed'
    },
    validator: (response) => {
      const errors = [];
      if (!response) {
        errors.push('Response is null or undefined');
        return errors;
      }
      
      if (!response.explanation) {
        errors.push('Missing explanation field');
      }
      
      return errors;
    },
    frontendCompatibility: false // Different response format
  },
  
  {
    name: 'Ask Question with Intent',
    procedure: 'askQuestionWithIntent',
    input: {
      projectId: TEST_DATA.projectId,
      query: 'How does authentication work in this codebase?',
      contextFiles: TEST_DATA.sampleFiles,
      intent: 'question'
    },
    validator: (response) => {
      const errors = [];
      if (!response) {
        errors.push('Response is null or undefined');
        return errors;
      }
      
      if (!response.answer && !response.explanation) {
        errors.push('Missing answer or explanation');
      }
      
      if (!response.intent) {
        errors.push('Missing intent classification');
      }
      
      return errors;
    },
    frontendCompatibility: true
  },
  
  {
    name: 'Intent Classification Only',
    procedure: 'askQuestionWithIntent',
    input: {
      projectId: TEST_DATA.projectId,
      query: 'Generate a new user registration form',
      classifyOnly: true
    },
    validator: (response) => {
      const errors = [];
      if (!response) {
        errors.push('Response is null or undefined');
        return errors;
      }
      
      if (!response.intent) {
        errors.push('Missing intent classification');
      }
      
      if (response.answer) {
        errors.push('Should not have answer when classifyOnly=true');
      }
      
      return errors;
    },
    frontendCompatibility: true
  },
  
  {
    name: 'Dedicated Intent Classification',
    procedure: 'classifyIntent',
    input: {
      projectId: TEST_DATA.projectId,
      query: 'Fix the bug in the user authentication system',
      contextFiles: TEST_DATA.sampleFiles
    },
    validator: (response) => {
      const errors = [];
      if (!response || !response.intent) {
        errors.push('Missing intent classification');
      }
      
      return errors;
    },
    frontendCompatibility: true
  }
];

// Frontend compatibility tests
async function testFrontendCompatibility(testCase, response) {
  if (!testCase.frontendCompatibility) {
    console.log(`⏭️  Skipping frontend compatibility test for ${testCase.name} (not applicable)`);
    return { passed: true, errors: [] };
  }
  
  console.log(`🔧 Testing frontend compatibility for ${testCase.name}...`);
  
  const errors = [];
  
  try {
    // Simulate frontend response processing
    const { extractResponseContent, extractResponseMetadata } = require('./src/hooks/utils/response-processors.ts');
    const { ResponseTransformer } = require('./src/lib/code-generation/response-types.ts');
    
    // Test content extraction
    const content = extractResponseContent(response);
    if (!content || content === 'No response received') {
      errors.push('Frontend failed to extract content from response');
    }
    
    // Test metadata extraction (requires intent)
    const mockIntent = {
      type: testCase.name.toLowerCase().replace(' ', '_'),
      targetFiles: testCase.input.targetFiles || testCase.input.contextFiles || []
    };
    
    const metadata = extractResponseMetadata(response, mockIntent);
    if (!metadata) {
      errors.push('Frontend failed to extract metadata from response');
    }
    
    // Test UnifiedResponse transformation for legacy responses
    if (response && typeof response === 'object' && !('content' in response)) {
      const transformed = ResponseTransformer.transformLegacyResponse(response, mockIntent.type);
      if (!transformed.content && !transformed.generatedCode) {
        errors.push('Frontend failed to transform legacy response to UnifiedResponse');
      }
    }
    
  } catch (error) {
    errors.push(`Frontend processing error: ${error.message}`);
  }
  
  return { passed: errors.length === 0, errors };
}

// Error handling tests
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...\n');
  
  const errorTests = [
    {
      name: 'Invalid Project ID',
      procedure: 'generateCode',
      input: {
        projectId: 'invalid-project-id',
        prompt: 'Test prompt'
      }
    },
    {
      name: 'Empty Prompt',
      procedure: 'generateCode',
      input: {
        projectId: TEST_DATA.projectId,
        prompt: ''
      }
    },
    {
      name: 'Missing Required Fields',
      procedure: 'reviewCode',
      input: {
        projectId: TEST_DATA.projectId
        // Missing required 'files' and 'reviewType'
      }
    }
  ];
  
  for (const test of errorTests) {
    console.log(`\n--- Testing ${test.name} ---`);
    
    const result = await makeTRPCRequest(test.procedure, test.input);
    
    if (result.success) {
      console.log(`⚠️  Expected error but got success for ${test.name}`);
    } else {
      console.log(`✅ Correctly handled error for ${test.name}: ${result.error || 'Unknown error'}`);
    }
  }
}

// Performance tests
async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');
  
  const performanceTest = {
    name: 'Code Generation Performance',
    procedure: 'generateCode',
    input: {
      projectId: TEST_DATA.projectId,
      prompt: 'Create a simple React component',
      requirements: {
        framework: 'react',
        language: 'typescript'
      }
    }
  };
  
  const startTime = Date.now();
  const result = await makeTRPCRequest(performanceTest.procedure, performanceTest.input);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`⏱️  ${performanceTest.name} took ${duration}ms`);
  
  if (duration > 30000) { // 30 seconds
    console.log(`⚠️  Performance warning: ${performanceTest.name} took longer than expected`);
  } else {
    console.log(`✅ Performance within acceptable range`);
  }
  
  return { duration, withinRange: duration <= 30000 };
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting AI Routes Test Suite\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API Endpoint: ${API_ENDPOINT}`);
  console.log(`📍 Test Project ID: ${TEST_PROJECT_ID}\n`);
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
    frontendCompatibilityResults: []
  };
  
  // Run main test cases
  for (const testCase of TEST_CASES) {
    console.log(`\n--- Testing ${testCase.name} ---`);
    
    const result = await makeTRPCRequest(testCase.procedure, testCase.input);
    
    if (!result.success) {
      console.log(`❌ ${testCase.name} failed: ${result.error}`);
      results.failed++;
      results.errors.push({
        test: testCase.name,
        error: result.error,
        status: result.status
      });
      continue;
    }
    
    // Validate response structure
    const response = result.data?.[0]?.result?.data;
    const validationErrors = testCase.validator(response);
    
    if (validationErrors.length > 0) {
      console.log(`❌ ${testCase.name} validation failed:`);
      validationErrors.forEach(error => console.log(`   - ${error}`));
      results.failed++;
      results.errors.push({
        test: testCase.name,
        error: 'Validation failed',
        details: validationErrors
      });
    } else {
      console.log(`✅ ${testCase.name} passed validation`);
      results.passed++;
    }
    
    // Test frontend compatibility
    const compatibilityResult = await testFrontendCompatibility(testCase, response);
    results.frontendCompatibilityResults.push({
      test: testCase.name,
      ...compatibilityResult
    });
    
    if (compatibilityResult.passed) {
      console.log(`✅ ${testCase.name} frontend compatibility passed`);
    } else {
      console.log(`❌ ${testCase.name} frontend compatibility failed:`);
      compatibilityResult.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Log response sample for debugging
    console.log(`📄 Response Sample:`, JSON.stringify(response, null, 2).substring(0, 500) + '...');
  }
  
  // Run error handling tests
  await testErrorHandling();
  
  // Run performance tests
  const performanceResult = await testPerformance();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Performance: ${performanceResult.withinRange ? 'GOOD' : 'SLOW'} (${performanceResult.duration}ms)`);
  
  const frontendCompatibilityPassed = results.frontendCompatibilityResults.filter(r => r.passed).length;
  const frontendCompatibilityTotal = results.frontendCompatibilityResults.filter(r => r.test !== 'Skipped').length;
  console.log(`🔧 Frontend Compatibility: ${frontendCompatibilityPassed}/${frontendCompatibilityTotal}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
      if (error.details) {
        error.details.forEach(detail => console.log(`   - ${detail}`));
      }
    });
  }
  
  const allPassed = results.failed === 0 && 
                   frontendCompatibilityPassed === frontendCompatibilityTotal && 
                   performanceResult.withinRange;
  
  console.log(`\n🏁 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, TEST_CASES, validateUnifiedResponse };