'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface SaveActionButtonsProps {
  showFeedback: boolean;
  isLoading: boolean;
  onToggleFeedback: () => void;
  onQuickSave: () => void;
  onCloseFeedback: () => void;
}

export const SaveActionButtons: React.FC<SaveActionButtonsProps> = ({
  showFeedback,
  isLoading,
  onToggleFeedback,
  onQuickSave,
  onCloseFeedback
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        disabled={isLoading} 
        variant="outline" 
        size="sm"
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
        onClick={onToggleFeedback}
      >
        <Save className="h-4 w-4 mr-1" />
        {showFeedback ? 'Cancel' : 'Save with Feedback'}
      </Button>

      {/* Quick save without feedback */}
      {!showFeedback && (
        <Button 
          disabled={isLoading} 
          variant="outline" 
          size="sm"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={onQuickSave}
          title="Save without feedback"
        >
          Quick Save
        </Button>
      )}

      {showFeedback && (
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white/60 hover:text-white"
          onClick={onCloseFeedback}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};