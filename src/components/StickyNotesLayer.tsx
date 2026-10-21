import React, { useState, useEffect } from 'react';
import StickyNote from './StickyNote';
import type { StickyNoteData } from './StickyNote';
import { StickyNote as StickyNoteIcon, Eye, EyeOff } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

const STORAGE_KEY = 'notecraft_sticky_notes';

const StickyNotesLayer: React.FC = () => {
  const [notes, setNotes] = useState<StickyNoteData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore
    }
  }, [notes]);

  const addNote = () => {
    const defaultX = Math.max(20, Math.min(window.innerWidth - 240, window.innerWidth / 2 - 110 + (Math.random() * 40 - 20)));
    const defaultY = Math.max(80, Math.min(window.innerHeight - 300, window.innerHeight / 2 - 110 + (Math.random() * 40 - 20)));

    const newNote: StickyNoteData = {
      id: Date.now().toString(),
      x: defaultX,
      y: defaultY,
      text: '',
      color: '#FEF08A' // Default soft yellow
    };
    setNotes([...notes, newNote]);
    setIsVisible(true);
    triggerHaptic('light');
  };

  const updateNote = (id: string, updates: Partial<StickyNoteData>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    triggerHaptic('light');
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    // Keep inside screen bounds
    const safeX = Math.max(10, Math.min(window.innerWidth - 120, x));
    const safeY = Math.max(60, Math.min(window.innerHeight - 100, y));
    updateNote(id, { x: safeX, y: safeY });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Floating Control Hub */}
      <div 
        className="absolute top-20 right-3 sm:right-6 pointer-events-auto flex items-center gap-1.5"
      >
        {notes.length > 0 && (
          <button
            onClick={() => {
              setIsVisible(!isVisible);
              triggerHaptic('light');
            }}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-md border border-gray-200 dark:border-gray-700 rounded-full p-2.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title={isVisible ? 'Hide Sticky Notes' : 'Show Sticky Notes'}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        <button 
          onClick={addNote}
          className="bg-amber-300 hover:bg-amber-400 text-amber-950 shadow-lg rounded-full p-2.5 sm:p-3 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-amber-400"
          title="New Sticky Note"
        >
          <StickyNoteIcon size={18} />
        </button>
      </div>

      {/* Render Notes */}
      {isVisible && notes.map(note => (
        <StickyNote 
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};

export default StickyNotesLayer;
