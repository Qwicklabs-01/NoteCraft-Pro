import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Book, Clock, MoreVertical, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mock notebooks for now until we hook up Appwrite Database
  const mockNotebooks = [
    { id: '1', title: 'Personal Diary', lastEdited: '2 hours ago', pages: 12 },
    { id: '2', title: 'Meeting Notes', lastEdited: 'Yesterday', pages: 4 },
    { id: '3', title: 'Project Ideas', lastEdited: '3 days ago', pages: 8 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <Book className="text-white" size={16} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            NoteCraft
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.name || user?.email || 'User'}
          </span>
          <button 
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-red-600"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Notebooks</h1>
          <button 
            onClick={() => navigate('/editor/new/page1')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Notebook</span>
          </button>
        </div>

        {/* Notebooks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockNotebooks.map(notebook => (
            <div 
              key={notebook.id}
              onClick={() => navigate(`/editor/${notebook.id}/page1`)}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Book size={24} />
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={18} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{notebook.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {notebook.lastEdited}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>{notebook.pages} pages</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
