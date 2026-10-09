import { configureStore } from '@reduxjs/toolkit';
import notebookReducer from './notebookSlice';
import canvasReducer from './canvasSlice';
import toolReducer from './toolSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    notebook: notebookReducer,
    canvas: canvasReducer,
    tool: toolReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['tool/setCurrentTool'],
        ignoredPaths: ['tool.currentTool'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
