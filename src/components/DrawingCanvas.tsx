import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useAppSelector, useAppDispatch } from '../hooks/useStore';
import { setUndoRedoState, type ToolType, type PaperStyle } from '../store/toolSlice';
import { savePageContent as saveToStore } from '../store/notebookSlice';
import { savePageContent as saveToStorage, getNotebook } from '../services/notebookStorage';
import { useAuth } from '../contexts/AuthContext';
import ImageEditor from './ImageEditor';
import { triggerHaptic } from '../utils/telegram';

interface DrawingCanvasProps {
  notebookId?: string;
  pageId: string;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
}

// Helper to convert hex color to rgba with opacity
const hexToRgba = (hex: string, alpha: number) => {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(79, 70, 229, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Create canvas background pattern for paper style
const createPaperPattern = (style: PaperStyle, isDark: boolean = false) => {
  const pCanvas = document.createElement('canvas');
  const ctx = pCanvas.getContext('2d');
  if (!ctx) return '#ffffff';

  const lineColor = isDark ? '#334155' : '#e2e8f0';
  const bgColor = isDark ? '#0f172a' : '#ffffff';

  if (style === 'grid') {
    const size = 30;
    pCanvas.width = size;
    pCanvas.height = size;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size - 0.5, 0);
    ctx.lineTo(size - 0.5, size);
    ctx.moveTo(0, size - 0.5);
    ctx.lineTo(size, size - 0.5);
    ctx.stroke();
    return new fabric.Pattern({ source: pCanvas, repeat: 'repeat' });
  }

  if (style === 'lined') {
    const height = 32;
    pCanvas.width = 100;
    pCanvas.height = height;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 100, height);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(100, height - 0.5);
    ctx.stroke();
    return new fabric.Pattern({ source: pCanvas, repeat: 'repeat' });
  }

  if (style === 'dots') {
    const size = 26;
    pCanvas.width = size;
    pCanvas.height = size;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 1.25, 0, Math.PI * 2);
    ctx.fill();
    return new fabric.Pattern({ source: pCanvas, repeat: 'repeat' });
  }

  return bgColor;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ notebookId, pageId, onCanvasReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const currentTool = useAppSelector(state => state.tool.currentTool);
  const strokeWidth = useAppSelector(state => state.tool.strokeWidth);
  const color = useAppSelector(state => state.tool.color);
  const paperStyle = useAppSelector(state => state.tool.paperStyle);
  const actionTrigger = useAppSelector(state => state.tool.actionTrigger);

  // Undo / Redo history stacks
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUpdatingHistoryRef = useRef<boolean>(false);

  // Image editing modal state
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  // Save changes to storage (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pushHistory = useCallback(() => {
    if (!fabricRef.current || isUpdatingHistoryRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    
    // Truncate redo stack if new action occurs
    const nextIndex = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex);
    historyRef.current.push(json);
    historyIndexRef.current = nextIndex;

    dispatch(setUndoRedoState({
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    }));
  }, [dispatch]);

  const scheduleSave = useCallback(() => {
    if (!fabricRef.current || !notebookId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const canvas = fabricRef.current;
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const json = JSON.stringify(canvas.toJSON());
        const thumbnail = canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 });

        dispatch(saveToStore({ pageId, content: canvas.toJSON() }));
        await saveToStorage(notebookId, pageId, json, user?.$id || 'guest', thumbnail);
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    }, 800);
  }, [notebookId, pageId, dispatch, user]);

  // Apply paper style background
  const applyPaperBackground = useCallback((canvas: fabric.Canvas, style: PaperStyle) => {
    const isDark = document.documentElement.classList.contains('dark');
    const pattern = createPaperPattern(style, isDark);
    canvas.setBackgroundColor(pattern, () => {
      canvas.renderAll();
    });
  }, []);

  // Configure active tool on fabric canvas
  const updateToolMode = useCallback((canvas: fabric.Canvas, tool: ToolType, stroke: number, strokeColor: string) => {
    if (!canvas) return;

    // Reset default modes
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';

    if (tool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.forEachObject(o => { o.selectable = true; });
    } else if (tool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = stroke;
      canvas.freeDrawingBrush.color = strokeColor;
    } else if (tool === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = Math.max(1, stroke - 1);
      canvas.freeDrawingBrush.color = hexToRgba(strokeColor, 0.75);
    } else if (tool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.width = Math.max(16, stroke * 3);
      canvas.freeDrawingBrush.color = hexToRgba(strokeColor, 0.35);
    } else if (tool === 'eraser') {
      // Modern smart eraser: tapping or dragging on objects deletes them
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
    }
  }, []);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;

    // Initial canvas dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 1000;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: true,
      preserveObjectStacking: true,
      enableRetinaScaling: true,
    });
    fabricRef.current = canvas;

    applyPaperBackground(canvas, paperStyle);
    updateToolMode(canvas, currentTool, strokeWidth, color);

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    // Load initial content from storage
    const loadContent = async () => {
      if (!notebookId) return;
      try {
        const notebook = await getNotebook(notebookId, user?.$id || 'guest');
        if (notebook) {
          const page = notebook.pages.find(p => p.id === pageId);
          if (page && page.content) {
            isUpdatingHistoryRef.current = true;
            canvas.loadFromJSON(JSON.parse(page.content), () => {
              applyPaperBackground(canvas, notebook.paperStyle || paperStyle);
              canvas.renderAll();
              isUpdatingHistoryRef.current = false;

              // Save initial state to history
              historyRef.current = [JSON.stringify(canvas.toJSON())];
              historyIndexRef.current = 0;
              dispatch(setUndoRedoState({ canUndo: false, canRedo: false }));
            });
            return;
          }
        }

        // Empty canvas initial state
        const initialJson = JSON.stringify(canvas.toJSON());
        historyRef.current = [initialJson];
        historyIndexRef.current = 0;
        dispatch(setUndoRedoState({ canUndo: false, canRedo: false }));
      } catch (err) {
        console.error('Error loading canvas page:', err);
      }
    };

    loadContent();

    // Event listeners
    const handleAction = () => {
      if (!isUpdatingHistoryRef.current) {
        pushHistory();
        scheduleSave();
      }
    };

    canvas.on('path:created', handleAction);
    canvas.on('object:modified', handleAction);
    canvas.on('object:added', () => {
      if (!isUpdatingHistoryRef.current) {
        pushHistory();
        scheduleSave();
      }
    });

    // Object eraser handling
    canvas.on('mouse:down', (e) => {
      if (fabricRef.current && currentTool === 'eraser' && e.target) {
        triggerHaptic('light');
        fabricRef.current.remove(e.target);
        fabricRef.current.renderAll();
        pushHistory();
        scheduleSave();
      }
    });

    // Handle touch move eraser
    canvas.on('mouse:move', (e) => {
      if (fabricRef.current && currentTool === 'eraser' && e.e && (e.e.buttons === 1 || ('touches' in e.e && e.e.touches.length > 0))) {
        if (e.target) {
          fabricRef.current.remove(e.target);
          fabricRef.current.renderAll();
          scheduleSave();
        }
      }
    });

    // Responsive auto-resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (fabricRef.current) {
          const newW = entry.contentRect.width;
          const newH = entry.contentRect.height;
          if (newW > 0 && newH > 0) {
            fabricRef.current.setWidth(newW);
            fabricRef.current.setHeight(newH);
            applyPaperBackground(fabricRef.current, paperStyle);
            fabricRef.current.renderAll();
          }
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [notebookId, pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tool / Style change reaction
  useEffect(() => {
    if (fabricRef.current) {
      updateToolMode(fabricRef.current, currentTool, strokeWidth, color);
    }
  }, [currentTool, strokeWidth, color, updateToolMode]);

  // Paper style change reaction
  useEffect(() => {
    if (fabricRef.current) {
      applyPaperBackground(fabricRef.current, paperStyle);
    }
  }, [paperStyle, applyPaperBackground]);

  // Handle Action Triggers (Undo, Redo, Clear, Insert Shapes, Insert Text, Insert Image)
  useEffect(() => {
    if (!actionTrigger || !fabricRef.current) return;
    const canvas = fabricRef.current;

    switch (actionTrigger.type) {
      case 'undo': {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
          const prevJson = historyRef.current[historyIndexRef.current];
          isUpdatingHistoryRef.current = true;
          canvas.loadFromJSON(JSON.parse(prevJson), () => {
            applyPaperBackground(canvas, paperStyle);
            canvas.renderAll();
            isUpdatingHistoryRef.current = false;
            dispatch(setUndoRedoState({
              canUndo: historyIndexRef.current > 0,
              canRedo: historyIndexRef.current < historyRef.current.length - 1,
            }));
            scheduleSave();
          });
        }
        break;
      }

      case 'redo': {
        if (historyIndexRef.current < historyRef.current.length - 1) {
          historyIndexRef.current += 1;
          const nextJson = historyRef.current[historyIndexRef.current];
          isUpdatingHistoryRef.current = true;
          canvas.loadFromJSON(JSON.parse(nextJson), () => {
            applyPaperBackground(canvas, paperStyle);
            canvas.renderAll();
            isUpdatingHistoryRef.current = false;
            dispatch(setUndoRedoState({
              canUndo: historyIndexRef.current > 0,
              canRedo: historyIndexRef.current < historyRef.current.length - 1,
            }));
            scheduleSave();
          });
        }
        break;
      }

      case 'clear': {
        canvas.clear();
        applyPaperBackground(canvas, paperStyle);
        pushHistory();
        scheduleSave();
        break;
      }

      case 'insertShape': {
        const shapeType = actionTrigger.payload?.shapeType || 'rectangle';
        const center = canvas.getCenter();
        const options = {
          left: center.left - 50,
          top: center.top - 50,
          fill: hexToRgba(color, 0.15),
          stroke: color,
          strokeWidth: Math.max(2, strokeWidth),
        };

        let shape: fabric.Object | null = null;
        if (shapeType === 'rectangle') {
          shape = new fabric.Rect({ ...options, width: 140, height: 90, rx: 8, ry: 8 });
        } else if (shapeType === 'circle') {
          shape = new fabric.Circle({ ...options, radius: 50 });
        } else if (shapeType === 'triangle') {
          shape = new fabric.Triangle({ ...options, width: 120, height: 100 });
        } else if (shapeType === 'line') {
          shape = new fabric.Line([center.left - 80, center.top, center.left + 80, center.top], {
            stroke: color,
            strokeWidth: Math.max(2, strokeWidth),
          });
        }

        if (shape) {
          canvas.add(shape);
          canvas.setActiveObject(shape);
          canvas.renderAll();
          pushHistory();
          scheduleSave();
        }
        break;
      }

      case 'insertText': {
        const center = canvas.getCenter();
        const text = new fabric.IText('Tap to type note...', {
          left: center.left - 100,
          top: center.top - 20,
          fontFamily: 'Inter, sans-serif',
          fontSize: 22,
          fill: color,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        canvas.renderAll();
        pushHistory();
        scheduleSave();
        break;
      }

      case 'insertImage': {
        fileInputRef.current?.click();
        break;
      }

      case 'zoomIn': {
        const zoom = Math.min(canvas.getZoom() * 1.2, 5);
        canvas.setZoom(zoom);
        canvas.renderAll();
        break;
      }

      case 'zoomOut': {
        const zoom = Math.max(canvas.getZoom() / 1.2, 0.5);
        canvas.setZoom(zoom);
        canvas.renderAll();
        break;
      }

      case 'zoomReset': {
        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.renderAll();
        break;
      }
    }
  }, [actionTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle local image selection from device or camera
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPendingImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add edited image onto canvas
  const handleInsertImageComplete = (editedDataUrl: string) => {
    setPendingImageUrl(null);
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;

    fabric.Image.fromURL(editedDataUrl, (img) => {
      const center = canvas.getCenter();
      const maxDim = Math.min(canvas.getWidth() * 0.6, 400);

      if (img.width && img.height) {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        img.scale(scale);
      }

      img.set({
        left: center.left - (img.getScaledWidth() / 2),
        top: center.top - (img.getScaledHeight() / 2),
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      pushHistory();
      scheduleSave();
    });
  };

  return (
    <div 
      className="relative w-full h-full select-none overflow-hidden touch-none"
      ref={containerRef}
      style={{ touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="touch-none" />

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Image Cropper and Filter Modal */}
      {pendingImageUrl && (
        <ImageEditor
          imageUrl={pendingImageUrl}
          onEditComplete={handleInsertImageComplete}
          onClose={() => setPendingImageUrl(null)}
        />
      )}
    </div>
  );
};

export default DrawingCanvas;
