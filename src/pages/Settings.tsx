import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { setPaperStyle, type PaperStyle } from '../store/toolSlice';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Monitor, 
  Database, 
  Trash2, 
  ShieldCheck, 
  User,
  ExternalLink,
  Book,
  Grid,
  FileText
} from 'lucide-react';
import { getTelegramWebApp, isTelegramWebApp, triggerHaptic } from '../utils/telegram';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();

  const paperStyle = useAppSelector(state => state.tool.paperStyle);

  const [cachedNotebooksCount, setCachedNotebooksCount] = useState<number>(0);

  useEffect(() => {
    // Count local storage notebooks
    try {
      const key = `notecraft_notebooks_${user?.$id || 'guest'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCachedNotebooksCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      setCachedNotebooksCount(0);
    }
  }, [user]);

  // Wire Telegram native BackButton
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg?.BackButton) {
      tg.BackButton.show();
      const onBackClick = () => navigate(-1);
      tg.BackButton.onClick(onBackClick);
      return () => {
        tg.BackButton.offClick(onBackClick);
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  const handleClearCache = () => {
    if (!window.confirm('Clear local notebook cache? (Remote cloud notes will not be deleted)')) return;
    try {
      const key = `notecraft_notebooks_${user?.$id || 'guest'}`;
      localStorage.removeItem(key);
      setCachedNotebooksCount(0);
      triggerHaptic('warning');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 pt-[env(safe-area-inset-top)] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-300"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      {/* Main Settings Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Account Card */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={15} /> Account Profile
          </h2>

          <div className="flex items-center gap-4">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold text-xl flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                {user?.name || 'Anonymous User'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || (user?.username ? `@${user.username}` : user?.$id)}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={12} />
                  {user?.isTelegram ? 'Telegram Account' : user?.isGuest ? 'Guest Session' : 'Appwrite Cloud'}
                </span>
                {isTelegramWebApp() && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                    Telegram Mini App
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/auth');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 px-3.5 py-2 rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Appearance & Theme
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: isTelegramWebApp() ? 'Telegram' : 'System', icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id as 'light' | 'dark' | 'system');
                  triggerHaptic('light');
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                  theme === t.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <t.icon size={18} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Default Paper Background
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'grid', label: 'Grid Paper', icon: Grid },
                { id: 'lined', label: 'Lined Paper', icon: FileText },
                { id: 'dots', label: 'Dotted Grid', icon: Grid },
                { id: 'blank', label: 'Blank Page', icon: Book },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    dispatch(setPaperStyle(p.id as PaperStyle));
                    triggerHaptic('light');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    paperStyle === p.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <p.icon size={14} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Cloud & Local Storage */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Database size={15} /> Cloud & Local Storage
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Local Cached Notebooks</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Offline copy of your canvases</div>
            </div>
            <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
              {cachedNotebooksCount} {cachedNotebooksCount === 1 ? 'notebook' : 'notebooks'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Clear Local Cache
            </button>
          </div>
        </section>

        {/* About App */}
        <section className="text-center py-6 text-xs text-gray-400 space-y-2">
          <p className="font-semibold text-gray-500 dark:text-gray-400">NoteCraft Pro • v1.0.0</p>
          <p>Digital notebook with sketching, drawing, and multi-platform sync.</p>
          <div className="flex justify-center gap-4 pt-2">
            <a
              href="https://github.com/Qwicklabs-01/NoteCraft-Pro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink size={14} /> GitHub Repository
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
