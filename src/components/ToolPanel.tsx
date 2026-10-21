import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { 
  setCurrentTool, 
  setStrokeWidth, 
  setColor, 
  setPaperStyle, 
  triggerCanvasAction,
  type ToolType,
  type PaperStyle
} from '../store/toolSlice';
import { 
  MousePointer,
  Pen, 
  Pencil, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  Triangle,
  Minus,
  Type, 
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  Sliders,
  Grid,
  FileText
} from 'lucide-react';
import ColorPicker from './common/ColorPicker';
import { triggerHaptic } from '../utils/telegram';

const COLOR_PRESETS = [
  '#000000', // Black
  '#4f46e5', // Indigo
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#16a34a', // Green
  '#ca8a04', // Yellow/Gold
  '#ea580c', // Orange
  '#dc2626', // Red
  '#9333ea', // Purple
  '#db2777', // Pink
  '#ffffff', // White
];

const STROKE_PRESETS = [2, 4, 8, 14];

const ToolPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTool = useAppSelector(state => state.tool.currentTool);
  const strokeWidth = useAppSelector(state => state.tool.strokeWidth);
  const color = useAppSelector(state => state.tool.color);
  const paperStyle = useAppSelector(state => state.tool.paperStyle);
  const canUndo = useAppSelector(state => state.tool.canUndo);
  const canRedo = useAppSelector(state => state.tool.canRedo);

  const [activePopover, setActivePopover] = useState<'colors' | 'stroke' | 'shapes' | 'paper' | null>(null);

  const togglePopover = (popover: 'colors' | 'stroke' | 'shapes' | 'paper') => {
    setActivePopover(prev => (prev === popover ? null : popover));
    triggerHaptic('light');
  };

  const handleToolSelect = (toolId: ToolType) => {
    dispatch(setCurrentTool(toolId));
    setActivePopover(null);
    triggerHaptic('selection');
  };

  const handleShapeSelect = (shapeType: 'rectangle' | 'circle' | 'triangle' | 'line') => {
    dispatch(triggerCanvasAction({ type: 'insertShape', payload: { shapeType } }));
    dispatch(setCurrentTool('select'));
    setActivePopover(null);
    triggerHaptic('medium');
  };

  const handleTextInsert = () => {
    dispatch(triggerCanvasAction({ type: 'insertText' }));
    dispatch(setCurrentTool('select'));
    setActivePopover(null);
    triggerHaptic('medium');
  };

  const handleImageInsert = () => {
    dispatch(triggerCanvasAction({ type: 'insertImage' }));
    setActivePopover(null);
    triggerHaptic('medium');
  };

  const handlePaperSelect = (style: PaperStyle) => {
    dispatch(setPaperStyle(style));
    setActivePopover(null);
    triggerHaptic('light');
  };

  return (
    <div className="relative flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-1 sm:gap-2 p-2 sm:p-3 bg-white dark:bg-gray-900 border-t sm:border-t-0 sm:border-r border-gray-200 dark:border-gray-800 shadow-sm z-20 w-full sm:w-20 select-none">
      {/* Primary Drawing Tools */}
      <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-1.5 overflow-x-auto sm:overflow-visible max-w-full py-1">
        {/* Select Tool */}
        <button
          type="button"
          onClick={() => handleToolSelect('select')}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${
            currentTool === 'select'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Select & Move (V)"
        >
          <MousePointer size={18} />
        </button>

        {/* Pen */}
        <button
          type="button"
          onClick={() => handleToolSelect('pen')}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${
            currentTool === 'pen'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Pen (P)"
        >
          <Pen size={18} />
        </button>

        {/* Pencil */}
        <button
          type="button"
          onClick={() => handleToolSelect('pencil')}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${
            currentTool === 'pencil'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Pencil"
        >
          <Pencil size={18} />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => handleToolSelect('highlighter')}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${
            currentTool === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Highlighter"
        >
          <Highlighter size={18} />
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => handleToolSelect('eraser')}
          className={`p-2 sm:p-2.5 rounded-xl transition-all ${
            currentTool === 'eraser'
              ? 'bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Eraser (E)"
        >
          <Eraser size={18} />
        </button>

        {/* Shapes Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover('shapes')}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              activePopover === 'shapes'
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Insert Shapes"
          >
            <Square size={18} />
          </button>

          {/* Shapes Popover */}
          {activePopover === 'shapes' && (
            <div className="absolute bottom-full mb-2 sm:bottom-auto sm:top-0 sm:left-full sm:ml-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex sm:flex-col gap-2 z-50">
              <button
                onClick={() => handleShapeSelect('rectangle')}
                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl text-gray-700 dark:text-gray-300"
                title="Rectangle"
              >
                <Square size={18} />
              </button>
              <button
                onClick={() => handleShapeSelect('circle')}
                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl text-gray-700 dark:text-gray-300"
                title="Circle"
              >
                <Circle size={18} />
              </button>
              <button
                onClick={() => handleShapeSelect('triangle')}
                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl text-gray-700 dark:text-gray-300"
                title="Triangle"
              >
                <Triangle size={18} />
              </button>
              <button
                onClick={() => handleShapeSelect('line')}
                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl text-gray-700 dark:text-gray-300"
                title="Line"
              >
                <Minus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Text Tool */}
        <button
          type="button"
          onClick={handleTextInsert}
          className="p-2 sm:p-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Add Text"
        >
          <Type size={18} />
        </button>

        {/* Image Tool */}
        <button
          type="button"
          onClick={handleImageInsert}
          className="p-2 sm:p-2.5 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Add Image"
        >
          <ImageIcon size={18} />
        </button>

        <div className="hidden sm:block w-8 h-[1px] bg-gray-200 dark:bg-gray-800 my-1" />

        {/* Color Button with Preview */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover('colors')}
            className={`p-2 sm:p-2.5 rounded-xl transition-all relative ${
              activePopover === 'colors'
                ? 'bg-indigo-100 dark:bg-indigo-950 ring-2 ring-indigo-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Colors"
          >
            <div className="relative">
              <Palette size={18} />
              <span
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white dark:border-gray-900 shadow-sm"
                style={{ backgroundColor: color }}
              />
            </div>
          </button>

          {/* Color Popover */}
          {activePopover === 'colors' && (
            <div className="absolute bottom-full mb-2 sm:bottom-auto sm:top-0 sm:left-full sm:ml-2 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-48 z-50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Palette
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      dispatch(setColor(c));
                      setActivePopover(null);
                      triggerHaptic('light');
                    }}
                    className={`w-7 h-7 rounded-full border border-black/10 dark:border-white/10 shadow-sm transition-transform hover:scale-110 active:scale-95 ${
                      color === c ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <ColorPicker
                  value={color}
                  onChange={(c) => {
                    dispatch(setColor(c));
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stroke Width Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover('stroke')}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              activePopover === 'stroke'
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Stroke Width"
          >
            <Sliders size={18} />
          </button>

          {/* Stroke Width Popover */}
          {activePopover === 'stroke' && (
            <div className="absolute bottom-full mb-2 sm:bottom-auto sm:top-0 sm:left-full sm:ml-2 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 w-44 z-50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Width: {strokeWidth}px
              </div>
              <div className="flex gap-2 mb-3 justify-between">
                {STROKE_PRESETS.map((sw) => (
                  <button
                    key={sw}
                    type="button"
                    onClick={() => {
                      dispatch(setStrokeWidth(sw));
                      setActivePopover(null);
                      triggerHaptic('light');
                    }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                      strokeWidth === sw
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {sw}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={strokeWidth}
                onChange={(e) => dispatch(setStrokeWidth(parseInt(e.target.value)))}
                className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Paper Style Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover('paper')}
            className={`p-2 sm:p-2.5 rounded-xl transition-all ${
              activePopover === 'paper'
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Paper Background"
          >
            <Grid size={18} />
          </button>

          {/* Paper Popover */}
          {activePopover === 'paper' && (
            <div className="absolute bottom-full mb-2 sm:bottom-auto sm:top-0 sm:left-full sm:ml-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex sm:flex-col gap-1.5 w-36 z-50">
              <button
                type="button"
                onClick={() => handlePaperSelect('blank')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
                  paperStyle === 'blank' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileText size={14} /> Blank
              </button>
              <button
                type="button"
                onClick={() => handlePaperSelect('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
                  paperStyle === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Grid size={14} /> Grid
              </button>
              <button
                type="button"
                onClick={() => handlePaperSelect('lined')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
                  paperStyle === 'lined' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Minus size={14} /> Lined
              </button>
              <button
                type="button"
                onClick={() => handlePaperSelect('dots')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
                  paperStyle === 'dots' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Circle size={14} /> Dotted
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Utilities: Undo, Redo, Zoom, Clear */}
      <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-1.5 sm:mt-auto pt-1 sm:pt-3 sm:border-t sm:border-gray-200 dark:sm:border-gray-800">
        <button
          type="button"
          onClick={() => {
            dispatch(triggerCanvasAction({ type: 'undo' }));
            triggerHaptic('light');
          }}
          disabled={!canUndo}
          className="p-2 sm:p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            dispatch(triggerCanvasAction({ type: 'redo' }));
            triggerHaptic('light');
          }}
          disabled={!canRedo}
          className="p-2 sm:p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            dispatch(triggerCanvasAction({ type: 'zoomIn' }));
            triggerHaptic('light');
          }}
          className="hidden sm:block p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            dispatch(triggerCanvasAction({ type: 'zoomOut' }));
            triggerHaptic('light');
          }}
          className="hidden sm:block p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            dispatch(triggerCanvasAction({ type: 'zoomReset' }));
            triggerHaptic('light');
          }}
          className="hidden sm:block p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Reset Zoom"
        >
          <Maximize2 size={16} />
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Clear everything on this page?')) {
              dispatch(triggerCanvasAction({ type: 'clear' }));
              triggerHaptic('warning');
            }
          }}
          className="p-2 sm:p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="Clear Canvas"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToolPanel;
