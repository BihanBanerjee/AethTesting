import React from 'react';
import { getLineStyle, getLinePrefix } from './utils';
import type { DiffLineProps } from './types';

export const DiffLine: React.FC<DiffLineProps> = ({ line }) => {
  if (line.type === 'changed') {
    return (
      <>
        <div className={`flex font-mono text-sm px-4 py-1 ${getLineStyle('removed')}`}>
          <span className="w-12 text-white/40 mr-4">
            {line.originalLineNumber}
          </span>
          <span className="w-4 mr-2">-</span>
          <span>{line.originalContent}</span>
        </div>
        <div className={`flex font-mono text-sm px-4 py-1 ${getLineStyle('added')}`}>
          <span className="w-12 text-white/40 mr-4">
            {line.modifiedLineNumber}
          </span>
          <span className="w-4 mr-2">+</span>
          <span>{line.modifiedContent}</span>
        </div>
      </>
    );
  }

  return (
    <div className={`flex font-mono text-sm px-4 py-1 ${getLineStyle(line.type)}`}>
      <span className="w-12 text-white/40 mr-4">
        {line.originalLineNumber || line.modifiedLineNumber}
      </span>
      <span className="w-4 mr-2">{getLinePrefix(line.type)}</span>
      <span>{line.content}</span>
    </div>
  );
};