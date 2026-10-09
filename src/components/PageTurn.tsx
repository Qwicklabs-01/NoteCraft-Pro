import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PageTurnProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  children: React.ReactNode;
}

const PageTurn: React.FC<PageTurnProps> = ({ currentPage, totalPages, onPageChange, children }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  
  const handleNextPage = () => {
    if (currentPage < totalPages && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        onPageChange(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        onPageChange(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  };
  
  return (
    <div className="page-turn-container">
      <button 
        className="page-nav prev" 
        onClick={handlePrevPage}
        disabled={currentPage <= 1 || isFlipping}
      >
        ← Previous
      </button>
      
      <div className="page-content">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, rotateY: -10 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: 10 }}
          transition={{ duration: 0.3 }}
          className="page"
        >
          {children}
        </motion.div>
      </div>
      
      <button 
        className="page-nav next" 
        onClick={handleNextPage}
        disabled={currentPage >= totalPages || isFlipping}
      >
        Next →
      </button>
      
      <div className="page-indicator">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default PageTurn;
