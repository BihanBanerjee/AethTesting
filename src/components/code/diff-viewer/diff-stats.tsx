import React from 'react';
import type { DiffStatsProps } from './types';

export const DiffStats: React.FC<DiffStatsProps> = ({ stats }) => {
  return (
    <div className="text-xs text-white/60 mr-4">
      <span className="text-green-400">+{stats.additions}</span>
      {' '}
      <span className="text-red-400">-{stats.deletions}</span>
    </div>
  );
};