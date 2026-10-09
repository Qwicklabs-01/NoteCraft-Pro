/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface NotebookState {
  pages: { id: string; content: any }[];
}

const initialState: NotebookState = {
  pages: [],
};

const notebookSlice = createSlice({
  name: 'notebook',
  initialState,
  reducers: {
    savePageContent: (state, action: PayloadAction<{ pageId: string; content: any }>) => {
      const page = state.pages.find(p => p.id === action.payload.pageId);
      if (page) {
        page.content = action.payload.content;
      } else {
        state.pages.push({ id: action.payload.pageId, content: action.payload.content });
      }
    },
  },
});

export const { savePageContent } = notebookSlice.actions;
export default notebookSlice.reducer;
