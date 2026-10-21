import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Book, 
  Clock, 
  Trash2, 
  Edit3, 
  LogOut, 
  Loader2, 
  Search, 
  BookOpen, 
  PenTool, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  Grid,
  FileText,
  Share2,
  X,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { 
  listNotebooks, 
  createNotebook, 
  deleteNotebook, 
  updateNotebookTitle, 
  type NotebookItem 
} from '../services/notebookStorage';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../utils/telegram';
import PDFExporter from '../components/PDFExporter';

const Dashboard: React.FC = () => {
  const { user, logout, isProjectPaused } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New notebook modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPaperStyle, setNewPaperStyle] = useState<'blank' | 'grid' | 'lined' | 'dots'>('grid');
  const [isCreating, setIsCreating] = useState(false);

  // Rename modal state
  const [editingNotebook, setEditingNotebook] = useState<NotebookItem | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Export modal state
  const [exportNotebook, setExportNotebook] = useState<NotebookItem | null>(null);

  const fetchNotebooks = useCallback(async () => {
    if (!user?.$id) return;
    try {
      setLoading(true);
      const data = await listNotebooks(user.$id);
      setNotebooks(data);
    } catch (err) {
      console.error('Error listing notebooks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.$id) return;

    try {
      setIsCreating(true);
      const title = newTitle.trim() || 'Untitled Notebook';
      const created = await createNotebook(user.$id, title, newPaperStyle);
      setIsCreateModalOpen(false);
      setNewTitle('');
      triggerHaptic('success');
      navigate(`/editor/${created.$id}/page1`);
    } catch (err) {
      console.error('Error creating notebook:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNotebook = async (notebookId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    if (!user?.$id) return;

    try {
      await deleteNotebook(notebookId, user.$id);
      setNotebooks(prev => prev.filter(n => n.$id !== notebookId));
      triggerHaptic('warning');
    } catch (err) {
      console.error('Error deleting notebook:', err);
    }
  };

  const handleSaveRename = async () => {
    if (!editingNotebook || !user?.$id || !editTitle.trim()) return;

    try {
      await updateNotebookTitle(editingNotebook.$id, editTitle.trim(), user.$id);
      setNotebooks(prev => prev.map(n => n.$id === editingNotebook.$id ? { ...n, title: editTitle.trim() } : n));
      setEditingNotebook(null);
      triggerHaptic('success');
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  // Filter notebooks by search query
  const filteredNotebooks = notebooks.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-16 pt-[env(safe-area-inset-top)] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
            <Book className="text-white" size={18} />
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
            NoteCraft Pro
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Settings Link */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
              {user?.name || 'User'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              triggerHaptic('light');
            }}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-gray-400 hover:text-red-600"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {isProjectPaused && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">Appwrite Cloud Project is Paused</h4>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                  Your backend was paused by Appwrite free tier due to 7 days of inactivity. All your notebooks are working smoothly in local offline storage. To resume cloud sync, restore your project in the Appwrite Console.
                </p>
              </div>
            </div>
            <a
              href="https://cloud.appwrite.io/console"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-sm"
            >
              <span>Restore Project</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* Banner / Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Your Notebooks
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create, sketch, view as booklet, and export to MS Word & PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* New Notebook Button */}
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                triggerHaptic('light');
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md hover:shadow-indigo-200 dark:hover:shadow-none transition-all active:scale-95 shrink-0"
            >
              <Plus size={18} />
              <span>New Notebook</span>
            </button>
          </div>
        </div>

        {/* Notebooks Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Book size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No notebooks found</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try matching another search keyword.' : 'Start your first digital sketchbook now!'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Create Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotebooks.map(notebook => (
              <div
                key={notebook.$id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top Icon & Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      onClick={() => navigate(`/editor/${notebook.$id}/page1`)}
                      className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform cursor-pointer"
                    >
                      <Book size={22} />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingNotebook(notebook);
                          setEditTitle(notebook.title);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Rename"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => setExportNotebook(notebook)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Export / Share"
                      >
                        <Share2 size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteNotebook(notebook.$id, notebook.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => navigate(`/editor/${notebook.$id}/page1`)}
                    className="text-lg font-bold text-gray-900 dark:text-white mb-2 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {notebook.title}
                  </h3>

                  {/* Badges: Page count & Paper style */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md">
                      {notebook.pages?.length || 1} {notebook.pages?.length === 1 ? 'Page' : 'Pages'}
                    </span>
                    <span className="text-[11px] font-semibold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                      {notebook.paperStyle || 'grid'} paper
                    </span>
                  </div>
                </div>

                {/* Card Footer: Date & Mode Buttons */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock size={12} />
                    {new Date(notebook.lastEdited).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Open in Booklet View */}
                    <button
                      onClick={() => navigate(`/notebook/${notebook.$id}`)}
                      className="px-2.5 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                      title="View as Booklet"
                    >
                      <BookOpen size={12} /> Booklet
                    </button>

                    {/* Open in Studio Editor */}
                    <button
                      onClick={() => navigate(`/editor/${notebook.$id}/page1`)}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                      title="Edit Canvas"
                    >
                      <PenTool size={12} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Notebook Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Notebook</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNotebook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Notebook Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics Notes, Wireframes, Daily Sketches"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Paper Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'grid', label: 'Grid Paper', icon: Grid },
                    { id: 'lined', label: 'Lined / Ruled', icon: FileText },
                    { id: 'dots', label: 'Dotted Grid', icon: Grid },
                    { id: 'blank', label: 'Plain Blank', icon: Book },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewPaperStyle(p.id as 'blank' | 'grid' | 'lined' | 'dots')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 text-xs font-semibold transition-all ${
                        newPaperStyle === p.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <p.icon size={16} />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Notebook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Notebook Modal */}
      {editingNotebook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Rename Notebook</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingNotebook(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Export Modal */}
      {exportNotebook && (
        <PDFExporter
          title={exportNotebook.title}
          isOpen={true}
          onClose={() => setExportNotebook(null)}
          allPageDataUrls={exportNotebook.pages.map(p => p.thumbnail).filter(Boolean) as string[]}
          textContent={`Notebook: ${exportNotebook.title}`}
        />
      )}
    </div>
  );
};

export default Dashboard;
