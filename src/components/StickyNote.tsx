import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Palette } from 'lucide-react';

export interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface StickyNoteProps {
  note: StickyNoteData;
  onUpdate: (id: string, updates: Partial<StickyNoteData>) => void;
  onDelete: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const COLORS = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#E5E7EB'];

const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete, onDragEnd }) => {
  const [showColors, setShowColors] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onDragEnd(note.id, note.x + info.offset.x, note.y + info.offset.y);
      }}
      initial={{ x: note.x, y: note.y, scale: 0.8, opacity: 0 }}
      animate={{ x: note.x, y: note.y, scale: 1, opacity: 1 }}
      className="absolute shadow-2xl rounded-md flex flex-col pointer-events-auto"
      style={{
        backgroundColor: note.color,
        width: 220,
        height: 220,
        touchAction: 'none'
      }}
    >
      {/* Drag Handle & Controls */}
      <div className="h-8 bg-black/10 flex justify-between items-center px-2 cursor-grab active:cursor-grabbing rounded-t-md">
        <button 
          onClick={() => setShowColors(!showColors)}
          className="p-1 hover:bg-black/10 rounded transition-colors"
          title="Change Color"
        >
          <Palette size={14} className="text-gray-700" />
        </button>
        <button 
          onClick={() => onDelete(note.id)}
          className="p-1 hover:bg-black/10 rounded transition-colors text-red-600"
          title="Delete Note"
        >
          <X size={14} />
        </button>
      </div>

      {/* Color Palette Dropdown */}
      {showColors && (
        <div className="absolute top-8 left-0 right-0 bg-white/40 backdrop-blur-md p-3 flex gap-3 justify-center border-b border-black/10 z-10">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => {
                onUpdate(note.id, { color: c });
                setShowColors(false);
              }}
              className="w-6 h-6 rounded-full shadow-md border border-black/20 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <textarea
        value={note.text}
        onChange={(e) => onUpdate(note.id, { text: e.target.value })}
        className="flex-1 w-full bg-transparent p-3 resize-none outline-none text-gray-800 placeholder:text-gray-600/60 font-medium"
        placeholder="Type a quick note..."
        onPointerDownCapture={(e) => e.stopPropagation()} // Stop framer-motion from hijacking text selection/click
      />
    </motion.div>
  );
};

export default StickyNote;
