// src/components/feedback/feedback-collector.tsx
'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

interface FeedbackData {
  rating?: number;
  helpful?: boolean;
  feedback?: string;
  applied?: boolean;
  modified?: boolean;
}

interface FeedbackCollectorProps {
  onFeedback: (feedback: FeedbackData) => void;
  hasGeneratedCode?: boolean;
  isLoading?: boolean;
}

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({ 
  onFeedback, 
  hasGeneratedCode = false,
  isLoading = false 
}) => {
  const [rating, setRating] = useState<number>(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [applied, setApplied] = useState(false);
  const [modified, setModified] = useState(false);

  const submitFeedback = () => {
    const feedback: FeedbackData = {
      rating: rating > 0 ? rating : undefined,
      helpful: helpful !== null ? helpful : undefined,
      feedback: feedbackText.trim() || undefined,
      applied: hasGeneratedCode ? applied : undefined,
      modified: hasGeneratedCode ? modified : undefined
    };

    onFeedback(feedback);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glassmorphism border border-white/20 p-4 rounded-lg mt-4"
    >
      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <span>⭐</span>
        Rate this response
      </h4>
      
      <div className="space-y-4">
        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 min-w-[50px]">Quality:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-lg transition-colors hover:scale-110 transform ${
                  star <= rating ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-200'
                }`}
                disabled={isLoading}
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-xs text-white/60 ml-2">
              {rating === 5 ? 'Excellent!' : 
               rating === 4 ? 'Good' : 
               rating === 3 ? 'Okay' : 
               rating === 2 ? 'Poor' : 'Very Poor'}
            </span>
          )}
        </div>

        {/* Helpful buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 min-w-[50px]">Helpful:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={helpful === true ? "default" : "outline"}
              onClick={() => setHelpful(true)}
              className={`text-xs ${
                helpful === true 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'border-white/20 bg-white/10 text-white hover:bg-green-600/20'
              }`}
              disabled={isLoading}
            >
              👍 Yes
            </Button>
            <Button
              size="sm"
              variant={helpful === false ? "default" : "outline"}
              onClick={() => setHelpful(false)}
              className={`text-xs ${
                helpful === false 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'border-white/20 bg-white/10 text-white hover:bg-red-600/20'
              }`}
              disabled={isLoading}
            >
              👎 No
            </Button>
          </div>
        </div>

        {/* Code-specific feedback */}
        {hasGeneratedCode && (
          <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <h5 className="text-xs font-medium text-white/90">Code Usage:</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applied"
                  checked={applied}
                  onChange={(e) => setApplied(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <label htmlFor="applied" className="text-xs text-white/80 cursor-pointer">
                  ✅ I applied this code to my project
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="modified"
                  checked={modified}
                  onChange={(e) => setModified(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <label htmlFor="modified" className="text-xs text-white/80 cursor-pointer">
                  ✏️ I modified the code before using it
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Feedback text */}
        <div>
          <label className="text-xs text-white/70 block mb-1">
            Additional feedback (optional):
          </label>
          <Textarea
            placeholder="Tell us what worked well or what could be improved..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="bg-white/10 border-white/20 text-white text-xs placeholder:text-white/40 min-h-[60px] resize-none"
            rows={2}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-white/50">
            Your feedback helps improve AI responses
          </div>
          <Button
            size="sm"
            onClick={submitFeedback}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs px-4"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Submit Feedback & Save'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};