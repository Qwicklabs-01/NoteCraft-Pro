import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Book, Clock, MoreVertical, LogOut, Loader2 } from 'lucide-react';
import { databases, DATABASE_ID, NOTEBOOKS_COLLECTION_ID } from '../appwriteClient';
import { ID, Query } from 'appwrite';
import type { Models } from 'appwrite';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notebooks, setNotebooks] = React.useState<Models.Document[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchNotebooks = async () => {
      if (!user?.$id || !DATABASE_ID || !NOTEBOOKS_COLLECTION_ID) return;
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          NOTEBOOKS_COLLECTION_ID,
          [Query.equal('userId', user.$id), Query.orderDesc('lastEdited')]
        );
        setNotebooks(response.documents);
      } catch (error) {
        console.error('Error fetching notebooks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotebooks();
  }, [user]);

  const createNewNotebook = async () => {
    if (!user?.$id || !DATABASE_ID || !NOTEBOOKS_COLLECTION_ID) return;
    try {
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        NOTEBOOKS_COLLECTION_ID,
        ID.unique(),
        {
          title: 'Untitled Notebook',
          userId: user.$id,
          content: '',
          lastEdited: new Date().toISOString()
        }
      );
      navigate(`/editor/${newDoc.$id}/page1`);
    } catch (error) {
      console.error('Error creating notebook:', error);
    }
  };
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
            onClick={createNewNotebook}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
            disabled={loading}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Notebook</span>
          </button>
        </div>

        {/* Notebooks Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : notebooks.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No notebooks yet.</p>
            <p className="mt-2">Click "New Notebook" to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notebooks.map(notebook => (
              <div 
                key={notebook.$id}
                onClick={() => navigate(`/editor/${notebook.$id}/page1`)}
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
                    {new Date(notebook.lastEdited).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
