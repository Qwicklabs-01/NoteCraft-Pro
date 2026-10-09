import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ToolState {
  currentTool: string;
  strokeWidth: number;
  color: string;
}

const initialState: ToolState = {
  currentTool: 'pen',
  strokeWidth: 2,
  color: '#000000',
};

const toolSlice = createSlice({
  name: 'tool',
  initialState,
  reducers: {
    setCurrentTool: (state, action: PayloadAction<string>) => {
      state.currentTool = action.payload;
    },
    setStrokeWidth: (state, action: PayloadAction<number>) => {
      state.strokeWidth = action.payload;
    },
    setColor: (state, action: PayloadAction<string>) => {
      state.color = action.payload;
    },
  },
});

export const { setCurrentTool, setStrokeWidth, setColor } = toolSlice.actions;
export default toolSlice.reducer;
