'use client'

import React from 'react';
import { Trash2 } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  onCancel 
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glassmorphism border-white/20 bg-slate-900/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            Delete Question
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            Are you sure you want to delete this question? This action cannot be undone and will permanently remove the question and its answer from your project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
          >
            Delete Question
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;