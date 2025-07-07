// src/components/code-assistant/context-aware-file-selector.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { FileText, Search, Zap, Filter } from 'lucide-react';
import { useIntentClassifier } from './intent-classifier-wrapper';

interface ContextAwareFileSelectorProps {
  availableFiles: string[];
  selectedFiles: string[];
  onFileSelectionChange: (files: string[]) => void;
  currentQuery?: string;
}

export const ContextAwareFileSelector: React.FC<ContextAwareFileSelectorProps> = ({
  availableFiles,
  selectedFiles,
  onFileSelectionChange,
  currentQuery
}) => {
  const { classifyQuery, isReady } = useIntentClassifier();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedFiles, setSuggestedFiles] = useState<string[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<string[]>(availableFiles);

  useEffect(() => {
    if (!currentQuery || !isReady) {
      setSuggestedFiles([]);
      return;
    }

    const suggestRelevantFiles = async () => {
      try {
        const intent = await classifyQuery(currentQuery, { availableFiles });
        
        // Use the IntentClassifier's file reference extraction
        const relevantFiles = intent.targetFiles || [];
        
        // Add additional heuristics based on intent type
        const additionalFiles = getFilesForIntent(intent.type, availableFiles, currentQuery);
        
        const allSuggested = [...new Set([...relevantFiles, ...additionalFiles])];
        setSuggestedFiles(allSuggested.slice(0, 5));
      } catch (error) {
        console.error('Failed to suggest files:', error);
      }
    };

    suggestRelevantFiles();
  }, [currentQuery, classifyQuery, isReady, availableFiles]);

  useEffect(() => {
    const filtered = availableFiles.filter(file => 
      file.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [searchTerm, availableFiles]);

  const getFilesForIntent = (intentType: string, files: string[], query: string) => {
    const relevantFiles = [];
    
    switch (intentType) {
      case 'code_generation':
        // Suggest component files, utils, and similar patterns
        relevantFiles.push(...files.filter(f => 
          f.includes('components/') || 
          f.includes('utils/') || 
          f.includes('lib/') ||
          f.includes('hooks/')
        ));
        break;
        
      case 'debug':
        // Suggest files that commonly have bugs
        relevantFiles.push(...files.filter(f => 
          f.includes('api/') || 
          f.includes('server/') ||
          f.includes('database/') ||
          f.includes('auth/')
        ));
        break;
        
      case 'code_review':
        // Suggest core business logic files
        relevantFiles.push(...files.filter(f => 
          f.includes('src/') && 
          (f.endsWith('.ts') || f.endsWith('.tsx')) &&
          !f.includes('test') &&
          !f.includes('spec')
        ));
        break;
        
      case 'refactor':
        // Suggest larger, complex files
        relevantFiles.push(...files.filter(f => 
          f.includes('pages/') || 
          f.includes('components/') ||
          f.includes('services/')
        ));
        break;
    }
    
    return relevantFiles.slice(0, 3);
  };

  const handleFileToggle = (file: string) => {
    if (selectedFiles.includes(file)) {
      onFileSelectionChange(selectedFiles.filter(f => f !== file));
    } else {
      onFileSelectionChange([...selectedFiles, file]);
    }
  };

  const handleSuggestedFilesSelect = () => {
    const newSelection = [...new Set([...selectedFiles, ...suggestedFiles])];
    onFileSelectionChange(newSelection);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white"
        />
      </div>

      {/* Smart Suggestions */}
      {suggestedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glassmorphism border border-indigo-500/30 p-3 rounded-lg bg-indigo-900/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-200" />
              <span className="text-sm font-medium text-indigo-200">
                Suggested Files for "{currentQuery?.slice(0, 30)}..."
              </span>
            </div>
            <Button
              size="sm"
              onClick={handleSuggestedFilesSelect}
              className="bg-indigo-600/50 hover:bg-indigo-600/70 text-xs"
            >
              Add All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestedFiles.map((file, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-indigo-400/30 text-indigo-200 cursor-pointer hover:bg-indigo-600/30"
                onClick={() => handleFileToggle(file)}
              >
                <FileText className="h-3 w-3 mr-1" />
                {file.split('/').pop()}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="glassmorphism border border-white/20 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-white/60" />
            <span className="text-sm font-medium text-white/80">
              Selected Files ({selectedFiles.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFileSelectionChange([])}
              className="border-white/20 bg-white/10 text-white text-xs ml-auto"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedFiles.map((file, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-white/20 bg-white/10 cursor-pointer hover:bg-red-500/20"
                onClick={() => handleFileToggle(file)}
              >
                {file.split('/').pop()}
                <span className="ml-1 text-white/40">×</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* File List */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {filteredFiles.map((file, index) => (
          <motion.div
            key={file}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              selectedFiles.includes(file)
                ? 'bg-indigo-600/30 border border-indigo-500/50'
                : 'hover:bg-white/10'
            }`}
            onClick={() => handleFileToggle(file)}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-white/60" />
              <span className="text-sm text-white/80">{file}</span>
            </div>
            {suggestedFiles.includes(file) && (
              <Badge className="bg-yellow-500/20 text-yellow-200 text-xs">
                Suggested
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};