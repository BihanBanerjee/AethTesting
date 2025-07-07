// src/components/code-assistant/smart-input-suggestions.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntentClassifier } from './intent-classifier-wrapper';
import { Code, Zap, Search, Bug, Wrench, Lightbulb, Sparkles } from 'lucide-react';

interface SmartInputSuggestionsProps {
  currentInput: string;
  onSuggestionSelect: (suggestion: string) => void;
  projectContext?: {
    availableFiles: string[];
    techStack: string[];
    recentQueries: string[];
  };
}

export const SmartInputSuggestions: React.FC<SmartInputSuggestionsProps> = ({
  currentInput,
  onSuggestionSelect,
  projectContext
}) => {
  const { classifyQuery, isReady } = useIntentClassifier();
  const [predictions, setPredictions] = useState<Array<{
    suggestion: string;
    intent: string;
    confidence: number;
    icon: React.ReactNode;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!currentInput.trim() || currentInput.length < 10 || !isReady) {
      setPredictions([]);
      return;
    }

    const analyzeInput = async () => {
      setIsAnalyzing(true);
      try {
        const intent = await classifyQuery(currentInput, projectContext);
        
        // Generate contextual suggestions based on intent
        const suggestions = generateSuggestions(currentInput, intent, projectContext);
        setPredictions(suggestions);
      } catch (error) {
        console.error('Failed to analyze input:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const debounceTimer = setTimeout(analyzeInput, 800);
    return () => clearTimeout(debounceTimer);
  }, [currentInput, classifyQuery, isReady, projectContext]);

  const generateSuggestions = (input: string, intent: any, context?: any) => {
    const suggestions = [];
    
    // Intent-specific suggestions
    switch (intent.type) {
      case 'code_generation':
        suggestions.push({
          suggestion: `${input} with TypeScript and proper error handling`,
          intent: 'Enhanced Generation',
          confidence: intent.confidence,
          icon: <Code className="h-3 w-3" />
        });
        
        if (context?.techStack?.includes('React')) {
          suggestions.push({
            suggestion: `${input} as a React component with hooks`,
            intent: 'React Component',
            confidence: intent.confidence * 0.9,
            icon: <Code className="h-3 w-3" />
          });
        }
        break;
        
      case 'debug':
        suggestions.push({
          suggestion: `${input} and provide step-by-step debugging guide`,
          intent: 'Debug Guide',
          confidence: intent.confidence,
          icon: <Bug className="h-3 w-3" />
        });
        
        suggestions.push({
          suggestion: `${input} and suggest testing strategies to prevent this`,
          intent: 'Debug + Prevention',
          confidence: intent.confidence * 0.8,
          icon: <Bug className="h-3 w-3" />
        });
        break;
        
      case 'code_improvement':
        suggestions.push({
          suggestion: `${input} and explain the performance impact`,
          intent: 'Performance Analysis',
          confidence: intent.confidence,
          icon: <Zap className="h-3 w-3" />
        });
        
        suggestions.push({
          suggestion: `${input} following SOLID principles`,
          intent: 'SOLID Refactor',
          confidence: intent.confidence * 0.9,
          icon: <Zap className="h-3 w-3" />
        });
        break;
        
      case 'code_review':
        suggestions.push({
          suggestion: `${input} with security vulnerability assessment`,
          intent: 'Security Review',
          confidence: intent.confidence,
          icon: <Search className="h-3 w-3" />
        });
        break;
        
      case 'refactor':
        suggestions.push({
          suggestion: `${input} while maintaining backward compatibility`,
          intent: 'Safe Refactor',
          confidence: intent.confidence,
          icon: <Wrench className="h-3 w-3" />
        });
        break;
        
      case 'explain':
        suggestions.push({
          suggestion: `${input} with visual diagrams and examples`,
          intent: 'Visual Explanation',
          confidence: intent.confidence,
          icon: <Lightbulb className="h-3 w-3" />
        });
        break;
    }
    
    // Add file-specific suggestions if files are detected
    if (intent.targetFiles && intent.targetFiles.length > 0) {
      suggestions.push({
        suggestion: `${input} specifically for ${intent.targetFiles[0]}`,
        intent: 'File-Specific',
        confidence: intent.confidence * 0.95,
        icon: <Sparkles className="h-3 w-3" />
      });
    }
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  };

  if (predictions.length === 0 || isAnalyzing) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-3"
      >
        <div className="text-xs text-white/60 mb-2 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Smart Suggestions
        </div>
        <div className="flex flex-wrap gap-2">
          {predictions.map((prediction, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSuggestionSelect(prediction.suggestion)}
                className="border-white/20 bg-white/5 text-white hover:bg-white/15 text-xs h-auto py-2 px-3"
              >
                <div className="flex items-center gap-1">
                  {prediction.icon}
                  <span className="mr-1">{prediction.intent}</span>
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                    {Math.round(prediction.confidence * 100)}%
                  </Badge>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};