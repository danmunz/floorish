import { useEffect, useCallback } from 'react';
import { AppProvider, useAppState } from './hooks/useAppState';
import { Canvas } from './components/Canvas';
import { FurniturePalette } from './components/FurniturePalette';
import { CalibrationPanel } from './components/CalibrationPanel';
import { FloorPlanLoader } from './components/FloorPlanLoader';
import { Toolbar } from './components/Toolbar';
import './App.css';

function AppInner() {
  const { state, dispatch, undo, redo } = useAppState();

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Undo / Redo
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
      if (meta && e.key === 'y') { e.preventDefault(); redo(); return; }

      // Don't intercept if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;

      // Delete selected furniture
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedFurnitureId) {
        dispatch({ type: 'REMOVE_FURNITURE', payload: state.selectedFurnitureId });
        return;
      }

      // Duplicate
      if (meta && e.key === 'd' && state.selectedFurnitureId) {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE_FURNITURE', payload: state.selectedFurnitureId });
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'Escape') { dispatch({ type: 'SET_TOOL_MODE', payload: 'select' }); return; }
      if (e.key === 'm') { dispatch({ type: 'SET_TOOL_MODE', payload: 'measure' }); return; }
      if (e.key === 'p') { dispatch({ type: 'SET_TOOL_MODE', payload: 'draw-polygon' }); return; }
      if (e.key === 'g') { dispatch({ type: 'TOGGLE_GRID' }); return; }
      if (e.key === 's' && !meta) { dispatch({ type: 'TOGGLE_SNAP' }); return; }
    },
    [state.selectedFurnitureId, dispatch, undo, redo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Drop handler for the main area
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (!files.length) return;
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const id = crypto.randomUUID();
        dispatch({
          type: 'ADD_FLOOR_PLAN',
          payload: { id, name, imageUrl: url, pixelsPerFoot: null, calibrationPoints: null, calibrationDistanceFt: null },
        });
      });
    },
    [dispatch]
  );

  return (
    <div className="app" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
      <header className="app-header">
        <div className="app-logo">
          <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L4 20h6v20h28V20h6L24 4z" fill="#264653" stroke="#264653" strokeWidth="2" strokeLinejoin="round"/>
            <line x1="10" y1="28" x2="38" y2="28" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
            <line x1="10" y1="34" x2="38" y2="34" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
            <line x1="18" y1="20" x2="18" y2="40" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
            <line x1="30" y1="20" x2="30" y2="40" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
            <path d="M24 14c3 2 5 6 4 10-2-1-5-3-6-6 1 3 1 6-1 9-2-3-3-7-1-10-3 2-6 2-8 0 3-1 6-1 9 0-2-2-3-5-1-8 2 2 4 4 4 5z" fill="#7A8B52" opacity="0.9"/>
            <circle cx="24" cy="16" r="2.5" fill="#E9C46A"/>
          </svg>
          <span className="logo-text">Floorish</span>
        </div>
        <FloorPlanLoader />
      </header>

      <Toolbar />

      <div className="app-body">
        <aside className="sidebar">
          <CalibrationPanel />
          <FurniturePalette />
        </aside>
        <main className="main-canvas">
          <Canvas />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
