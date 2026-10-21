import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTurn from '../components/PageTurn';
import PDFExporter from '../components/PDFExporter';
import { useAuth } from '../contexts/AuthContext';
import { getNotebook, addPage, type NotebookItem, type NotebookPage } from '../services/notebookStorage';
import { 
  ArrowLeft, 
  PenTool, 
  Share2, 
  List, 
  Plus, 
  BookOpen, 
  X,
  Sun,
  Moon
} from 'lucide-react';
import { getTelegramWebApp, triggerHaptic } from '../utils/telegram';
import { useTheme } from '../contexts/ThemeContext';
import { fabric } from 'fabric';

const Notebook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [notebook, setNotebook] = useState<NotebookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [renderedPageImages, setRenderedPageImages] = useState<string[]>([]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<fabric.StaticCanvas | null>(null);

  // Load notebook
  const fetchNotebook = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getNotebook(id, user?.$id || 'guest');
      if (data) {
        setNotebook(data);
      }
    } catch (err) {
      console.error('Failed to load booklet notebook:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchNotebook();
  }, [fetchNotebook]);

  // Wire Telegram native BackButton
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg?.BackButton) {
      tg.BackButton.show();
      const onBackClick = () => navigate('/');
      tg.BackButton.onClick(onBackClick);
      return () => {
        tg.BackButton.offClick(onBackClick);
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  const pages: NotebookPage[] = notebook?.pages || [{ id: 'page1', pageNumber: 1, content: '' }];
  const activePage = pages[currentPageIndex] || pages[0];

  // Render current page content to static preview canvas
  useEffect(() => {
    if (!previewCanvasRef.current || !activePage) return;

    const sCanvas = new fabric.StaticCanvas(previewCanvasRef.current, {
      width: 800,
      height: 1000,
      backgroundColor: '#ffffff',
    });
    staticCanvasRef.current = sCanvas;

    if (activePage.content) {
      try {
        sCanvas.loadFromJSON(JSON.parse(activePage.content), () => {
          sCanvas.renderAll();
        });
      } catch {
        sCanvas.renderAll();
      }
    } else {
      sCanvas.renderAll();
    }

    return () => {
      sCanvas.dispose();
      staticCanvasRef.current = null;
    };
  }, [activePage, currentPageIndex]);

  const handleAddNewPage = async () => {
    if (!id) return;
    try {
      await addPage(id, user?.$id || 'guest');
      await fetchNotebook();
      setCurrentPageIndex(pages.length); // go to new page
      triggerHaptic('medium');
    } catch (err) {
      console.error('Failed to add page:', err);
    }
  };

  const handleOpenExport = () => {
    // Generate snapshot for all pages
    if (staticCanvasRef.current) {
      const snap = staticCanvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
      setRenderedPageImages([snap]);
    }
    setIsExportOpen(true);
    triggerHaptic('light');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden select-none">
      {/* Header */}
      <header className="h-14 sm:h-16 pt-[env(safe-area-inset-top)] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 sm:px-6 shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 truncate">
            <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              {notebook?.title || 'Booklet Viewer'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Table of Contents toggle */}
          <button
            onClick={() => {
              setIsTocOpen(!isTocOpen);
              triggerHaptic('light');
            }}
            className={`p-2 rounded-xl transition-colors ${
              isTocOpen 
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
            title="Table of Contents"
          >
            <List size={18} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Export & Share */}
          <button
            onClick={handleOpenExport}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
            title="Export / Share"
          >
            <Share2 size={18} />
          </button>

          {/* Edit in Canvas Button */}
          <button
            onClick={() => {
              if (notebook && activePage) {
                navigate(`/editor/${notebook.$id}/${activePage.id}`);
                triggerHaptic('medium');
              }
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-indigo-200 dark:hover:shadow-none transition-all active:scale-95 ml-1"
          >
            <PenTool size={15} />
            <span>Edit Page</span>
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Table of Contents Sidebar / Drawer */}
        {isTocOpen && (
          <aside className="absolute inset-y-0 left-0 w-64 sm:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl z-40 flex flex-col animate-slide-right">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <List size={16} /> Table of Contents
              </h3>
              <button
                onClick={() => setIsTocOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setIsTocOpen(false);
                    triggerHaptic('selection');
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    currentPageIndex === idx
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">Page {idx + 1}</span>
                  <span className="text-xs text-gray-400">Jump →</span>
                </button>
              ))}

              <button
                onClick={handleAddNewPage}
                className="w-full py-2.5 px-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Add New Page
              </button>
            </div>
          </aside>
        )}

        {/* Booklet Display Area */}
        <main className="flex-1 h-full overflow-hidden flex flex-col justify-center items-center">
          {loading ? (
            <div className="text-gray-400">Loading booklet...</div>
          ) : (
            <PageTurn
              currentPage={currentPageIndex + 1}
              totalPages={pages.length}
              onPageChange={(p) => setCurrentPageIndex(p - 1)}
            >
              {/* Rendered Canvas Preview */}
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 bg-white dark:bg-gray-900">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                />
              </div>
            </PageTurn>
          )}
        </main>
      </div>

      {/* Export Modal */}
      <PDFExporter
        title={notebook?.title || 'Booklet'}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        allPageDataUrls={renderedPageImages}
      />
    </div>
  );
};

export default Notebook;
