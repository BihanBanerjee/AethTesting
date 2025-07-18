// src/app/(protected)/dashboard/code-references/config/file-icons.ts
import { 
  FileText, 
  Sparkles, 
  Zap, 
  Search, 
  Bug, 
  Lightbulb 
} from 'lucide-react';
import type { FileType } from '../types/file-reference';

export function getFileTypeIcon(fileType: FileType) {
  switch (fileType) {
    case 'generated': return Sparkles;
    case 'improved': return Zap;
    case 'reviewed': return Search;
    case 'debug_target': return Bug;
    case 'debug_solution': return Bug;
    case 'explanation': return Lightbulb;
    case 'summary': return FileText;
    default: return FileText;
  }
}

export function getFileTypeIconProps(fileType: FileType) {
  switch (fileType) {
    case 'generated': return { className: "h-3 w-3 text-green-400" };
    case 'improved': return { className: "h-3 w-3 text-blue-400" };
    case 'reviewed': return { className: "h-3 w-3 text-purple-400" };
    case 'debug_target': return { className: "h-3 w-3 text-red-400" };
    case 'debug_solution': return { className: "h-3 w-3 text-green-400" };
    case 'explanation': return { className: "h-3 w-3 text-yellow-400" };
    case 'summary': return { className: "h-3 w-3 text-indigo-400" };
    default: return { className: "h-3 w-3 text-white/60" };
  }
}