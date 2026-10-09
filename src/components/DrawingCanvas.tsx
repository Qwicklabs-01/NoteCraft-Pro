/* eslint-disable */
import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { setCurrentTool, setStrokeWidth, setColor } from '../store/toolSlice';
import { savePageContent } from '../store/notebookSlice';

interface DrawingCanvasProps {
  pageId: string;
  width: number;
  height: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ pageId, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const dispatch = useAppDispatch();
  
  const currentTool = useAppSelector(state => state.tool.currentTool);
  const strokeWidth = useAppSelector(state => state.tool.strokeWidth);
  const color = useAppSelector(state => state.tool.color);
  
  const [isDrawing, setIsDrawing] = useState(false);
  
  useEffect(() => {
    if (canvasRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        isDrawingMode: true,
        backgroundColor: '#ffffff',
      });
      
      const canvas = fabricRef.current;
      
      // Set brush properties
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = color;
      
      // Event listeners
      canvas.on('path:created', (e) => {
        dispatch(savePageContent({ pageId, content: canvas.toJSON() }));
      });
      
      canvas.on('mouse:down', () => setIsDrawing(true));
      canvas.on('mouse:up', () => setIsDrawing(false));
      
      return () => {
        canvas.dispose();
      };
    }
  }, [pageId, width, height]);
  
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
  
  const addImage = (imageUrl: string) => {
    if (!fabricRef.current) return;
    
    fabric.Image.fromURL(imageUrl, (img) => {
      img.set({ left: 100, top: 100 });
      img.scaleToWidth(300);
      fabricRef.current?.add(img);
      dispatch(savePageContent({ pageId, content: fabricRef.current?.toJSON() }));
    });
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
    <div className="canvas-container">
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

