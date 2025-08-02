// src/lib/code-generation/message-classifier.ts

export type MessageCategory = 'technical' | 'user-issue' | 'educational';
export type SuggestionCategory = 'actionable' | 'informational' | 'duplicate';

export interface CategorizedContent {
  warnings: string[];        // Actual code problems
  suggestions: string[];     // Actionable improvements  
  insights: string[];        // Educational content
  debugInfo: string[];       // Technical (dev-only)
}

/**
 * Classifies and filters messages for appropriate user display
 * Separates technical debug info from user-facing content
 */
export class MessageClassifier {
  
  // Technical patterns that should be hidden from users
  private static readonly TECHNICAL_PATTERNS = [
    'content extracted via streaming parser',
    'json parsing issues',
    'response parsing failed',
    'response format was not recognized',
    'streaming extraction',
    'fallback response',
    'parser due to',
    'extracted from malformed response',
    'generated code (extracted from malformed response)',
    'unable to extract code content',
    'please try again'
  ];

  // Educational content patterns
  private static readonly EDUCATIONAL_PATTERNS = [
    'key point:',
    'this component',
    'this function',
    'this code',
    'explanation:',
    'design pattern',
    'architecture',
    'follows'
  ];

  // Code issue patterns
  private static readonly ISSUE_PATTERNS = [
    'security:',
    'vulnerability',
    'high:',
    'medium:',
    'low:',
    'error:',
    'warning:',
    'issue:',
    'problem:',
    'bug:',
    'performance:',
    'memory leak',
    'sql injection',
    'xss',
    'csrf'
  ];

  // Recommendation patterns
  private static readonly RECOMMENDATION_PATTERNS = [
    'recommendation:',
    'suggest',
    'consider',
    'should',
    'could improve',
    'might want to',
    'try using',
    'best practice',
    'optimization:',
    'improvement:'
  ];

  /**
   * Classifies a warning message
   */
  static classifyWarning(message: string): MessageCategory {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if technical
    if (this.TECHNICAL_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return 'technical';
    }
    
    // Check if code issue
    if (this.ISSUE_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return 'user-issue';
    }
    
    // Check if educational
    if (this.EDUCATIONAL_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return 'educational';
    }
    
    // Default to user-issue for warnings
    return 'user-issue';
  }

  /**
   * Classifies a suggestion message
   */
  static classifySuggestion(message: string): SuggestionCategory {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if technical (should be filtered)
    if (this.TECHNICAL_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return 'duplicate'; // Will be filtered out
    }
    
    // Check if actionable recommendation
    if (this.RECOMMENDATION_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return 'actionable';
    }
    
    // Check if educational
    if (this.EDUCATIONAL_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return 'informational';
    }
    
    return 'actionable'; // Default for suggestions
  }

  /**
   * Determines if a message should be shown to users
   */
  static isUserFacing(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim();
    
    // Filter out technical messages
    if (this.TECHNICAL_PATTERNS.some(pattern => lowerMessage.includes(pattern))) {
      return false;
    }
    
    // Filter out empty or meaningless messages
    if (!message.trim() || message.length < 3) {
      return false;
    }
    
    return true;
  }

  /**
   * Categorizes all messages into appropriate sections
   */
  static categorizeMessages(warnings: string[], suggestions?: Array<{description: string}>): CategorizedContent {
    const result: CategorizedContent = {
      warnings: [],
      suggestions: [],
      insights: [],
      debugInfo: []
    };

    // Process warnings
    warnings.forEach(warning => {
      if (!this.isUserFacing(warning)) {
        result.debugInfo.push(warning);
        return;
      }

      const category = this.classifyWarning(warning);
      switch (category) {
        case 'technical':
          result.debugInfo.push(warning);
          break;
        case 'user-issue':
          result.warnings.push(warning);
          break;
        case 'educational':
          result.insights.push(warning);
          break;
      }
    });

    // Process suggestions
    if (suggestions) {
      suggestions.forEach(suggestion => {
        const message = suggestion.description;
        
        if (!this.isUserFacing(message)) {
          result.debugInfo.push(message);
          return;
        }

        const category = this.classifySuggestion(message);
        switch (category) {
          case 'actionable':
            result.suggestions.push(message);
            break;
          case 'informational':
            result.insights.push(message);
            break;
          case 'duplicate':
            // Skip duplicates
            break;
        }
      });
    }

    return result;
  }

  /**
   * Filters warnings for user display
   */
  static filterUserFacingWarnings(warnings: string[]): string[] {
    return warnings
      .filter(warning => this.isUserFacing(warning))
      .filter(warning => this.classifyWarning(warning) === 'user-issue')
      .map(warning => this.formatUserMessage(warning));
  }

  /**
   * Filters suggestions for user display
   */
  static filterUserFacingSuggestions(suggestions: string[] | Array<{description: string}>): string[] {
    const messageArray = Array.isArray(suggestions) && suggestions.length > 0 && typeof suggestions[0] === 'object'
      ? (suggestions as Array<{description: string}>).map(s => s.description)
      : suggestions as string[];

    return messageArray
      .filter(suggestion => this.isUserFacing(suggestion))
      .filter(suggestion => this.classifySuggestion(suggestion) === 'actionable')
      .map(suggestion => this.formatUserMessage(suggestion));
  }

  /**
   * Extracts educational insights
   */
  static extractInsights(warnings: string[], suggestions?: Array<{description: string}>): string[] {
    const insights: string[] = [];

    // From warnings
    warnings
      .filter(warning => this.isUserFacing(warning))
      .filter(warning => this.classifyWarning(warning) === 'educational')
      .forEach(warning => insights.push(this.formatUserMessage(warning)));

    // From suggestions
    if (suggestions) {
      suggestions
        .map(s => s.description)
        .filter(suggestion => this.isUserFacing(suggestion))
        .filter(suggestion => this.classifySuggestion(suggestion) === 'informational')
        .forEach(suggestion => insights.push(this.formatUserMessage(suggestion)));
    }

    return insights;
  }

  /**
   * Formats a message for user display
   */
  private static formatUserMessage(message: string): string {
    // Clean up technical prefixes
    let formatted = message
      .replace(/^(Key Point:|Recommendation:|SUGGESTION:)\s*/i, '')
      .trim();
    
    // Ensure first letter is capitalized
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    return formatted;
  }

  /**
   * Gets debug information for developers
   */
  static getDebugInfo(warnings: string[], suggestions?: Array<{description: string}>): string[] {
    const debugInfo: string[] = [];

    // Technical warnings
    warnings
      .filter(warning => !this.isUserFacing(warning) || this.classifyWarning(warning) === 'technical')
      .forEach(warning => debugInfo.push(warning));

    // Technical suggestions
    if (suggestions) {
      suggestions
        .map(s => s.description)
        .filter(suggestion => !this.isUserFacing(suggestion))
        .forEach(suggestion => debugInfo.push(suggestion));
    }

    return debugInfo;
  }
}