// src/app/(protected)/dashboard/page.tsx - Updated with Integration

'use client'
import useProject from '@/hooks/use-project';
import { ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';
import React from 'react'
import CommitLog from './commit-log';
import ArchiveButton from './archive-button';
import TeamMembers from './team-members';
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import dynamic from 'next/dynamic';
import ProjectQueue from './project-queue';
import QuickActionsSidebar from './quick-actions-sidebar';

// Import the updated enhanced ask question card
import EnhancedAskQuestionCard from './ask-question-card';

const InviteButton = dynamic(() => import('./invite-button'), {
  ssr: false
})

const DashboardPage = () => {
    const { project } = useProject();
  return (
    <div className="text-white">
      {/* Add the Project Queue at the top */}
      <ProjectQueue />
      
      <div className='flex items-center justify-between flex-wrap gap-y-4'>
        <GlassmorphicCard className='w-fit px-4 py-3 bg-indigo-900/40'>
          <div className="flex items-center">
            <Github className='size-5 text-white' />
            <div className="ml-2">
              <p className='text-sm font-sm text-white'>
                This project is linked to {' '}
                <Link href={project?.githubUrl ?? ""} className='inline-flex items-center text-blue-200 hover:underline'>
                {project?.githubUrl}
                <ExternalLink className='ml-1 size-4' />
                </Link>
              </p>
            </div>
          </div>
        </GlassmorphicCard>
        
        <div className='flex items-center gap-4'>
          <TeamMembers />
          <InviteButton />
          <ArchiveButton /> 
        </div>
      </div>

      <div className="mt-6">
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4'>
          {/* Enhanced Ask Aetheria takes majority of the width */}
          <div className="md:col-span-2 lg:col-span-3 order-1 md:order-1">
            <EnhancedAskQuestionCard />
          </div>
          
          {/* Quick Actions Sidebar - responsive positioning */}
          <div className="md:col-span-1 lg:col-span-1 order-2 md:order-2">
            <QuickActionsSidebar />
          </div>
        </div>
      </div>

      <div className="mt-10"></div>
      <h2 className="text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Recent Commits</h2>
      <CommitLog />
    </div>
  )
}

export default DashboardPage