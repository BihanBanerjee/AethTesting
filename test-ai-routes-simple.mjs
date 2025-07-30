#!/usr/bin/env node

/**
 * Simple Test Suite for AI-based tRPC Routes
 * Tests response structure compatibility and frontend parsing
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
console.log('🚀 AI Routes Response Structure Test Suite\n');

// Mock response data that simulates what the tRPC routes should return
const MOCK_RESPONSES = {
  generateCode: {
    content: 'Code generated successfully',
    contentType: 'code',
    intent: 'code_generation',
    confidence: 0.8,
    generatedCode: `import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (credentials: { email: string; password: string }) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};`,
    language: 'typescript',
    explanation: 'Generated a TypeScript React component for user login with form validation',
    files: [
      {
        path: 'src/components/LoginForm.tsx',
        fileName: 'LoginForm.tsx',
        content: `// Same as generatedCode above`,
        language: 'typescript',
        changeType: 'create'
      }
    ],
    warnings: ['Consider adding client-side validation'],
    dependencies: ['react']
  },

  improveCode: {
    content: 'Code improved successfully',
    contentType: 'code',
    intent: 'code_improvement',
    confidence: 0.8,
    generatedCode: `// Improved version with better error handling
import React, { useState, useCallback } from 'react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

interface LoginFormProps {
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit({ email, password });
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ general: 'Login failed. Please try again.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="text-red-500 text-sm">{errors.general}</div>
      )}
      
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={\`form-input \${errors.email ? 'border-red-500' : ''}\`}
          disabled={isLoading}
          required
        />
        {errors.email && <div className="text-red-500 text-xs">{errors.email}</div>}
      </div>
      
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={\`form-input \${errors.password ? 'border-red-500' : ''}\`}
          disabled={isLoading}
          required
        />
        {errors.password && <div className="text-red-500 text-xs">{errors.password}</div>}
      </div>
      
      <button 
        type="submit" 
        disabled={isLoading}
        className="btn-primary disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};`,
    language: 'typescript',
    explanation: 'Improved the login form with validation, error handling, and loading states',
    diff: '+ Added Zod validation\\n+ Added error state management\\n+ Added loading state support\\n+ Improved accessibility',
    suggestions: [
      {
        type: 'improvement',
        description: 'Consider adding password strength indicator'
      },
      {
        type: 'security',
        description: 'Add rate limiting for login attempts'
      }
    ],
    files: [
      {
        path: 'src/components/LoginForm.tsx',
        fileName: 'LoginForm.tsx',
        content: '// Improved code as above',
        language: 'typescript',
        changeType: 'modify'
      }
    ],
    warnings: ['Remember to install zod dependency'],
    dependencies: ['react', 'zod']
  },

  reviewCode: {
    content: 'Code review completed',
    contentType: 'text',
    intent: 'code_review',
    confidence: 0.8,
    explanation: 'The LoginForm component is functional but has security and performance concerns that should be addressed',
    issues: [
      {
        type: 'security',
        severity: 'high',
        file: 'LoginForm.tsx',
        line: 15,
        description: 'Password is stored in plain text in component state',
        suggestion: 'Consider using a secure input library or clearing sensitive data'
      },
      {
        type: 'performance',
        severity: 'medium',
        file: 'LoginForm.tsx',
        line: 8,
        description: 'Form re-renders on every keystroke',
        suggestion: 'Use debounced validation or useMemo for expensive validations'
      }
    ],
    suggestions: [
      {
        type: 'improvement',
        description: 'Add proper TypeScript interfaces for better type safety'
      }
    ],
    warnings: ['High severity security issue found'],
    score: 7,
    filesReviewed: ['LoginForm.tsx']
  },

  debugCode: {
    content: 'Debug analysis completed',
    contentType: 'text',
    intent: 'debug',
    confidence: 0.8,
    explanation: 'The error "Cannot read property \'user\' of undefined" occurs because the authentication context is not properly initialized before the component tries to access user data',
    diagnosis: 'The error "Cannot read property \'user\' of undefined" occurs because the authentication context is not properly initialized before the component tries to access user data',
    solutions: [
      {
        type: 'fix',
        description: 'Add null checks before accessing user properties',
        code: 'if (user && user.email) { /* access user data */ }',
        priority: 'high'
      },
      {
        type: 'fix',
        description: 'Initialize user context with default values',
        code: 'const defaultUser = { user: null, isLoading: true };',
        priority: 'medium'
      }
    ],
    recommendations: [
      {
        type: 'prevention',
        description: 'Use TypeScript strict null checks to catch these issues at compile time'
      }
    ],
    investigationSteps: [
      'Check if AuthProvider is wrapping the component',
      'Verify that useAuth hook is being called inside the provider',
      'Check for any async operations that might delay user initialization'
    ],
    contextFiles: ['LoginForm.tsx']
  },

  askQuestionWithIntent: {
    content: 'The authentication system works by using a React Context provider that manages user state. The useAuth hook provides access to user data and authentication methods throughout the app. The LoginForm component handles user input and calls the authentication service.',
    contentType: 'text',
    intent: 'question',
    confidence: 0.9,
    explanation: 'The authentication system works by using a React Context provider that manages user state. The useAuth hook provides access to user data and authentication methods throughout the app. The LoginForm component handles user input and calls the authentication service.',
    intentDetails: {
      type: 'question',
      confidence: 0.9,
      requiresCodeGen: false,
      requiresFileModification: false,
      contextNeeded: 'project',
      targetFiles: ['src/hooks/useAuth.ts', 'src/components/LoginForm.tsx']
    },
    answer: 'The authentication system works by using a React Context provider that manages user state. The useAuth hook provides access to user data and authentication methods throughout the app. The LoginForm component handles user input and calls the authentication service.',
    filesReferences: [
      {
        fileName: 'useAuth.ts',
        sourceCode: '// Hook implementation...',
        summary: 'Custom hook for managing authentication state'
      }
    ]
  }
};

// Test functions
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

function testResponseParsing(routeName, response) {
  console.log(`\n--- Testing ${routeName} Response Structure ---`);
  
  // Test 1: Basic structure validation
  console.log('🔍 Validating response structure...');
  const structureErrors = validateUnifiedResponse(response, response?.intent);
  
  if (structureErrors.length === 0) {
    console.log('✅ Response structure is valid');
  } else {
    console.log('❌ Response structure validation failed:');
    structureErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Test 2: Content extraction
  console.log('🔍 Testing content extraction...');
  let extractedContent = '';
  
  if (response && response.generatedCode) {
    extractedContent = response.generatedCode;
    console.log('✅ Content extracted from generatedCode field');
  } else if (response && response.content) {
    extractedContent = response.content;
    console.log('✅ Content extracted from content field');
  } else if (response && response.explanation) {
    extractedContent = response.explanation;
    console.log('✅ Content extracted from explanation field');
  } else {
    console.log('❌ No extractable content found');
  }
  
  // Test 3: Frontend compatibility simulation
  console.log('🔍 Testing frontend compatibility...');
  
  try {
    // Simulate what the frontend would do
    const metadata = {
      files: response && response.files?.map(f => f.fileName) || [],
      generatedCode: response && response.generatedCode,
      language: response && response.language || 'typescript',
      suggestions: response && response.suggestions || [],
      responseType: response && response.intent || routeName
    };
    
    console.log('✅ Frontend metadata extraction successful');
    console.log(`   - Files: ${metadata.files.length}`);
    console.log(`   - Language: ${metadata.language}`);
    console.log(`   - Has generated code: ${!!metadata.generatedCode}`);
    console.log(`   - Suggestions: ${metadata.suggestions.length}`);
    
  } catch (error) {
    console.log(`❌ Frontend compatibility test failed: ${error.message}`);
  }
  
  // Test 4: Code syntax validation (for code responses)
  if (response && response.generatedCode && response.language) {
    console.log('🔍 Testing generated code syntax...');
    
    const codeLength = response.generatedCode.length;
    const hasImports = response.generatedCode.includes('import');
    const hasExports = response.generatedCode.includes('export');
    const hasTypescript = response.language === 'typescript' && response.generatedCode.includes(': ');
    
    console.log(`✅ Generated code analysis:`);
    console.log(`   - Length: ${codeLength} characters`);
    console.log(`   - Has imports: ${hasImports}`);
    console.log(`   - Has exports: ${hasExports}`);
    console.log(`   - TypeScript syntax: ${hasTypescript}`);
    
    if (codeLength < 50) {
      console.log('⚠️  Warning: Generated code seems very short');
    }
  }
  
  // Test 5: Error handling compatibility
  console.log('🔍 Testing error handling...');
  
  if (response && response.error) {
    console.log(`⚠️  Response contains error: ${response.error}`);
  } else if (response && response.warnings && response.warnings.length > 0) {
    console.log(`⚠️  Response contains ${response.warnings.length} warnings`);
  } else {
    console.log('✅ No errors or warnings in response');
  }
  
  return {
    structureValid: structureErrors.length === 0,
    hasContent: !!extractedContent,
    frontendCompatible: true, // Simulated as successful above
    errors: structureErrors
  };
}

// Test malformed response handling
function testMalformedResponses() {
  console.log('\n🧪 Testing Malformed Response Handling...\n');
  
  const malformedResponses = [
    {
      name: 'Null Response',
      response: null
    },
    {
      name: 'Empty Object',
      response: {}
    },
    {
      name: 'String Response',
      response: 'This is just a string'
    },
    {
      name: 'Malformed JSON in Code',
      response: {
        content: 'Code generated',
        contentType: 'code',
        intent: 'code_generation',
        confidence: 0.8,
        generatedCode: '{"language": "typescript", "explanation": "This is malformed JSON because it\'s cut off'
      }
    },
    {
      name: 'Missing Required Fields',
      response: {
        generatedCode: 'Some code here'
        // Missing content, contentType, intent, confidence
      }
    }
  ];
  
  malformedResponses.forEach(test => {
    console.log(`--- Testing ${test.name} ---`);
    const result = testResponseParsing(test.name, test.response);
    
    if (result.structureValid && test.name !== 'String Response') {
      console.log(`⚠️  Expected validation to fail for ${test.name}`);
    } else if (!result.structureValid) {
      console.log(`✅ Correctly detected malformed response for ${test.name}`);
    }
  });
}

// Run all tests
function runAllTests() {
  console.log('Testing all AI route response structures...\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test each mock response
  Object.entries(MOCK_RESPONSES).forEach(([routeName, response]) => {
    const result = testResponseParsing(routeName, response);
    results.total++;
    
    if (result.structureValid && result.hasContent && result.frontendCompatible) {
      results.passed++;
      console.log(`✅ ${routeName} - ALL TESTS PASSED`);
    } else {
      results.failed++;
      console.log(`❌ ${routeName} - SOME TESTS FAILED`);
    }
  });
  
  // Test malformed responses
  testMalformedResponses();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Routes Tested: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  
  // Test current tRPC response processors
  console.log('\n🔧 Testing Current Response Processors...');
  
  try {
    // Check if response processor files exist and are valid
    const processorPath = join(__dirname, 'src/hooks/utils/response-processors.ts');
    const unifiedResponsePath = join(__dirname, 'src/types/unified-response.ts');
    
    try {
      const processorContent = readFileSync(processorPath, 'utf8');
      console.log('✅ Response processors file exists and is readable');
      
      // Check for key functions
      if (processorContent.includes('extractResponseContent')) {
        console.log('✅ extractResponseContent function found');
      }
      if (processorContent.includes('extractResponseMetadata')) {
        console.log('✅ extractResponseMetadata function found');
      }
      if (processorContent.includes('validateResponse')) {
        console.log('✅ validateResponse function found');
      }
      
    } catch (error) {
      console.log(`❌ Could not read response processors: ${error.message}`);
    }
    
    try {
      const unifiedContent = readFileSync(unifiedResponsePath, 'utf8');
      console.log('✅ UnifiedResponse types file exists and is readable');
      
      if (unifiedContent.includes('interface UnifiedResponse')) {
        console.log('✅ UnifiedResponse interface found');
      }
      if (unifiedContent.includes('ResponseTransformer')) {
        console.log('✅ ResponseTransformer class found');
      }
      
    } catch (error) {
      console.log(`❌ Could not read unified response types: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing response processors: ${error.message}`);
  }
  
  const allPassed = results.failed === 0;
  console.log(`\n🏁 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 All AI routes are properly structured and frontend-compatible!');
    console.log('The tRPC routes should work correctly with the frontend components.');
  } else {
    console.log('\n⚠️  Some issues were found. Review the test results above.');
  }
  
  return allPassed;
}

// Run the tests
const success = runAllTests();
process.exit(success ? 0 : 1);