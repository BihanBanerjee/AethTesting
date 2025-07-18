// Updated QuestionDetail component in qa/page.tsx
// Replace the existing QuestionDetail component with this enhanced version

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Copy, X, FileText, Code } from 'lucide-react';
import { toast } from 'sonner';
import { AnswerTabContent, CodeTabContent, getClipboardContent } from './tab-content';
import type { Question } from '../../types/question';
import { getUserDisplayName, getUserImageUrl } from '../../types/question';

// Enhanced types

interface QuestionDetailProps {
  question: Question;
  onClose: () => void;
}

// Updates needed in qa/page.tsx
// Replace the existing QuestionDetail component with this updated version

const QuestionDetail: React.FC<QuestionDetailProps> = ({ question, onClose }) => {
  const [activeTab, setActiveTab] = useState('answer'); // 'answer' or 'code'
  
  // Reference to CodeReferenceWrapper to access its state
  const codeWrapperRef = useRef<{
    activeFileIndex: number;
  }>({ activeFileIndex: 0 });
  
  // Copy content to clipboard based on active tab
  const copyToClipboard = () => {
    try {
      const { content, filename } = getClipboardContent(activeTab, question, codeWrapperRef.current || { activeFileIndex: 0 });
      
      if (content) {
        navigator.clipboard.writeText(content);
        if (filename) {
          toast.success(`Code from ${filename} copied to clipboard`);
        } else {
          toast.success(`${activeTab === 'answer' ? 'Answer' : 'Content'} copied to clipboard`);
        }
      } else {
        toast.error('No content to copy');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-indigo-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Main content */}
      <motion.div 
        className="bg-transparent w-full max-w-6xl h-[85vh] z-10 flex flex-col rounded-xl overflow-hidden relative glassmorphism border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Top bar with controls */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-900/60 to-purple-900/40 flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="p-2 mr-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-white/70" />
            </button>
            <div className="flex items-center">
              <div className="mr-3">
                <img 
                  src={getUserImageUrl(question.user)}
                  alt={getUserDisplayName(question.user)}
                  className="h-8 w-8 rounded-full ring-2 ring-indigo-400/30"
                />
              </div>
              <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 line-clamp-1 mr-4">
                {question.question}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-white/50 mr-2">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(question.createdAt).toLocaleDateString()}
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Copy content"
            >
              <Copy className="h-4 w-4 text-white/70" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>
        </div>
        
        {/* Content area with tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab navigation */}
          <div className="w-16 shrink-0 bg-gradient-to-b from-indigo-900/40 to-purple-900/30 border-r border-indigo-500/20 flex flex-col items-center pt-4">
            <button
              onClick={() => setActiveTab('answer')}
              className={`p-3 rounded-lg mb-2 w-12 flex flex-col items-center justify-center transition-colors ${
                activeTab === 'answer' ? 'bg-indigo-600/70 text-white' : 'text-white/50 hover:bg-white/10'
              }`}
              title="Answer"
            >
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs">Answer</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`p-3 rounded-lg mb-2 w-12 flex flex-col items-center justify-center transition-colors ${
                activeTab === 'code' ? 'bg-indigo-600/70 text-white' : 'text-white/50 hover:bg-white/10'
              }`}
              title="Files & Code"
            >
              <Code className="h-5 w-5 mb-1" />
              <span className="text-xs">Code</span>
            </button>
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-hidden flex flex-col relative bg-gradient-to-br from-indigo-900/20 to-purple-900/10">
            {/* Answer Tab Content */}
            {activeTab === 'answer' && (
              <AnswerTabContent question={question} />
            )}

            {/* Files & Code Tab Content */}
            {activeTab === 'code' && (
              <CodeTabContent question={question} codeWrapperRef={codeWrapperRef} />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuestionDetail;