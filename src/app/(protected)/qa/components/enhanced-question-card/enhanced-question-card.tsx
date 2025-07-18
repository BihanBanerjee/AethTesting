'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Clock, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Question } from '../../types/question';

interface EnhancedQuestionCardProps {
  question: Question;
  index: number;
  onClick: () => void;
  onDelete: (id: string) => void;
}

const EnhancedQuestionCard: React.FC<EnhancedQuestionCardProps> = ({ 
  question, 
  index, 
  onClick, 
  onDelete 
}) => {
  let parsedMetadata = null;
  try {
    parsedMetadata = question.metadata ? 
      (typeof question.metadata === 'string' ? 
        JSON.parse(question.metadata) : 
        question.metadata) : null;
  } catch (error) {
    console.warn(`Failed to parse metadata for question ${question.id}:`, error);
  }
  
  // Check if we have generated code
  const hasGeneratedCode = !!(parsedMetadata?.generatedCode || 
                             parsedMetadata?.improvements?.improvedCode ||
                             parsedMetadata?.refactor?.refactoredCode);

  return (
    <motion.div 
      key={question.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className='glassmorphism border border-white/20 hover:border-indigo-400/30 hover:bg-white/5 transition-all hover:translate-y-[-2px] hover:shadow-lg'>
        <CardContent className='p-4'>
          <div className='flex justify-between items-start mb-3'>
            <div className='flex items-center flex-1'>
              <div className='flex-shrink-0 mr-3'>
                <img 
                  src={question.user.imageUrl || ''}
                  alt={question.user.firstName || 'User'}
                  className='rounded-full h-10 w-10 ring-2 ring-indigo-400/30 object-cover'
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{question.displayProperties.intentIcon}</span>
                  <h3 className='text-lg font-medium line-clamp-1 text-white'>
                    {question.question}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${question.displayProperties.intentColor}`}>
                    {question.intent?.replace('_', ' ') || 'question'}
                  </Badge>
                  {question.displayProperties.confidenceLevel && (
                    <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                      {question.displayProperties.confidenceLevel} confidence
                    </Badge>
                  )}
                  {question.displayProperties.satisfactionLevel && (
                    <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">
                      <Star className="h-3 w-3 mr-1" />
                      {question.displayProperties.satisfactionLevel}
                    </Badge>
                  )}
                  {/* Show generated code badge */}
                  {hasGeneratedCode && (
                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-300">
                      <Code className="h-3 w-3 mr-1" />
                      Code Generated
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(question.id);
                  }}
                  className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 p-1 h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <span className='text-xs text-white/50 whitespace-nowrap flex items-center'>
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(question.createdAt).toLocaleDateString()}
                </span>
              </div>
              {question.analytics.estimatedImpact && (
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                  Impact: {question.analytics.estimatedImpact}
                </Badge>
              )}
            </div>
          </div>
          
          <div className='bg-white/5 rounded-md p-3 h-24 overflow-hidden relative'>
            <p className='text-white/70 text-sm line-clamp-4'>
              {question.answer}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
          </div>
          
          <div className='flex justify-between items-center mt-3 text-sm'>
            <div className="flex items-center gap-4 text-white/50">
              <span>
                {/* Show file references OR generated code count */}
                {question.filesReferences?.length > 0 ? 
                  `${question.filesReferences.length} file references` :
                  hasGeneratedCode ? 
                    '1 generated file' :
                    '0 file references'
                }
              </span>
              {question.displayProperties.processingTimeFormatted && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {question.displayProperties.processingTimeFormatted}
                </span>
              )}
              {question.analytics.hasEnhancedData && (
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300">
                  Enhanced Data
                </Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 bg-white/10 text-white hover:bg-indigo-600/50"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EnhancedQuestionCard;