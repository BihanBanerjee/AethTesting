'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileUsageAnalyticsProps {
  files?: Array<{
    fileName: string;
    queryCount: number;
    contextUseCount: number;
    lastQueried: Date;
  }>;
}

export const FileUsageAnalytics: React.FC<FileUsageAnalyticsProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <Card className="glassmorphism border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            Most Referenced Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-white/60">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No file usage data</p>
            <p className="text-sm mt-2">Ask questions about your code to see which files are referenced most</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-5 w-5" />
          Most Referenced Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file, index) => (
            <div 
              key={file.fileName} 
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-600/20 rounded-full">
                  <span className="text-sm font-bold text-indigo-300">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">
                    {file.fileName}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Last queried: {formatDistanceToNow(new Date(file.lastQueried))} ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{file.queryCount}</div>
                  <div className="text-xs text-white/60">queries</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-300">{file.contextUseCount}</div>
                  <div className="text-xs text-white/60">context uses</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {files.length > 5 && (
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-sm text-white/60">
              Showing top {Math.min(files.length, 10)} most referenced files
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};