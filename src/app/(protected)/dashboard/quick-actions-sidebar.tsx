// src/app/(protected)/dashboard/quick-actions-sidebar.tsx
'use client'

import React from 'react'
import { Presentation } from 'lucide-react'
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card'
import MeetingCard from './meeting-card'

interface QuickActionsSidebarProps {
  className?: string
}

const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({ className }) => {

  return (
    <div className={className}>
      <GlassmorphicCard className="p-6 h-full">
        {/* Simplified Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Presentation className="h-5 w-5 text-indigo-300" />
            </div>
            <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Meetings
            </h3>
          </div>
        </div>

        {/* Meeting Upload Section - Always Visible */}
        <div className="flex flex-col items-center">
          <MeetingCard />
        </div>
      </GlassmorphicCard>
    </div>
  )
}

export default QuickActionsSidebar