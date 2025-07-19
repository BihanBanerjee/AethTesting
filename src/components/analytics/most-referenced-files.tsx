import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { FileReference } from './types';

interface MostReferencedFilesProps {
  files: FileReference[];
}

export const MostReferencedFiles: React.FC<MostReferencedFilesProps> = ({
  files,
}) => {
  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Most Referenced Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={file.fileName} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-white">
                    {file.fileName.split('/').pop()}
                  </p>
                  <p className="text-xs text-white/60">
                    {file.fileName}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {file.queryCount} queries
                </p>
                <p className="text-xs text-white/60">
                  {file.contextUseCount} in context
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};