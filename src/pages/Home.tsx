import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PenTool, Image as ImageIcon, FileText, Share2, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Dashboard from './Dashboard';
import { triggerHaptic } from '../utils/telegram';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all"
  >
    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, loginAsGuest } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-indigo-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  const handleTryDemo = () => {
    loginAsGuest();
    triggerHaptic('success');
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-indigo-200">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <PenTool className="text-white" size={20} />
            </div>
            <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
              NoteCraft Pro
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => navigate('/auth')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 text-sm transition-colors"
            >
              Sign In
            </button>

            <button 
              onClick={handleTryDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              Try Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-28 pb-16 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Background Decorative Blur Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
          <div className="absolute top-32 -left-48 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6 sm:mb-8">
              Your Digital Notebook, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Reimagined.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Capture your thoughts with freehand sketching, seamless image editing, sticky notes, and instant Google Drive & MS Word syncing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:shadow-xl hover:shadow-indigo-200 dark:hover:shadow-none transition-all hover:-translate-y-1 active:scale-95"
              >
                Start Creating Free
                <ArrowRight size={20} />
              </button>

              <button 
                onClick={handleTryDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 px-6 py-3.5 sm:py-4 rounded-full font-bold text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Instant Demo
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={PenTool}
            title="Infinite Canvas"
            description="Sketch, draw, and annotate with a suite of professional digital tools and customizable brushes."
            delay={0.1}
          />
          <FeatureCard 
            icon={ImageIcon}
            title="Image Magic"
            description="Drop in images, crop, rotate, and apply stunning filters directly inside your notebooks."
            delay={0.2}
          />
          <FeatureCard 
            icon={FileText}
            title="Word Export"
            description="With one click, convert your digital sticky notes and text into professionally formatted MS Word docs."
            delay={0.3}
          />
          <FeatureCard 
            icon={Share2}
            title="Universal Sync"
            description="Seamlessly responsive on both Google Chrome and Telegram with instant cloud & offline backup."
            delay={0.4}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
