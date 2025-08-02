'use client'

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface SatisfactionSliderProps {
  satisfaction: number;
  onSatisfactionChange: (satisfaction: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

const satisfactionLabels = {
  1: { label: 'Poor', color: 'text-red-400' },
  2: { label: 'Poor', color: 'text-red-400' },
  3: { label: 'Poor', color: 'text-red-400' },
  4: { label: 'Good', color: 'text-amber-400' },
  5: { label: 'Good', color: 'text-amber-400' },
  6: { label: 'Good', color: 'text-amber-400' },
  7: { label: 'Good', color: 'text-amber-400' },
  8: { label: 'Excellent', color: 'text-green-400' },
  9: { label: 'Excellent', color: 'text-green-400' },
  10: { label: 'Excellent', color: 'text-green-400' }
};

const getSliderColor = (value: number) => {
  if (value <= 3) return 'bg-red-500';
  if (value <= 7) return 'bg-amber-500';
  return 'bg-green-500';
};

export const SatisfactionSlider: React.FC<SatisfactionSliderProps> = ({
  satisfaction,
  onSatisfactionChange,
  disabled = false,
  showLabels = true
}) => {
  const currentLabel = satisfactionLabels[satisfaction as keyof typeof satisfactionLabels];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/70">
          Code Satisfaction:
        </span>
        {showLabels && currentLabel && (
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium transition-colors duration-200",
              currentLabel.color
            )}>
              {currentLabel.label}
            </span>
            <span className="text-xs text-white/60">
              ({satisfaction}/10)
            </span>
          </div>
        )}
      </div>

      <div className="px-2">
        <Slider
          value={[satisfaction]}
          onValueChange={(value) => onSatisfactionChange(value[0]!)}
          max={10}
          min={1}
          step={1}
          disabled={disabled}
          className="w-full"
          aria-label={`Satisfaction rating: ${satisfaction} out of 10`}
        />
      </div>

      <div className="flex justify-between text-xs text-white/40 px-2">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>

      {/* Visual feedback indicator */}
      <div className="flex items-center justify-center mt-2">
        <div 
          className={cn(
            "h-1 w-16 rounded-full transition-colors duration-300",
            getSliderColor(satisfaction)
          )}
          style={{
            opacity: satisfaction / 10
          }}
        />
      </div>
    </div>
  );
};