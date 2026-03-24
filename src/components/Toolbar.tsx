import { useCallback, useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { usePersistence } from '../hooks/usePersistence';
import { useAuth } from '../hooks/useAuth';
import { createShare } from '../lib/api';

export function Toolbar({ projectId }: { projectId?: string | null }) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useAppState();
  const { exportLayout, importLayout } = usePersistence();
  const { user, isGuest } = useAuth();
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const activeFloorPlan = state.floorPlans.find(fp => fp.id === state.activeFloorPlanId);
  const ppf = activeFloorPlan?.pixelsPerFoot ?? null;

  const setMode = useCallback((mode: typeof state.toolMode) => {
    dispatch({ type: 'SET_TOOL_MODE', payload: mode });
  }, [dispatch]);

  const handleShare = useCallback(async () => {
    if (!projectId) return;
    try {
      const token = await createShare(projectId);
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setShareStatus('Link copied!');
      setTimeout(() => setShareStatus(null), 2000);
    } catch {
      setShareStatus('Failed to create link');
      setTimeout(() => setShareStatus(null), 2000);
    }
  }, [projectId]);

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={`tool-btn ${state.toolMode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
          title="Select / Pan (V)"
        >
          <span className="tool-icon">↖</span>
          <span className="tool-label">Select</span>
        </button>
        <button
          className={`tool-btn ${state.toolMode === 'measure' ? 'active' : ''}`}
          onClick={() => setMode('measure')}
          disabled={!ppf}
          title="Measure (M)"
        >
          <span className="tool-icon">📏</span>
          <span className="tool-label">Measure</span>
        </button>
        <button
          className={`tool-btn ${state.toolMode === 'draw-polygon' ? 'active' : ''}`}
          onClick={() => setMode('draw-polygon')}
          disabled={!ppf}
          title="Draw Polygon (P)"
        >
          <span className="tool-icon">✏️</span>
          <span className="tool-label">Draw</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className={`tool-btn ${state.showGrid ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
          title="Toggle Grid (G)"
        >
          <span className="tool-icon">#</span>
          <span className="tool-label">Grid</span>
        </button>
        <button
          className={`tool-btn ${state.snapToGrid ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
          disabled={!ppf}
          title="Snap to Grid (S)"
        >
          <span className="tool-icon">⊞</span>
          <span className="tool-label">Snap</span>
        </button>

        <select
          className="grid-size-select"
          value={state.gridSizeIn}
          onChange={e => dispatch({ type: 'SET_GRID_SIZE', payload: Number(e.target.value) })}
          title="Grid size"
        >
          <option value={6}>6"</option>
          <option value={12}>1 ft</option>
          <option value={24}>2 ft</option>
          <option value={36}>3 ft</option>
        </select>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="tool-btn" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)">
          <span className="tool-icon">↩</span>
          <span className="tool-label">Undo</span>
        </button>
        <button className="tool-btn" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)">
          <span className="tool-icon">↪</span>
          <span className="tool-label">Redo</span>
        </button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        {user && !isGuest && projectId && (
          <button className="tool-btn" onClick={handleShare} title="Share Project">
            <span className="tool-icon">🔗</span>
            <span className="tool-label">{shareStatus ?? 'Share'}</span>
          </button>
        )}
        <button className="tool-btn" onClick={exportLayout} title="Export Layout">
          <span className="tool-icon">💾</span>
          <span className="tool-label">Export</span>
        </button>
        <label className="tool-btn" title="Import Layout">
          <span className="tool-icon">📂</span>
          <span className="tool-label">Import</span>
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && importLayout(e.target.files[0])}
          />
        </label>
      </div>
    </div>
  );
}
