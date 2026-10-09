
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DrawingCanvas from '../components/DrawingCanvas';
import ToolPanel from '../components/ToolPanel';
import { exportToMSWord, shareViaWeb } from '../utils/ExportUtils';
import { useAppSelector } from '../hooks/useStore';
import { ArrowLeft, FileText, Share2 } from 'lucide-react';

const Editor = () => {
  const { notebookId, pageId } = useParams();
  const navigate = useNavigate();
  
  // Mock title for now
  const notebookTitle = `Notebook ${notebookId || 'Draft'}`;
  
  // Extract text content from the current page to export to word
  const pages = useAppSelector(state => state.notebook.pages);
  const currentPage = pages.find(p => p.id === pageId);
  
  const handleExportWord = () => {
    // Basic text extraction from Fabric JSON
    let textContent = "My Notebook Content\n\n";
    if (currentPage && currentPage.content && currentPage.content.objects) {
      // Find all text objects in the canvas JSON
      const textObjects = currentPage.content.objects.filter((obj) => obj.type === 'i-text' || obj.type === 'text');
      if (textObjects.length > 0) {
        textContent += textObjects.map((obj) => obj.text).join('\n\n');
      } else {
        textContent += "(No text elements found on this canvas. Sketches cannot be exported to text-only Word docs yet.)";
      }
    } else {
      textContent += "(Canvas is empty)";
    }
    
    exportToMSWord(`${notebookTitle} - Page ${pageId || '1'}`, textContent);
  };

  const handleShare = () => {
    shareViaWeb(
      `${notebookTitle} - Page ${pageId || '1'}`, 
      "Check out my latest sketches on NoteCraft Pro!", 
      window.location.href
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      {/* Top Toolbar */}
      <header className="min-h-[4rem] pt-[env(safe-area-inset-top)] bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Page Editor</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportWord}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium transition-colors"
          >
            <FileText size={18} />
            <span className="hidden sm:inline">Export to Word</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors"
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden relative">
        {/* Tool Panel (Bottom on Mobile, Left on Desktop) */}
        <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-r border-gray-200 bg-white shadow-sm z-10 shrink-0 overflow-y-auto order-last sm:order-first pb-[env(safe-area-inset-bottom)] sm:pb-0 h-48 sm:h-auto">
          <ToolPanel />
        </div>
        
        {/* Center: Canvas Area */}
        <div className="flex-1 bg-gray-100 overflow-auto relative flex justify-center p-4 sm:p-8">
          {/* Canvas Wrapper */}
          <div className="bg-white shadow-md ring-1 ring-gray-200 rounded-sm w-full max-w-[800px] aspect-[4/5] sm:aspect-auto sm:h-full">
            <DrawingCanvas pageId={pageId || 'default-page'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
