import React from 'react';
import { exportToPDF, exportToPNG, exportToMSWord, shareViaWeb } from '../utils/ExportUtils';
import { FileText, Image as ImageIcon, Share2, FileDown, X } from 'lucide-react';

interface PDFExporterProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  currentPageDataUrl?: string;
  allPageDataUrls?: string[];
  textContent?: string;
}

const PDFExporter: React.FC<PDFExporterProps> = ({
  title,
  isOpen,
  onClose,
  currentPageDataUrl,
  allPageDataUrls = [],
  textContent = '',
}) => {
  if (!isOpen) return null;

  const handleExportPDF = () => {
    const urls = allPageDataUrls.length > 0 ? allPageDataUrls : (currentPageDataUrl ? [currentPageDataUrl] : []);
    exportToPDF(title, urls, textContent);
    onClose();
  };

  const handleExportPNG = () => {
    if (currentPageDataUrl) {
      exportToPNG(title, currentPageDataUrl, 1);
    }
    onClose();
  };

  const handleExportWord = () => {
    exportToMSWord(title, textContent || '(Digital notes and sketches from NoteCraft Pro)', currentPageDataUrl);
    onClose();
  };

  const handleShare = () => {
    shareViaWeb(title, 'Check out my notes on NoteCraft Pro!', window.location.href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export & Share</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Export your notes and artwork in professional formats compatible with Google Drive and Microsoft Office.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl font-medium transition-all"
          >
            <FileDown size={20} />
            <div className="text-left">
              <div className="font-semibold">Export as PDF</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">High-resolution multi-page document</div>
            </div>
          </button>

          <button
            onClick={handleExportWord}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl font-medium transition-all"
          >
            <FileText size={20} />
            <div className="text-left">
              <div className="font-semibold">Export to MS Word (.docx)</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Includes embedded sketches and text</div>
            </div>
          </button>

          <button
            onClick={handleExportPNG}
            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl font-medium transition-all"
          >
            <ImageIcon size={20} />
            <div className="text-left">
              <div className="font-semibold">Export as PNG Image</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Lossless graphic snapshot</div>
            </div>
          </button>

          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl font-medium transition-all"
          >
            <Share2 size={20} />
            <div className="text-left">
              <div className="font-semibold">Share via Telegram / Web</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Direct link or native share menu</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExporter;
