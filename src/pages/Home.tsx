import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PenTool, Image as ImageIcon, FileText, Share2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all"
  >
    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-200">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <PenTool className="text-white" size={20} />
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
              NoteCraft Pro
            </span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="text-gray-600 hover:text-gray-900 font-semibold px-4 py-2 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/editor/demo/page1')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              Try Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute top-32 -left-48 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-48 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-8">
              Your Digital Notebook, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Reimagined.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Capture your thoughts with freehand sketching, seamless image editing, sticky notes, and instant Google Drive & MS Word syncing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all hover:-translate-y-1"
              >
                Start Creating Free
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
            description="Connect to Google Drive and instantly share your creations via Telegram or WhatsApp."
            delay={0.4}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
