
import React, { useRef, useState } from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';

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
    { name: 'none', value: 'none' },
    { name: 'grayscale', value: 'grayscale(100%)' },
    { name: 'sepia', value: 'sepia(100%)' },
    { name: 'blur', value: 'blur(3px)' },
    { name: 'sharpen', value: 'contrast(150%) brightness(110%)' },
  ];
  
  const handleCrop = () => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.getCanvas();
      const croppedImage = croppedCanvas.toDataURL('image/png');
      applyFilters(croppedImage);
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
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${filter}`;
        ctx.drawImage(img, 0, 0);
        const filteredImage = canvas.toDataURL('image/png');
        onEditComplete(filteredImage);
      }
    };
  };
  
  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFilter('none');
  };
  
  return (
    <div className="image-editor-modal">
      <div className="editor-content">
        <div className="cropper-container">
          <Cropper
            ref={cropperRef}
            src={imageUrl}
            stencilProps={{ aspectRatio: 0 }}
            className="cropper"
          />
        </div>
        
        <div className="editor-controls">
          <div className="filter-controls">
            <h4>Filters</h4>
            <div className="filter-buttons">
              {filters.map((f) => (
                <button
                  key={f.name}
                  className={`filter-btn ${filter === f.value ? 'active' : ''}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="adjustment-controls">
            <h4>Adjustments</h4>
            
            <label>Brightness: {brightness}%</label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
            />
            
            <label>Contrast: {contrast}%</label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
            />
            
            <label>Saturation: {saturation}%</label>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
            />
          </div>
          
          <div className="editor-actions">
            <button onClick={resetFilters}>Reset</button>
            <button onClick={handleCrop}>Apply & Crop</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;

