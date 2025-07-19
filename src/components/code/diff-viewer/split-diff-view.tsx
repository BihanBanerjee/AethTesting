import React from 'react';
import type { SplitDiffViewProps } from './types';

export const SplitDiffView: React.FC<SplitDiffViewProps> = ({ original, modified }) => {
  return (
    <div className="grid grid-cols-2">
      <div className="border-r border-white/10">
        <div className="px-3 py-1 bg-red-500/10 text-red-200 text-xs font-medium border-b border-white/10">
          Original
        </div>
        {original.split('\n').map((line, index) => (
          <div key={index} className="flex font-mono text-sm px-4 py-1 text-white/80">
            <span className="w-8 text-white/40 mr-4">{index + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="px-3 py-1 bg-green-500/10 text-green-200 text-xs font-medium border-b border-white/10">
          Modified
        </div>
        {modified.split('\n').map((line, index) => (
          <div key={index} className="flex font-mono text-sm px-4 py-1 text-white/80">
            <span className="w-8 text-white/40 mr-4">{index + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};