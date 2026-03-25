import { useCallback, useRef, useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../hooks/useAuth';
import { uploadFloorPlanImage } from '../lib/storage';
import { v4 as uuid } from 'uuid';

export function FloorPlanLoader() {
  const { state, dispatch } = useAppState();
  const { user, isGuest } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const id = uuid();
        dispatch({
          type: 'ADD_FLOOR_PLAN',
          payload: {
            id,
            name,
            imageUrl: url,
            pixelsPerFoot: null,
            calibrationPoints: null,
            calibrationDistanceFt: null,
          },
        });
        // Upload to Supabase Storage in background for authenticated users
        if (user && !isGuest) {
          uploadFloorPlanImage(file, user.id)
            .then(path => dispatch({ type: 'UPDATE_FLOOR_PLAN', payload: { id, updates: { imagePath: path } } }))
            .catch(err => console.error('Failed to upload floor plan image:', err));
        }
      });
    },
    [dispatch, user, isGuest]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="floor-plan-loader">
      {/* Floor plan tabs */}
      {state.floorPlans.length > 0 && (
        <div className="floor-tabs">
          {state.floorPlans.map(fp => (
            <div
              key={fp.id}
              className={`floor-tab ${fp.id === state.activeFloorPlanId ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_FLOOR_PLAN', payload: fp.id })}
            >
              {editingId === fp.id ? (
                <input
                  className="floor-tab-name-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const trimmed = editValue.trim();
                      if (trimmed) {
                        dispatch({ type: 'UPDATE_FLOOR_PLAN', payload: { id: fp.id, updates: { name: trimmed } } });
                      }
                      setEditingId(null);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  onBlur={() => {
                    const trimmed = editValue.trim();
                    if (trimmed) {
                      dispatch({ type: 'UPDATE_FLOOR_PLAN', payload: { id: fp.id, updates: { name: trimmed } } });
                    }
                    setEditingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span
                  className="floor-tab-name"
                  onDoubleClick={e => {
                    e.stopPropagation();
                    setEditingId(fp.id);
                    setEditValue(fp.name);
                  }}
                >
                  {fp.name}
                </span>
              )}
              {fp.pixelsPerFoot && <span className="floor-tab-cal">✓</span>}
              <button
                className="floor-tab-close"
                onClick={e => {
                  e.stopPropagation();
                  dispatch({ type: 'REMOVE_FLOOR_PLAN', payload: fp.id });
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="floor-tab add-tab"
            onClick={() => fileInputRef.current?.click()}
            title="Add floor plan"
          >
            +
          </button>
        </div>
      )}

      {/* Drop zone (when no plans loaded) */}
      {state.floorPlans.length === 0 && (
        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-zone-content">
            <div className="drop-zone-icon">🏠</div>
            <div className="drop-zone-title">Drop floor plan images here</div>
            <div className="drop-zone-sub">or click to browse</div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
