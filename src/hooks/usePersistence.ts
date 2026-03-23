import { useCallback, useEffect } from 'react';
import { useAppState } from './useAppState';

const STORAGE_KEY = 'floorplan-planner-state';

export function usePersistence() {
  const { state, dispatch } = useAppState();

  // Save to localStorage whenever furniture or calibration changes
  useEffect(() => {
    const data = {
      furniture: state.furniture,
      floorPlans: state.floorPlans.map(fp => ({
        ...fp,
        // Don't persist the objectURL – user needs to re-upload images
        imageUrl: '',
      })),
      showGrid: state.showGrid,
      gridSizeIn: state.gridSizeIn,
      snapToGrid: state.snapToGrid,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // quota exceeded or similar – silently ignore
    }
  }, [state.furniture, state.floorPlans, state.showGrid, state.gridSizeIn, state.snapToGrid]);

  const exportLayout = useCallback(() => {
    const data = {
      furniture: state.furniture,
      floorPlans: state.floorPlans.map(fp => ({ ...fp, imageUrl: '' })),
      showGrid: state.showGrid,
      gridSizeIn: state.gridSizeIn,
      snapToGrid: state.snapToGrid,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importLayout = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        dispatch({ type: 'LOAD_STATE', payload: data });
      } catch {
        console.error('Failed to parse layout file');
      }
    };
    reader.readAsText(file);
  }, [dispatch]);

  return { exportLayout, importLayout };
}
