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
          <span className="logo-icon">⌂</span>
          <span className="logo-text">Floor Plan Studio</span>
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
