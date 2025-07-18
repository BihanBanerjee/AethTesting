// src/app/(protected)/dashboard/actions/analysis/architecture-analyzer.ts
import type { DatabaseFile, ArchitecturePatterns } from '../types/action-types';

export function analyzeArchitecture(files: DatabaseFile[]): string {
  const patterns: ArchitecturePatterns = {
    'clean-architecture': 0,
    'mvc': 0,
    'layered': 0,
    'microservices': 0,
    'component-based': 0,
    'jamstack': 0
  };

  files.forEach(file => {
    const path = file.fileName.toLowerCase();
    
    analyzeCleanArchitecture(path, patterns);
    analyzeMVC(path, patterns);
    analyzeLayered(path, patterns);
    analyzeMicroservices(path, patterns);
    analyzeComponentBased(path, patterns);
    analyzeJAMStack(path, patterns);
  });

  const dominantPattern = Object.entries(patterns).reduce((a, b) => 
    patterns[a[0] as keyof ArchitecturePatterns] > patterns[b[0] as keyof ArchitecturePatterns] ? a : b
  );

  return dominantPattern[0];
}

function analyzeCleanArchitecture(path: string, patterns: ArchitecturePatterns) {
  if (path.includes('usecase') || path.includes('entity') || path.includes('adapter')) {
    patterns['clean-architecture']++;
  }
}

function analyzeMVC(path: string, patterns: ArchitecturePatterns) {
  if (path.includes('controller') || path.includes('model') || path.includes('view')) {
    patterns.mvc++;
  }
}

function analyzeLayered(path: string, patterns: ArchitecturePatterns) {
  if (path.includes('service') || path.includes('repository') || path.includes('domain')) {
    patterns.layered++;
  }
}

function analyzeMicroservices(path: string, patterns: ArchitecturePatterns) {
  if (path.includes('api/') && (path.includes('route') || path.includes('handler'))) {
    patterns.microservices++;
  }
}

function analyzeComponentBased(path: string, patterns: ArchitecturePatterns) {
  if (path.includes('component') || path.includes('hook') || path.includes('provider')) {
    patterns['component-based']++;
  }
}

function analyzeJAMStack(path: string, patterns: ArchitecturePatterns) {
  if (path.includes('static') || path.includes('public') || path.includes('_app') || path.includes('pages/')) {
    patterns.jamstack++;
  }
}