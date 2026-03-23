import { useState, useMemo, useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';
import { furniturePresets, categories } from '../data/furniturePresets';
import type { FurniturePreset } from '../types';
import { pixelsToInches, formatFeetInches } from '../utils/geometry';

export function FurniturePalette() {
  const { state, dispatch } = useAppState();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customW, setCustomW] = useState('');
  const [customD, setCustomD] = useState('');
  const [editingPreset, setEditingPreset] = useState<FurniturePreset | null>(null);

  const activeFloorPlan = state.floorPlans.find(fp => fp.id === state.activeFloorPlanId);
  const ppf = activeFloorPlan?.pixelsPerFoot ?? null;

  const filtered = useMemo(() => {
    let items = furniturePresets;
    if (activeCategory) items = items.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return items;
  }, [search, activeCategory]);

  const handleSelectPreset = useCallback((preset: FurniturePreset) => {
    if (!ppf) return;
    setEditingPreset(preset);
    setCustomW(String(preset.widthIn));
    setCustomD(String(preset.depthIn));
  }, [ppf]);

  const handlePlace = useCallback(() => {
    if (!editingPreset) return;
    const w = parseFloat(customW) || editingPreset.widthIn;
    const d = parseFloat(customD) || editingPreset.depthIn;
    dispatch({
      type: 'SET_PLACING_PRESET',
      payload: { ...editingPreset, widthIn: w, depthIn: d },
    });
    setEditingPreset(null);
  }, [editingPreset, customW, customD, dispatch]);

  const handleCancelPlace = useCallback(() => {
    dispatch({ type: 'SET_PLACING_PRESET', payload: null });
  }, [dispatch]);

  // Selected furniture info
  const selectedItem = state.furniture.find(f => f.id === state.selectedFurnitureId);

  return (
    <div className="palette">
      <div className="palette-header">
        <h2>Furniture</h2>
      </div>

      {!ppf && (
        <div className="palette-notice">
          <span className="palette-notice-icon">⚠</span>
          Calibrate the floor plan first to place furniture at correct scale.
        </div>
      )}

      {/* Placing mode indicator */}
      {state.toolMode === 'place' && state.placingPreset && (
        <div className="placing-indicator">
          <div className="placing-indicator-text">
            Click on the floor plan to place:<br />
            <strong>{state.placingPreset.name}</strong>
            <span className="placing-dims">
              {state.placingPreset.widthIn}" × {state.placingPreset.depthIn}"
            </span>
          </div>
          <button className="btn-sm btn-cancel" onClick={handleCancelPlace}>Cancel</button>
        </div>
      )}

      {/* Dimension editor for selected preset */}
      {editingPreset && state.toolMode !== 'place' && (
        <div className="preset-editor">
          <div className="preset-editor-name">{editingPreset.name}</div>
          <div className="dim-inputs">
            <label>
              W<input type="number" value={customW} onChange={e => setCustomW(e.target.value)} min="1" step="1" />"
            </label>
            <span className="dim-x">×</span>
            <label>
              D<input type="number" value={customD} onChange={e => setCustomD(e.target.value)} min="1" step="1" />"
            </label>
          </div>
          <div className="preset-editor-actions">
            <button className="btn-sm btn-primary" onClick={handlePlace} disabled={!ppf}>Place</button>
            <button className="btn-sm btn-ghost" onClick={() => setEditingPreset(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        className="palette-search"
        type="text"
        placeholder="Search furniture..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Category tabs */}
      <div className="category-tabs">
        <button
          className={`cat-tab ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset list */}
      <div className="preset-list">
        {filtered.map(preset => (
          <button
            key={preset.id}
            className={`preset-item ${editingPreset?.id === preset.id ? 'active' : ''}`}
            onClick={() => handleSelectPreset(preset)}
            disabled={!ppf}
            title={`${preset.widthIn}" × ${preset.depthIn}"`}
          >
            <span
              className="preset-swatch"
              style={{ background: preset.color }}
            />
            <span className="preset-name">{preset.name}</span>
            <span className="preset-dims">{preset.widthIn}×{preset.depthIn}"</span>
          </button>
        ))}
      </div>

      {/* Selected furniture details */}
      {selectedItem && (
        <SelectedFurniturePanel item={selectedItem} ppf={ppf} />
      )}
    </div>
  );
}

function SelectedFurniturePanel({ item, ppf }: { item: import('../types').PlacedFurniture; ppf: number | null }) {
  const { dispatch } = useAppState();

  const widthIn = ppf ? pixelsToInches(item.widthPx, ppf) : 0;
  const depthIn = ppf ? pixelsToInches(item.heightPx, ppf) : 0;

  return (
    <div className="selected-panel">
      <div className="selected-panel-header">
        <h3>Selected</h3>
        <button className="btn-icon" onClick={() => dispatch({ type: 'SELECT_FURNITURE', payload: null })} title="Deselect">✕</button>
      </div>
      <div className="selected-name">
        <input
          type="text"
          value={item.name}
          onChange={e => dispatch({ type: 'UPDATE_FURNITURE', payload: { id: item.id, updates: { name: e.target.value } } })}
          className="name-input"
        />
      </div>
      {ppf && (
        <div className="selected-dims">
          {formatFeetInches(widthIn / 12)} × {formatFeetInches(depthIn / 12)}
          <span className="selected-dims-inches">({Math.round(widthIn)}" × {Math.round(depthIn)}")</span>
        </div>
      )}
      <div className="selected-rotation">
        Rotation: {Math.round(item.rotation)}°
      </div>
      <div className="selected-actions">
        <button className="btn-sm btn-ghost" onClick={() => dispatch({ type: 'DUPLICATE_FURNITURE', payload: item.id })}>
          Duplicate
        </button>
        <button className="btn-sm btn-ghost" onClick={() => dispatch({ type: 'UPDATE_FURNITURE', payload: { id: item.id, updates: { locked: !item.locked } } })}>
          {item.locked ? '🔒 Unlock' : '🔓 Lock'}
        </button>
        <button className="btn-sm btn-danger" onClick={() => dispatch({ type: 'REMOVE_FURNITURE', payload: item.id })}>
          Delete
        </button>
      </div>
    </div>
  );
}
