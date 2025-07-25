'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Copy, Bookmark, ThumbsUp, ThumbsDown, Maximize2 } from 'lucide-react';
import { DarkMarkdown } from '@/components/ui/dark-markdown';

interface ResponseSection {
  title: string;
  content: string;
  type: 'summary' | 'steps' | 'code' | 'tips' | 'details';
  priority: 'high' | 'medium' | 'low';
}

interface EnhancedResponseDisplayProps {
  content: string;
  messageType: 'user' | 'assistant';
}

// Enhanced response parser to break down long responses
const parseResponseIntoSections = (content: string): { summary: string; sections: ResponseSection[] } => {
  // Simple parsing logic - can be enhanced
  const lines = content.split('\n');
  let sections: ResponseSection[] = [];
  let currentSection = '';
  let currentTitle = '';
  let sectionType: ResponseSection['type'] = 'details';
  
  // Extract summary (first paragraph)
  const summaryMatch = content.match(/^(.+?)\n\n/s);
  const summary = summaryMatch && summaryMatch[1] ? summaryMatch[1].substring(0, 200) + '...' : 'AI response summary';
  
  // Parse major sections
  lines.forEach((line, index) => {
    if (line.match(/^#+\s+/) || line.match(/^\d+\.\s+/) || line.match(/^\*\*.*\*\*:?$/)) {
      // Save previous section
      if (currentTitle && currentSection) {
        sections.push({
          title: currentTitle,
          content: currentSection.trim(),
          type: sectionType,
          priority: index < lines.length * 0.3 ? 'high' : index < lines.length * 0.7 ? 'medium' : 'low'
        });
      }
      
      // Start new section
      currentTitle = line.replace(/^#+\s+|^\d+\.\s+|\*\*/g, '').trim();
      currentSection = '';
      
      // Determine section type
      if (line.toLowerCase().includes('installation') || line.toLowerCase().includes('setup')) {
        sectionType = 'steps';
      } else if (line.toLowerCase().includes('code') || line.toLowerCase().includes('example')) {
        sectionType = 'code';
      } else if (line.toLowerCase().includes('tip') || line.toLowerCase().includes('recommendation')) {
        sectionType = 'tips';
      } else {
        sectionType = 'details';
      }
    } else {
      currentSection += line + '\n';
    }
  });
  
  // Add final section
  if (currentTitle && currentSection) {
    sections.push({
      title: currentTitle,
      content: currentSection.trim(),
      type: sectionType,
      priority: 'medium'
    });
  }
  
  return { summary, sections };
};

const SectionTypeIcon = ({ type }: { type: ResponseSection['type'] }) => {
  const icons = {
    summary: '📋',
    steps: '📝',
    code: '💻',
    tips: '💡',
    details: '📚'
  };
  return <span className="mr-2">{icons[type]}</span>;
};

const PriorityBadge = ({ priority }: { priority: ResponseSection['priority'] }) => {
  const colors = {
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-300 border-green-500/30'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${colors[priority]}`}>
      {priority}
    </span>
  );
};

export const EnhancedResponseDisplay: React.FC<EnhancedResponseDisplayProps> = ({ 
  content, 
  messageType 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])); // First section expanded by default
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Only enhance long responses (>500 chars)
  if (content.length < 500 || messageType === 'user') {
    return <DarkMarkdown content={content} className="chatgpt-style-response" />;
  }

  const { summary, sections } = parseResponseIntoSections(content);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (showFullResponse) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Full Response</h3>
          <button
            onClick={() => setShowFullResponse(false)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white/80"
          >
            Show Sections
          </button>
        </div>
        <DarkMarkdown content={content} className="chatgpt-style-response" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Response Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">AI Response</h3>
          <span className="text-sm text-white/60">{sections.length} sections</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFullResponse(true)}
            className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white/80"
            title="View full response"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleCopy(content, 'full')}
            className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white/80"
            title="Copy full response"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 rounded-lg border border-indigo-500/20"
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-white mb-2">Summary</h4>
            <p className="text-white/80 text-sm leading-relaxed">{summary}</p>
          </div>
          <button
            onClick={() => handleCopy(summary, 'summary')}
            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* Interactive Sections */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(index)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <SectionTypeIcon type={section.type} />
                <h4 className="font-medium text-white text-left">{section.title}</h4>
                <PriorityBadge priority={section.priority} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(section.content, `section-${index}`);
                  }}
                  className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white/80"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {expandedSections.has(index) ? (
                  <ChevronDown className="h-4 w-4 text-white/60" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-white/60" />
                )}
              </div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {expandedSections.has(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/10"
                >
                  <div className="p-4 pt-3">
                    <DarkMarkdown 
                      content={section.content} 
                      className="text-sm" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          onClick={() => {
            const allSections = new Set(sections.map((_, i) => i));
            setExpandedSections(expandedSections.size === sections.length ? new Set() : allSections);
          }}
          className="text-sm text-white/60 hover:text-white/80"
        >
          {expandedSections.size === sections.length ? 'Collapse All' : 'Expand All'}
        </button>
        
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white/80">
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white/80">
            <ThumbsDown className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-md text-white/60 hover:text-white/80">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};