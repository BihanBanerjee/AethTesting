'use client'

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RatingStars } from './rating-stars';
import { HelpfulToggle } from './helpful-toggle';
import { SatisfactionSlider } from './satisfaction-slider';
import { MessageSquare, X } from 'lucide-react';

interface FeedbackData {
  rating?: number;
  helpful?: boolean;
  feedback?: string;
  satisfaction?: number;
  applied?: boolean;
  modified?: boolean;
}

interface FeedbackModalProps {
  onFeedback: (feedback: FeedbackData) => void;
  hasGeneratedCode?: boolean;
  isLoading?: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  onFeedback,
  hasGeneratedCode = false,
  isLoading = false,
  trigger,
  open,
  onOpenChange
}) => {
  const [rating, setRating] = useState<number>(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [satisfaction, setSatisfaction] = useState<number>(5);
  const [applied, setApplied] = useState(false);
  const [modified, setModified] = useState(false);

  const handleSubmit = () => {
    const feedback: FeedbackData = {
      rating: rating > 0 ? rating : undefined,
      helpful: helpful !== null ? helpful : undefined,
      feedback: feedbackText.trim() || undefined,
      satisfaction: hasGeneratedCode ? satisfaction : undefined,
      applied: hasGeneratedCode ? applied : undefined,
      modified: hasGeneratedCode ? modified : undefined
    };

    onFeedback(feedback);
    resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setHelpful(null);
    setFeedbackText('');
    setSatisfaction(5);
    setApplied(false);
    setModified(false);
  };

  const hasValidFeedback = rating > 0 || helpful !== null || feedbackText.trim().length > 0;

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Detailed Feedback
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="glassmorphism border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Provide Feedback
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Help us improve by sharing your experience with this response.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Response Quality Rating */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Response Quality</h4>
            <RatingStars
              rating={rating}
              onRatingChange={setRating}
              size="md"
              disabled={isLoading}
            />
          </div>

          <Separator className="bg-white/20" />

          {/* Helpfulness */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Was this helpful?</h4>
            <HelpfulToggle
              helpful={helpful}
              onHelpfulChange={setHelpful}
              disabled={isLoading}
            />
          </div>

          {/* Code Generation Specific Feedback */}
          {hasGeneratedCode && (
            <>
              <Separator className="bg-white/20" />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white">Code Feedback</h4>
                
                {/* Code Satisfaction */}
                <SatisfactionSlider
                  satisfaction={satisfaction}
                  onSatisfactionChange={setSatisfaction}
                  disabled={isLoading}
                />

                {/* Code Usage */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-white/90">Code Usage:</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="applied-modal"
                        checked={applied}
                        onChange={(e) => setApplied(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="applied-modal" className="text-xs text-white/80 cursor-pointer">
                        ✅ I applied this code to my project
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modified-modal"
                        checked={modified}
                        onChange={(e) => setModified(e.target.checked)}
                        className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <label htmlFor="modified-modal" className="text-xs text-white/80 cursor-pointer">
                        ✏️ I modified the code before using it
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator className="bg-white/20" />

          {/* Additional Feedback */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Additional Comments</h4>
            <Textarea
              placeholder="Tell us what worked well or what could be improved..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="bg-white/10 border-white/20 text-white text-sm placeholder:text-white/40 min-h-[80px] resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange?.(false)}
              disabled={isLoading}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !hasValidFeedback}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>

          {!hasValidFeedback && (
            <p className="text-xs text-white/50 text-center">
              Please provide at least one form of feedback to submit.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};