'use client'

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getIntentIcon, getIntentColor } from '@/lib/intent';
import type { MessageHeaderProps } from '../types/message-display.types';

export const MessageHeader: React.FC<MessageHeaderProps> = ({
  intent,
  confidence,
  timestamp
}) => {
  if (!intent) return null;

  return (
    <div className="flex items-center gap-2 mb-2">
      <Badge className={`text-xs ${getIntentColor(intent)}`}>
        {getIntentIcon(intent)}
        <span className="ml-1">{intent.replace('_', ' ')}</span>
      </Badge>
      {confidence && (
        <Badge variant="outline" className="text-xs">
          {Math.round(confidence * 100)}% confidence
        </Badge>
      )}
      <span className="text-xs text-white/60">
        {timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
};