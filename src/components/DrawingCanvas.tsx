
import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { savePageContent } from '../store/notebookSlice';
import { databases, DATABASE_ID, NOTEBOOKS_COLLECTION_ID } from '../appwriteClient';

interface DrawingCanvasProps {
  notebookId?: string;
  pageId: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ notebookId, pageId }) => {
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
    
    // Debounce save function
    let saveTimeout: NodeJS.Timeout;
    const saveToAppwrite = () => {
      if (!notebookId || !DATABASE_ID || !NOTEBOOKS_COLLECTION_ID) return;
      
      const jsonContent = JSON.stringify(canvas.toJSON());
      // Still save to Redux just in case
      dispatch(savePageContent({ pageId, content: canvas.toJSON() }));
      
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        try {
          await databases.updateDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId, {
            content: jsonContent,
            lastEdited: new Date().toISOString()
          });
        } catch (e) {
          console.error('Failed to save to Appwrite:', e);
        }
      }, 1000); // 1s debounce
    };

    // Load from Appwrite on mount
    const loadFromAppwrite = async () => {
      if (!notebookId || !DATABASE_ID || !NOTEBOOKS_COLLECTION_ID) return;
      try {
        const doc = await databases.getDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId);
        if (doc.content) {
          canvas.loadFromJSON(JSON.parse(doc.content), () => {
            canvas.renderAll();
          });
        }
      } catch (e) {
        console.error('Failed to load from Appwrite:', e);
      }
    };
    loadFromAppwrite();
    
    // Event listeners
    canvas.on('path:created', saveToAppwrite);
    canvas.on('object:modified', saveToAppwrite);
    canvas.on('object:added', saveToAppwrite);
    
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
  }, [notebookId, pageId, color, dispatch, strokeWidth]);
  
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
      // object:added event handles the save
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
    // object:added handles save
  };
  

  
  const undo = () => {
    if (!fabricRef.current) return;
    const objects = fabricRef.current.getObjects();
    if (objects.length > 0) {
      fabricRef.current.remove(objects[objects.length - 1]);
      // The canvas.on('object:modified') or similar isn't triggered by remove() natively
      // so we manually trigger a save here, or just let object:removed trigger it if we added it.
      // But we can just use our existing Redux action temporarily for instant UI sync, 
      // while Appwrite catches up via a manual save call:
      const jsonContent = JSON.stringify(fabricRef.current.toJSON());
      dispatch(savePageContent({ pageId, content: fabricRef.current.toJSON() }));
      
      if (notebookId && DATABASE_ID && NOTEBOOKS_COLLECTION_ID) {
        databases.updateDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId, {
          content: jsonContent,
          lastEdited: new Date().toISOString()
        });
      }
    }
  };
  
  const clearCanvas = () => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.setBackgroundColor('#ffffff', () => {});
    
    const jsonContent = JSON.stringify(fabricRef.current.toJSON());
    dispatch(savePageContent({ pageId, content: fabricRef.current.toJSON() }));
    
    if (notebookId && DATABASE_ID && NOTEBOOKS_COLLECTION_ID) {
      databases.updateDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId, {
        content: jsonContent,
        lastEdited: new Date().toISOString()
      });
    }
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

