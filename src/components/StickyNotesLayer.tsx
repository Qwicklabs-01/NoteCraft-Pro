import React, { useState } from 'react';
import StickyNote from './StickyNote';
import type { StickyNoteData } from './StickyNote';
import { StickyNote as StickyNoteIcon } from 'lucide-react';

const StickyNotesLayer: React.FC = () => {
  const [notes, setNotes] = useState<StickyNoteData[]>([]);

  const addNote = () => {
    const newNote: StickyNoteData = {
      id: Date.now().toString(),
      x: window.innerWidth / 2 - 110 + (Math.random() * 60 - 30),
      y: window.innerHeight / 2 - 110 + (Math.random() * 60 - 30),
      text: '',
      color: '#FEF08A' // Default yellow
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, updates: Partial<StickyNoteData>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleDragEnd = (id: string, x: number, y: number) => {
    updateNote(id, { x, y });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Floating Add Note Button */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <button 
          onClick={addNote}
          className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 shadow-xl rounded-full p-4 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          title="New Sticky Note"
        >
          <StickyNoteIcon size={24} />
        </button>
      </div>

      {/* Render Notes */}
      {notes.map(note => (
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
