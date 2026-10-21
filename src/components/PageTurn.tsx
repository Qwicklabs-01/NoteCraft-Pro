import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface PageTurnProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  children: React.ReactNode;
}

const PageTurn: React.FC<PageTurnProps> = ({ currentPage, totalPages, onPageChange, children }) => {
  const [direction, setDirection] = useState<number>(0);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setDirection(1);
      onPageChange(currentPage + 1);
      triggerHaptic('light');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setDirection(-1);
      onPageChange(currentPage - 1);
      triggerHaptic('light');
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      rotateY: dir > 0 ? 15 : -15,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      rotateY: dir > 0 ? -15 : 15,
      scale: 0.96,
      transition: {
        duration: 0.25,
      },
    }),
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden perspective-[1200px]">
      {/* Booklet Content Frame */}
      <div className="relative w-full flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full max-w-3xl max-h-[82vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col relative"
          >
            {/* Spine Effect on Left Edge */}
            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10" />

            {/* Page Content */}
            <div className="flex-1 w-full h-full overflow-hidden relative">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="h-14 sm:h-16 flex items-center justify-center gap-4 z-20 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-md border border-gray-200 dark:border-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <span className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-md border border-gray-200 dark:border-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PageTurn;
