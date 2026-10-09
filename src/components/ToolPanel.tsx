import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useStore';
import { setCurrentTool, setStrokeWidth, setColor } from '../store/toolSlice';
import { Pen, Pencil, Highlighter, Eraser, Square, Circle, Type, Image } from 'lucide-react';
import ColorPicker from './common/ColorPicker';

const tools = [
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'pencil', icon: Pencil, label: 'Pencil' },
  { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: Image, label: 'Image' },
];

const ToolPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTool = useAppSelector(state => state.tool.currentTool);
  const strokeWidth = useAppSelector(state => state.tool.strokeWidth);
  const color = useAppSelector(state => state.tool.color);
  
  const handleToolSelect = (toolId: string) => {
    dispatch(setCurrentTool(toolId));
  };
  
  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setStrokeWidth(parseInt(e.target.value)));
  };
  
  const handleColorChange = (newColor: string) => {
    dispatch(setColor(newColor));
  };
  
  return (
    <div className="tool-panel">
      <div className="tools-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`tool-button ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolSelect(tool.id)}
            title={tool.label}
          >
            <tool.icon size={24} />
          </button>
        ))}
      </div>
      
      <div className="tool-settings">
        <label>Stroke Width: {strokeWidth}px</label>
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={handleStrokeWidthChange}
          className="stroke-slider"
        />
        
        <label>Color</label>
        <ColorPicker value={color} onChange={handleColorChange} />
      </div>
      
      <div className="tool-presets">
        <h4>Quick Colors</h4>
        <div className="color-presets">
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((c) => (
            <button
              key={c}
              className="color-preset"
              style={{ backgroundColor: c }}
              onClick={() => handleColorChange(c)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolPanel;
