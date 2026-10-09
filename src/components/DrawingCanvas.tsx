
import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { savePageContent } from '../store/notebookSlice';

interface DrawingCanvasProps {
  pageId: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ pageId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const dispatch = useAppDispatch();
  
  const currentTool = useAppSelector(state => state.tool.currentTool);
  const strokeWidth = useAppSelector(state => state.tool.strokeWidth);
  const color = useAppSelector(state => state.tool.color);
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Initialize canvas with container dimensions
    const container = containerRef.current;
    
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      isDrawingMode: true,
      backgroundColor: '#ffffff',
    });
    
    const canvas = fabricRef.current;
    
    // Set brush properties
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = strokeWidth;
    canvas.freeDrawingBrush.color = color;
    
    // Event listeners
    canvas.on('path:created', () => {
      dispatch(savePageContent({ pageId, content: canvas.toJSON() }));
    });
    
    // Responsive Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (canvas) {
          canvas.setWidth(entry.contentRect.width);
          canvas.setHeight(entry.contentRect.height);
          canvas.renderAll();
        }
      }
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
    };
  }, [pageId, color, dispatch, strokeWidth]);
  
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.freeDrawingBrush.width = strokeWidth;
    }
  }, [strokeWidth]);
  
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.freeDrawingBrush.color = color;
    }
  }, [color]);
  
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.isDrawingMode = currentTool === 'pen' || currentTool === 'pencil' || currentTool === 'highlighter';
    }
  }, [currentTool]);
  
  const addShape = (shapeType: string) => {
    if (!fabricRef.current) return;
    
    let shape;
    const options = {
      left: 100,
      top: 100,
      fill: color,
      stroke: color,
      strokeWidth: 2,
    };
    
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({ ...options, width: 100, height: 100 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...options, radius: 50 });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...options, width: 100, height: 100 });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 200], { ...options });
        break;
    }
    
    if (shape) {
      fabricRef.current.add(shape);
      dispatch(savePageContent({ pageId, content: fabricRef.current.toJSON() }));
    }
  };
  
  const addText = (text: string) => {
    if (!fabricRef.current) return;
    
    const textbox = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontFamily: 'Inter',
      fill: color,
      fontSize: 24,
    });
    
    fabricRef.current.add(textbox);
    dispatch(savePageContent({ pageId, content: fabricRef.current.toJSON() }));
  };
  

  
  const undo = () => {
    if (!fabricRef.current) return;
    const objects = fabricRef.current.getObjects();
    if (objects.length > 0) {
      fabricRef.current.remove(objects[objects.length - 1]);
      dispatch(savePageContent({ pageId, content: fabricRef.current.toJSON() }));
    }
  };
  
  const clearCanvas = () => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.setBackgroundColor('#ffffff', () => {});
    dispatch(savePageContent({ pageId, content: fabricRef.current.toJSON() }));
  };
  
  return (
    <div className="canvas-container w-full h-full" ref={containerRef}>
      <canvas ref={canvasRef} />
      <div className="canvas-controls">
        <button onClick={() => addShape('rectangle')}>Rectangle</button>
        <button onClick={() => addShape('circle')}>Circle</button>
        <button onClick={() => addShape('triangle')}>Triangle</button>
        <button onClick={() => addShape('line')}>Line</button>
        <button onClick={() => addText('Text')}>Add Text</button>
        <button onClick={undo}>Undo</button>
        <button onClick={clearCanvas}>Clear</button>
      </div>
    </div>
  );
};

export default DrawingCanvas;

