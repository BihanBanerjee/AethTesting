// Backend calculation and data transformation utilities
import { getIntentConfig } from './config';

// Question impact calculation
export function calculateQuestionImpact(
  question: { intent?: string; satisfaction?: number }, 
  _interactions: unknown[], 
  codeGenerations: Array<{ applied?: boolean; linesOfCode?: number }>
): number {
    let impact = 0;
    
    // Base impact from question type using shared config
    const config = getIntentConfig(question.intent);
    impact += config.impactScore;
    
    // Boost for high satisfaction
    if (question.satisfaction && question.satisfaction >= 4) {
        impact += question.satisfaction;
    }
    
    // Boost for applied code
    if (codeGenerations.some(gen => gen.applied)) {
        impact += 15;
    }
    
    // Boost for code generation with many lines
    const totalLinesGenerated = codeGenerations.reduce((sum, gen) => sum + (gen.linesOfCode || 0), 0);
    impact += Math.min(totalLinesGenerated / 10, 20); // Max 20 points for lines
    
    return Math.round(impact);
}

// Data transformation utilities
export function getConfidenceLevel(confidence: number | null): string | null {
    if (!confidence) return null;
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Medium';
    if (confidence >= 0.6) return 'Low';
    return 'Very Low';
}

export function getSatisfactionLevel(satisfaction: number | null): string | null {
    if (!satisfaction) return null;
    if (satisfaction >= 4.5) return 'Excellent';
    if (satisfaction >= 4) return 'Good';
    if (satisfaction >= 3) return 'Fair';
    if (satisfaction >= 2) return 'Poor';
    return 'Very Poor';
}

export function formatProcessingTime(timeMs: number): string {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}m`;
}