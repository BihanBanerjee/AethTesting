import React from 'react';
import { DiffLine } from './diff-line';
import type { UnifiedDiffViewProps } from './types';

export const UnifiedDiffView: React.FC<UnifiedDiffViewProps> = ({ diff }) => {
  return (
    <div>
      {diff.map((line, index) => (
        <DiffLine key={index} line={line} />
      ))}
    </div>
  );
};