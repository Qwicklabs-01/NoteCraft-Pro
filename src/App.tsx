
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Notebook from './pages/Notebook';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { ThemeProvider } from './contexts/ThemeContext';
import StickyNotesLayer from './components/StickyNotesLayer';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="relative w-full min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/notebook/:id" element={<Notebook />} />
                <Route path="/editor/:notebookId/:pageId" element={<Editor />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/auth" element={<Auth />} />
              </Routes>
              <StickyNotesLayer />
            </div>
          </BrowserRouter>
        </AuthProvider>

      </ThemeProvider>
    </Provider>
  );
}

export default App;

