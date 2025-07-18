// src/app/(protected)/dashboard/actions/analysis/tech-stack-analyzer.ts
import type { DatabaseFile, TechStackAnalysis } from '../types/action-types';

export function analyzeTechStack(files: DatabaseFile[]): string[] {
  const analysis: TechStackAnalysis = {
    frameworks: new Set(),
    languages: new Set(),
    databases: new Set(),
    styling: new Set(),
    stateManagement: new Set(),
    testing: new Set(),
    buildTools: new Set(),
    authentication: new Set(),
    api: new Set(),
  };
  
  files.forEach(file => {
    const fileName = file.fileName.toLowerCase();
    const content = (typeof file.sourceCode === 'string' ? file.sourceCode : JSON.stringify(file.sourceCode)).toLowerCase();
    
    analyzeFrameworks(fileName, content, analysis.frameworks);
    analyzeLanguages(fileName, content, analysis.languages);
    analyzeDatabases(content, analysis.databases);
    analyzeStyling(content, analysis.styling);
    analyzeStateManagement(content, analysis.stateManagement);
    analyzeTesting(content, analysis.testing);
    analyzeBuildTools(content, analysis.buildTools);
    analyzeAuthentication(content, analysis.authentication);
    analyzeAPI(content, analysis.api);
  });
  
  return [
    ...analysis.frameworks,
    ...analysis.languages,
    ...analysis.databases,
    ...analysis.styling,
    ...analysis.stateManagement,
    ...analysis.testing,
    ...analysis.buildTools,
    ...analysis.authentication,
    ...analysis.api,
  ];
}

function analyzeFrameworks(fileName: string, content: string, frameworks: Set<string>) {
  if (fileName.includes('next') || content.includes('next/')) frameworks.add('Next.js');
  if (content.includes('react')) frameworks.add('React');
  if (content.includes('vue')) frameworks.add('Vue.js');
  if (content.includes('angular')) frameworks.add('Angular');
  if (content.includes('svelte')) frameworks.add('Svelte');
}

function analyzeLanguages(fileName: string, content: string, languages: Set<string>) {
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) languages.add('TypeScript');
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) languages.add('JavaScript');
  if (fileName.endsWith('.py')) languages.add('Python');
  if (fileName.endsWith('.rs')) languages.add('Rust');
  if (fileName.endsWith('.go')) languages.add('Go');
}

function analyzeDatabases(content: string, databases: Set<string>) {
  if (content.includes('prisma')) databases.add('Prisma');
  if (content.includes('mongoose')) databases.add('MongoDB');
  if (content.includes('postgres') || content.includes('postgresql')) databases.add('PostgreSQL');
  if (content.includes('mysql')) databases.add('MySQL');
}

function analyzeStyling(content: string, styling: Set<string>) {
  if (content.includes('tailwind')) styling.add('Tailwind CSS');
  if (content.includes('styled-components')) styling.add('Styled Components');
  if (content.includes('emotion')) styling.add('Emotion');
}

function analyzeStateManagement(content: string, stateManagement: Set<string>) {
  if (content.includes('redux')) stateManagement.add('Redux');
  if (content.includes('zustand')) stateManagement.add('Zustand');
  if (content.includes('recoil')) stateManagement.add('Recoil');
  if (content.includes('jotai')) stateManagement.add('Jotai');
}

function analyzeTesting(content: string, testing: Set<string>) {
  if (content.includes('jest')) testing.add('Jest');
  if (content.includes('vitest')) testing.add('Vitest');
  if (content.includes('cypress')) testing.add('Cypress');
  if (content.includes('playwright')) testing.add('Playwright');
}

function analyzeBuildTools(content: string, buildTools: Set<string>) {
  if (content.includes('webpack')) buildTools.add('Webpack');
  if (content.includes('vite')) buildTools.add('Vite');
  if (content.includes('rollup')) buildTools.add('Rollup');
}

function analyzeAuthentication(content: string, authentication: Set<string>) {
  if (content.includes('clerk')) authentication.add('Clerk');
  if (content.includes('auth0')) authentication.add('Auth0');
  if (content.includes('supabase')) authentication.add('Supabase');
}

function analyzeAPI(content: string, api: Set<string>) {
  if (content.includes('trpc')) api.add('tRPC');
  if (content.includes('graphql')) api.add('GraphQL');
  if (content.includes('apollo')) api.add('Apollo');
}