import React, { useRef } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-300 dark:ring-gray-600 transition-transform hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden"
        style={{ backgroundColor: value }}
        title="Custom Color"
      >
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
        />
      </button>
      <span className="text-xs font-mono uppercase text-gray-500 dark:text-gray-400">
        {value}
      </span>
    </div>
  );
};

export default ColorPicker;
