import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Settings2 } from 'lucide-react';
import type { GenerationInputFormProps } from '../shared/types';

// Smart auto-detection for language based on file extension and context
const detectLanguageFromFile = (filename?: string, prompt?: string): string => {
  // File extension mapping
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return 'typescript'; // Early return if no extension
    const mapping: Record<string, string> = {
      'md': 'markdown',
      'markdown': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'css',
      'sass': 'css',
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'xml': 'xml',
      'toml': 'toml',
      'ini': 'ini',
      'env': 'shell',
      'dockerfile': 'dockerfile',
      'tf': 'hcl',
    };
    if (mapping[ext]) return mapping[ext];
  }
  
  // Context-based detection from prompt
  if (prompt) {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('readme') || lowerPrompt.includes('markdown')) return 'markdown';
    if (lowerPrompt.includes('config') || lowerPrompt.includes('json')) return 'json';
    if (lowerPrompt.includes('yaml') || lowerPrompt.includes('yml')) return 'yaml';
    if (lowerPrompt.includes('html')) return 'html';
    if (lowerPrompt.includes('css') || lowerPrompt.includes('style')) return 'css';
    if (lowerPrompt.includes('database') || lowerPrompt.includes('query')) return 'sql';
    if (lowerPrompt.includes('script') || lowerPrompt.includes('bash')) return 'shell';
  }
  
  return 'typescript'; // Final fallback
};

// Expanded language options
const languageOptions = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'sql', label: 'SQL' },
  { value: 'shell', label: 'Shell/Bash' },
  { value: 'xml', label: 'XML' },
  { value: 'toml', label: 'TOML' },
  { value: 'ini', label: 'INI' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'hcl', label: 'HCL (Terraform)' },
];

export const GenerationInputForm: React.FC<GenerationInputFormProps> = ({
  availableFiles,
  request,
  onRequestChange,
  onGenerate,
  isGenerating
}) => {
  // Auto-detect language when target file or prompt changes
  useEffect(() => {
    const detectedLanguage = detectLanguageFromFile(request.targetFile, request.prompt);
    if (detectedLanguage !== request.language) {
      onRequestChange({ ...request, language: detectedLanguage });
    }
  }, [request.targetFile, request.prompt]);
  return (
    <Card className="glassmorphism border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wand2 className="h-5 w-5" />
          AI Code Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Request Type
            </label>
            <Select
              value={request.type}
              onValueChange={(value) => onRequestChange({ 
                ...request, 
                type: value as typeof request.type
              })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improvement">Code Improvement</SelectItem>
                <SelectItem value="feature">New Feature</SelectItem>
                <SelectItem value="fix">Bug Fix</SelectItem>
                <SelectItem value="refactor">Refactoring</SelectItem>
                <SelectItem value="generate">Generate File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Target File (Optional)
            </label>
            <Select
              value={request.targetFile || 'none'}
              onValueChange={(value) => onRequestChange({ 
                ...request, 
                targetFile: value === 'none' ? undefined : value 
              })}
            >
              <SelectTrigger 
                className="bg-white/10 border-white/20 text-white w-full max-w-full overflow-hidden"
                title={request.targetFile ? request.targetFile : undefined}
              >
                <SelectValue placeholder="Select file..." />
              </SelectTrigger>
              <SelectContent className="max-w-[400px]">
                <SelectItem value="none">No specific file</SelectItem>
                {availableFiles.map(file => (
                  <SelectItem 
                    key={file} 
                    value={file}
                    className="truncate overflow-hidden text-ellipsis"
                    title={file}
                  >
                    {file}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white/80 mb-2 block">
            Describe what you want to achieve
          </label>
          <Textarea
            value={request.prompt}
            onChange={(e) => onRequestChange({ ...request, prompt: e.target.value })}
            placeholder="e.g., 'Add error handling to the login function' or 'Create a new React component for user profiles'"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 min-h-[120px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Language
            </label>
            <Select
              value={request.language || 'typescript'}
              onValueChange={(value) => onRequestChange({ ...request, language: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Framework (Optional)
            </label>
            <Select
              value={request.framework || 'none'}
              onValueChange={(value) => onRequestChange({ 
                ...request, 
                framework: value === 'none' ? undefined : value 
              })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select framework..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No framework</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="nextjs">Next.js</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="fastapi">FastAPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={onGenerate}
          disabled={isGenerating || !request.prompt.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <Settings2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Code
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};