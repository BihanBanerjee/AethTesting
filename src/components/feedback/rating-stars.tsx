'use client'

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showLabel?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
};

const labelMap = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent!'
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  disabled = false,
  showLabel = true
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleStarClick = (starRating: number) => {
    if (!disabled) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!disabled) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={disabled}
            className={cn(
              "transition-all duration-150 ease-in-out transform hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-sm",
              sizeMap[size],
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
            aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
          >
            <Star
              className={cn(
                "transition-colors duration-150",
                star <= displayRating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-white/30 hover:text-yellow-200",
                sizeMap[size]
              )}
            />
          </button>
        ))}
      </div>
      
      {showLabel && (displayRating > 0 || rating > 0) && (
        <span className="text-xs text-white/60 ml-1 min-w-[60px]">
          {labelMap[displayRating as keyof typeof labelMap] || labelMap[rating as keyof typeof labelMap]}
        </span>
      )}
    </div>
  );
};