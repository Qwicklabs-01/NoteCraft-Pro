import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ToolType = 
  | 'select'
  | 'pen' 
  | 'pencil' 
  | 'highlighter' 
  | 'eraser' 
  | 'rectangle' 
  | 'circle' 
  | 'triangle'
  | 'line' 
  | 'text' 
  | 'image';

export type PaperStyle = 'blank' | 'grid' | 'lined' | 'dots';

interface ToolActionTrigger {
  type: 'undo' | 'redo' | 'clear' | 'insertShape' | 'insertText' | 'insertImage' | 'zoomIn' | 'zoomOut' | 'zoomReset';
  payload?: Record<string, unknown>;
  timestamp: number;
}

interface ToolState {
  currentTool: ToolType;
  strokeWidth: number;
  color: string;
  paperStyle: PaperStyle;
  actionTrigger: ToolActionTrigger | null;
  canUndo: boolean;
  canRedo: boolean;
}

const initialState: ToolState = {
  currentTool: 'pen',
  strokeWidth: 3,
  color: '#4f46e5',
  paperStyle: 'grid',
  actionTrigger: null,
  canUndo: false,
  canRedo: false,
};

const toolSlice = createSlice({
  name: 'tool',
  initialState,
  reducers: {
    setCurrentTool: (state, action: PayloadAction<ToolType>) => {
      state.currentTool = action.payload;
    },
    setStrokeWidth: (state, action: PayloadAction<number>) => {
      state.strokeWidth = action.payload;
    },
    setColor: (state, action: PayloadAction<string>) => {
      state.color = action.payload;
    },
    setPaperStyle: (state, action: PayloadAction<PaperStyle>) => {
      state.paperStyle = action.payload;
    },
    triggerCanvasAction: (state, action: PayloadAction<{ type: ToolActionTrigger['type']; payload?: Record<string, unknown> }>) => {
      state.actionTrigger = {
        type: action.payload.type,
        payload: action.payload.payload,
        timestamp: Date.now(),
      };
    },
    setUndoRedoState: (state, action: PayloadAction<{ canUndo: boolean; canRedo: boolean }>) => {
      state.canUndo = action.payload.canUndo;
      state.canRedo = action.payload.canRedo;
    },
  },
});

export const { 
  setCurrentTool, 
  setStrokeWidth, 
  setColor, 
  setPaperStyle, 
  triggerCanvasAction, 
  setUndoRedoState 
} = toolSlice.actions;

export default toolSlice.reducer;
