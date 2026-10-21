import React, { useRef, useState } from 'react';
import { Cropper, type CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { X, Check, RotateCcw, Sliders } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onEditComplete: (editedImage: string) => void;
  onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onEditComplete, onClose }) => {
  const cropperRef = useRef<CropperRef>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState('none');

  const filters = [
    { name: 'Normal', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Warm', value: 'sepia(40%) saturate(140%)' },
    { name: 'Cool', value: 'hue-rotate(180deg) saturate(110%)' },
    { name: 'Punch', value: 'contrast(140%) saturate(130%)' },
  ];

  const handleApply = () => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.getCanvas();
      if (!croppedCanvas) {
        onEditComplete(imageUrl);
        return;
      }
      const croppedImage = croppedCanvas.toDataURL('image/png');
      applyFilters(croppedImage);
    } else {
      applyFilters(imageUrl);
    }
  };

  const applyFilters = (imageData: string) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${filter === 'none' ? '' : filter}`;
        ctx.drawImage(img, 0, 0);
        const filteredImage = canvas.toDataURL('image/png');
        onEditComplete(filteredImage);
      } else {
        onEditComplete(imageData);
      }
    };
    img.onerror = () => {
      onEditComplete(imageData);
    };
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFilter('none');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-w-4xl w-full max-h-[92vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Crop & Edit Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Cropper Viewport */}
          <div className="flex-1 bg-gray-950 flex items-center justify-center p-4 min-h-[260px] max-h-[50vh] md:max-h-full overflow-hidden">
            <Cropper
              ref={cropperRef}
              src={imageUrl}
              className="max-h-full max-w-full"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            />
          </div>

          {/* Controls Sidebar */}
          <div className="w-full md:w-80 p-5 bg-gray-50 dark:bg-gray-900/50 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 overflow-y-auto space-y-5">
            {/* Filter Presets */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                Color Filters
              </label>
              <div className="grid grid-cols-3 gap-2">
                {filters.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all truncate ${
                      filter === f.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Adjustments
              </label>

              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Brightness</span>
                  <span className="font-semibold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Contrast</span>
                  <span className="font-semibold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Saturation</span>
                  <span className="font-semibold">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={resetFilters}
              type="button"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw size={14} />
              Reset adjustments
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-indigo-200 dark:hover:shadow-none transition-all active:scale-95"
          >
            <Check size={16} />
            Insert to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
