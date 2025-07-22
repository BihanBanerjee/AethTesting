'use client'

import React, { useState } from 'react'
import { Presentation, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MeetingCard from '@/app/(protected)/dashboard/meeting-card'

const FloatingMeetingsButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 group"
        aria-label="Open meetings"
      >
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5" />
          <span className="hidden group-hover:block text-sm font-medium">Meetings</span>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md glassmorphism border border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Presentation className="h-5 w-5 text-indigo-300" />
              </div>
              Meetings
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <MeetingCard />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FloatingMeetingsButton