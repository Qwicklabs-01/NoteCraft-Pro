import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DrawingCanvas from '../components/DrawingCanvas';
import ToolPanel from '../components/ToolPanel';
import PDFExporter from '../components/PDFExporter';
import { useAuth } from '../contexts/AuthContext';
import { 
  getNotebook, 
  updateNotebookTitle, 
  addPage, 
  type NotebookItem,
  type NotebookPage 
} from '../services/notebookStorage';
import { 
  ArrowLeft, 
  Share2, 
  BookOpen, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { getTelegramWebApp, triggerHaptic } from '../utils/telegram';
import { useTheme } from '../contexts/ThemeContext';
import { fabric } from 'fabric';

const Editor: React.FC = () => {
  const { notebookId, pageId = 'page1' } = useParams<{ notebookId: string; pageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [notebook, setNotebook] = useState<NotebookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [currentPageDataUrl, setCurrentPageDataUrl] = useState<string>('');

  const activeCanvasRef = useRef<fabric.Canvas | null>(null);

  // Load notebook details
  const fetchCurrentNotebook = useCallback(async () => {
    if (!notebookId) return;
    try {
      setLoading(true);
      const data = await getNotebook(notebookId, user?.$id || 'guest');
      if (data) {
        setNotebook(data);
        setTitleInput(data.title);
      }
    } catch (err) {
      console.error('Failed to load notebook in editor:', err);
    } finally {
      setLoading(false);
    }
  }, [notebookId, user]);

  useEffect(() => {
    fetchCurrentNotebook();
  }, [fetchCurrentNotebook]);

  // Wire Telegram native BackButton
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg?.BackButton) {
      tg.BackButton.show();
      const onBackClick = () => {
        navigate(-1);
      };
      tg.BackButton.onClick(onBackClick);
      return () => {
        tg.BackButton.offClick(onBackClick);
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  // Handle title save
  const handleSaveTitle = async () => {
    if (!notebookId || !titleInput.trim()) return;
    setIsEditingTitle(false);
    await updateNotebookTitle(notebookId, titleInput.trim(), user?.$id || 'guest');
    setNotebook(prev => prev ? { ...prev, title: titleInput.trim() } : null);
    triggerHaptic('success');
  };

  // Handle page addition
  const handleAddNewPage = async () => {
    if (!notebookId) return;
    try {
      const newPage = await addPage(notebookId, user?.$id || 'guest');
      await fetchCurrentNotebook();
      navigate(`/editor/${notebookId}/${newPage.id}`);
      triggerHaptic('medium');
    } catch (err) {
      console.error('Failed to add page:', err);
    }
  };

  // Page switcher navigation
  const pages: NotebookPage[] = notebook?.pages || [{ id: 'page1', pageNumber: 1, content: '' }];
  const currentPageIndex = pages.findIndex(p => p.id === pageId);
  const currentSafeIndex = currentPageIndex >= 0 ? currentPageIndex : 0;
  const currentPageNumber = currentSafeIndex + 1;

  const goToPreviousPage = () => {
    if (currentSafeIndex > 0) {
      const prevPage = pages[currentSafeIndex - 1];
      navigate(`/editor/${notebookId}/${prevPage.id}`);
      triggerHaptic('selection');
    }
  };

  const goToNextPage = () => {
    if (currentSafeIndex < pages.length - 1) {
      const nextPage = pages[currentSafeIndex + 1];
      navigate(`/editor/${notebookId}/${nextPage.id}`);
      triggerHaptic('selection');
    }
  };

  // Trigger export modal with snapshot
  const handleOpenExport = () => {
    if (activeCanvasRef.current) {
      const dataUrl = activeCanvasRef.current.toDataURL({ format: 'png', multiplier: 2 });
      setCurrentPageDataUrl(dataUrl);
    }
    setIsExportOpen(true);
    triggerHaptic('light');
  };

  // Extract text from canvas for MS Word export
  const getTextContent = (): string => {
    if (!activeCanvasRef.current) return '';
    const objects = activeCanvasRef.current.getObjects();
    const textObjects = objects.filter(o => o.type === 'i-text' || o.type === 'text') as fabric.IText[];
    if (textObjects.length > 0) {
      return textObjects.map(t => t.text).join('\n\n');
    }
    return 'NoteCraft Sketches & Notes';
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 pt-[env(safe-area-inset-top)] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 sm:px-6 shadow-sm z-30 shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Title Editor */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="px-2 py-1 text-sm sm:text-base font-bold bg-gray-50 dark:bg-gray-800 border border-indigo-400 rounded-lg outline-none w-36 sm:w-60"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[130px] sm:max-w-[280px]"
              title="Click to rename"
            >
              <span className="truncate">{notebook?.title || 'Notebook'}</span>
              <Edit2 size={13} className="text-gray-400 shrink-0" />
            </button>
          )}
        </div>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs sm:text-sm">
          <button
            onClick={goToPreviousPage}
            disabled={currentSafeIndex <= 0}
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-semibold px-1 sm:px-2 min-w-[50px] text-center">
            {currentPageNumber} / {pages.length}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentSafeIndex >= pages.length - 1}
            className="p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleAddNewPage}
            className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ml-0.5"
            title="Add New Page"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Booklet View Button */}
          <button
            onClick={() => {
              if (notebookId) navigate(`/notebook/${notebookId}`);
              triggerHaptic('light');
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Open Booklet View"
          >
            <BookOpen size={15} />
            Booklet
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Export & Share Button */}
          <button
            onClick={handleOpenExport}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-indigo-200 dark:hover:shadow-none transition-all active:scale-95"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">Export & Share</span>
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden relative">
        {/* Tool Panel (Bottom Dock on Mobile, Left Dock on Desktop) */}
        <div className="order-last sm:order-first shrink-0 z-20 pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <ToolPanel />
        </div>

        {/* Center Canvas Area */}
        <main className="flex-1 overflow-hidden relative flex items-center justify-center p-2 sm:p-6 bg-gray-100 dark:bg-gray-950">
          {/* Digital Notebook Paper Container */}
          <div className="relative w-full h-full max-w-4xl max-h-full bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-800 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Loading notebook...
              </div>
            ) : (
              <DrawingCanvas
                key={`${notebookId}_${pageId}`}
                notebookId={notebookId}
                pageId={pageId}
                onCanvasReady={(c) => {
                  activeCanvasRef.current = c;
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Export & Share Modal */}
      <PDFExporter
        title={notebook?.title || 'NoteCraft Note'}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentPageDataUrl={currentPageDataUrl}
        textContent={getTextContent()}
      />
    </div>
  );
};

export default Editor;
