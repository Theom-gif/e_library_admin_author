import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteModal = ({ isOpen, onClose, onConfirm, bookTitle }) => {
  const MotionDiv = motion.div;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <MotionDiv 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-[#1a2b2f] text-white rounded-2xl shadow-2xl overflow-hidden p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
                <AlertTriangle size={24} />
              </div>
              
              <h2 className="text-xl font-bold mb-4">Delete Book</h2>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="text-white font-medium">"{bookTitle}"</span>? This action cannot be undone and all associated data will be permanently removed.
              </p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-colors shadow-lg shadow-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
