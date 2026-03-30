import { useCallback, useState, useEffect, useRef } from 'react';
import { useAppState } from '../hooks/useAppState';
import { usePersistence } from '../hooks/usePersistence';
import { useAuth } from '../hooks/useAuth';
import { createShare } from '../lib/api';
import { exportAsPng, exportAsPdf } from '../utils/export';
import type { CanvasHandle } from './Canvas';
import type Konva from 'konva';

export function Toolbar({ projectId, canvasRef }: { projectId?: string | null; canvasRef?: React.RefObject<CanvasHandle | null> }) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useAppState();
  const { exportLayout, importLayout } = usePersistence();
  const { user, isGuest } = useAuth();
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeFloorPlan = state.floorPlans.find(fp => fp.id === state.activeFloorPlanId);
  const ppf = activeFloorPlan?.pixelsPerFoot ?? null;
  const hasSelection = state.exportSelection.rect != null && state.toolMode === 'export-select';

  const setMode = useCallback((mode: typeof state.toolMode) => {
    dispatch({ type: 'SET_TOOL_MODE', payload: mode });
  }, [dispatch]);

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  // When selection rect is finalized, re-show the export menu
  useEffect(() => {
    if (state.toolMode === 'export-select' && state.exportSelection.rect && !state.exportSelection.start) {
      setShowExportMenu(true);
    }
  }, [state.toolMode, state.exportSelection.rect, state.exportSelection.start]);

  const getExportContext = useCallback(() => {
    const stage = canvasRef?.current?.stage;
    const floorImg = canvasRef?.current?.floorImage;
    const name = activeFloorPlan?.name ?? 'Floor Plan';
    return { stage, floorImg, name };
  }, [canvasRef, activeFloorPlan]);

  const getFullRegion = useCallback((_stage: Konva.Stage, floorImg: HTMLImageElement) => {
    // Deselect furniture to hide transformer handles
    dispatch({ type: 'SELECT_FURNITURE', payload: null });
    // Use floor image bounds as the export region
    return { x: 0, y: 0, width: floorImg.width, height: floorImg.height };
  }, [dispatch]);

  const handleExportPng = useCallback(() => {
    const { stage, floorImg, name } = getExportContext();
    if (!stage || !floorImg) return;
    const region = getFullRegion(stage, floorImg);
    // Allow re-render to hide transformer, then export
    setTimeout(() => { exportAsPng(stage, region, name); setShowExportMenu(false); }, 50);
  }, [getExportContext, getFullRegion]);

  const handleExportPdf = useCallback(() => {
    const { stage, floorImg, name } = getExportContext();
    if (!stage || !floorImg) return;
    const region = getFullRegion(stage, floorImg);
    setTimeout(() => { exportAsPdf(stage, region, name); setShowExportMenu(false); }, 50);
  }, [getExportContext, getFullRegion]);

  const handleSelectRegion = useCallback(() => {
    dispatch({ type: 'CLEAR_EXPORT_SELECTION' });
    dispatch({ type: 'SET_TOOL_MODE', payload: 'export-select' });
    setShowExportMenu(false);
  }, [dispatch]);

  const handleSelectionExportPng = useCallback(() => {
    const { stage, name } = getExportContext();
    const rect = state.exportSelection.rect;
    if (!stage || !rect) return;
    // Clear selection overlay + deselect furniture before capture
    dispatch({ type: 'SELECT_FURNITURE', payload: null });
    dispatch({ type: 'CLEAR_EXPORT_SELECTION' });
    setTimeout(() => {
      exportAsPng(stage, rect, name);
      setShowExportMenu(false);
    }, 50);
  }, [getExportContext, state.exportSelection.rect, dispatch]);

  const handleSelectionExportPdf = useCallback(() => {
    const { stage, name } = getExportContext();
    const rect = state.exportSelection.rect;
    if (!stage || !rect) return;
    // Clear selection overlay + deselect furniture before capture
    dispatch({ type: 'SELECT_FURNITURE', payload: null });
    dispatch({ type: 'CLEAR_EXPORT_SELECTION' });
    setTimeout(() => {
      exportAsPdf(stage, rect, name);
      setShowExportMenu(false);
    }, 50);
  }, [getExportContext, state.exportSelection.rect, dispatch]);

  const handleCancelSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_EXPORT_SELECTION' });
    setShowExportMenu(false);
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
        <button
          className={`tool-btn ${state.toolMode === 'style' ? 'active' : ''}`}
          onClick={() => setMode('style')}
          title="Style Visualizer (R)"
        >
          <span className="tool-icon">🎨</span>
          <span className="tool-label">Style</span>
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
        <div className="export-menu-container" ref={exportMenuRef}>
          <button
            className={`tool-btn ${showExportMenu ? 'active' : ''}`}
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export"
          >
            <span className="tool-icon">💾</span>
            <span className="tool-label">Export</span>
          </button>
          {showExportMenu && (
            <div className="export-dropdown">
              {hasSelection ? (
                <>
                  <div className="export-dropdown-header">Export Selection</div>
                  <button className="export-dropdown-item" onClick={handleSelectionExportPng}>
                    📷 Export as PNG
                  </button>
                  <button className="export-dropdown-item" onClick={handleSelectionExportPdf}>
                    📄 Export as PDF
                  </button>
                  <div className="export-dropdown-divider" />
                  <button className="export-dropdown-item" onClick={handleCancelSelection}>
                    ✕ Cancel selection
                  </button>
                </>
              ) : (
                <>
                  <div className="export-dropdown-header">Export Image</div>
                  <button className="export-dropdown-item" onClick={handleExportPng} disabled={!activeFloorPlan}>
                    📷 Current plan as PNG
                  </button>
                  <button className="export-dropdown-item" onClick={handleExportPdf} disabled={!activeFloorPlan}>
                    📄 Current plan as PDF
                  </button>
                  <button className="export-dropdown-item" onClick={handleSelectRegion} disabled={!activeFloorPlan}>
                    ✂️ Select region…
                  </button>
                  <div className="export-dropdown-divider" />
                  <div className="export-dropdown-header">Export Data</div>
                  <button className="export-dropdown-item" onClick={() => { exportLayout(); setShowExportMenu(false); }}>
                    💾 Export as JSON
                  </button>
                </>
              )}
            </div>
          )}
        </div>
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
