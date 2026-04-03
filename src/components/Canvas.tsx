import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Rect, Group } from 'react-konva';
import Konva from 'konva';
import { useAppState } from '../hooks/useAppState';
import { FurnitureItem } from './FurnitureItem';
import { inchesToPixels, pixelDistance, formatFeetInches, snapToGridValue } from '../utils/geometry';
import { v4 as uuid } from 'uuid';
import type { PlacedFurniture } from '../types';

export interface CanvasHandle {
  stage: Konva.Stage | null;
  floorImage: HTMLImageElement | null;
}

export const Canvas = forwardRef<CanvasHandle>(function Canvas(_props, ref) {
  const { state, dispatch } = useAppState();
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const placementFeedbackTimerRef = useRef<number | null>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const [justPlacedId, setJustPlacedId] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    get stage() { return stageRef.current; },
    get floorImage() { return floorImage; },
  }), [floorImage]);

  const activeFloorPlan = state.floorPlans.find(fp => fp.id === state.activeFloorPlanId);
  const ppf = activeFloorPlan?.pixelsPerFoot ?? null;

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load floor plan image
  useEffect(() => {
    if (!activeFloorPlan?.imageUrl) {
      setFloorImage(null);
      return;
    }
    const img = new window.Image();
    img.src = activeFloorPlan.imageUrl;
    img.onload = () => setFloorImage(img);
  }, [activeFloorPlan?.imageUrl]);

  useEffect(() => {
    return () => {
      if (placementFeedbackTimerRef.current !== null) {
        window.clearTimeout(placementFeedbackTimerRef.current);
      }
    };
  }, []);

  // Fit image when first loaded
  useEffect(() => {
    if (!floorImage) return;
    const scaleX = dims.width / floorImage.width;
    const scaleY = dims.height / floorImage.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    dispatch({ type: 'SET_STAGE_SCALE', payload: scale });
    dispatch({
      type: 'SET_STAGE_POS',
      payload: {
        x: (dims.width - floorImage.width * scale) / 2,
        y: (dims.height - floorImage.height * scale) / 2,
      },
    });
  }, [floorImage, dims, dispatch]);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const oldScale = state.stageScale;
      const zoomFactor = e.evt.deltaY < 0 ? 1.08 : 1 / 1.08;
      const newScale = Math.max(0.05, Math.min(10, oldScale * zoomFactor));

      const mousePointTo = {
        x: (pointer.x - state.stagePos.x) / oldScale,
        y: (pointer.y - state.stagePos.y) / oldScale,
      };

      dispatch({ type: 'SET_STAGE_SCALE', payload: newScale });
      dispatch({
        type: 'SET_STAGE_POS',
        payload: {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        },
      });
    },
    [state.stageScale, state.stagePos, dispatch]
  );

  // Convert stage pointer to image coordinates
  const pointerToImageCoords = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - state.stagePos.x) / state.stageScale,
      y: (pointer.y - state.stagePos.y) / state.stageScale,
    };
  }, [state.stagePos, state.stageScale]);

  // Stage click handler
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = pointerToImageCoords();
      if (!pos) return;

      // Calibration mode
      if (state.toolMode === 'calibrate') {
        if (state.calibration.points.length < 2) {
          dispatch({ type: 'ADD_CALIBRATION_POINT', payload: pos });
        }
        return;
      }

      // Measure mode
      if (state.toolMode === 'measure') {
        dispatch({ type: 'ADD_MEASURE_POINT', payload: pos });
        return;
      }

      // Draw polygon mode
      if (state.toolMode === 'draw-polygon') {
        dispatch({ type: 'ADD_DRAW_VERTEX', payload: pos });
        return;
      }

      // Place furniture mode
      if (state.toolMode === 'place' && state.placingPreset && ppf) {
        const w = inchesToPixels(state.placingPreset.widthIn, ppf);
        const h = inchesToPixels(state.placingPreset.depthIn, ppf);
        const newItem: PlacedFurniture = {
          id: uuid(),
          presetId: state.placingPreset.id,
          name: state.placingPreset.name,
          x: pos.x - w / 2,
          y: pos.y - h / 2,
          widthPx: w,
          heightPx: h,
          rotation: 0,
          color: state.placingPreset.color,
          shape: state.placingPreset.shape,
          vertices: state.placingPreset.vertices,
          floorPlanId: state.activeFloorPlanId!,
          locked: false,
        };
        dispatch({ type: 'ADD_FURNITURE', payload: newItem });
        setJustPlacedId(newItem.id);
        if (placementFeedbackTimerRef.current !== null) {
          window.clearTimeout(placementFeedbackTimerRef.current);
        }
        placementFeedbackTimerRef.current = window.setTimeout(() => {
          setJustPlacedId(null);
          placementFeedbackTimerRef.current = null;
        }, 320);
        // Keep placing mode so user can place more
        return;
      }

      // Select mode – click on empty space deselects
      if (state.toolMode === 'select') {
        const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs.id === 'floor-image';
        if (clickedOnEmpty) {
          dispatch({ type: 'SELECT_FURNITURE', payload: null });
        }
      }
    },
    [state.toolMode, state.calibration.points.length, state.placingPreset, ppf, state.activeFloorPlanId, pointerToImageCoords, dispatch]
  );

  // Double-click to close polygon
  const handleDblClick = useCallback(() => {
    if (state.toolMode === 'draw-polygon' && state.drawPolygon.vertices.length >= 3 && ppf && state.activeFloorPlanId) {
      const verts = state.drawPolygon.vertices;
      const xs = verts.map(v => v.x);
      const ys = verts.map(v => v.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const w = maxX - minX;
      const h = maxY - minY;

      // Normalize vertices relative to bounding box (0–1 range) for storage
      const normalizedVerts = verts.flatMap(v => [(v.x - minX) / (w || 1), (v.y - minY) / (h || 1)]);

      const newItem: PlacedFurniture = {
        id: uuid(),
        presetId: null,
        name: 'Custom Shape',
        x: minX,
        y: minY,
        widthPx: w,
        heightPx: h,
        rotation: 0,
        color: '#9E6B8B',
        shape: 'polygon',
        vertices: normalizedVerts,
        floorPlanId: state.activeFloorPlanId,
        locked: false,
      };
      dispatch({ type: 'ADD_FURNITURE', payload: newItem });
      dispatch({ type: 'FINISH_DRAW_POLYGON' });
    }
  }, [state.toolMode, state.drawPolygon.vertices, ppf, state.activeFloorPlanId, dispatch]);

  // Grid lines
  const gridLines = [];
  if (state.showGrid && ppf && floorImage) {
    const gridPx = inchesToPixels(state.gridSizeIn, ppf);
    if (gridPx > 3) { // don't render if too small
      const maxX = floorImage.width;
      const maxY = floorImage.height;
      for (let x = 0; x < maxX; x += gridPx) {
        gridLines.push(
          <Line key={`gv-${x}`} points={[x, 0, x, maxY]} stroke="rgba(100,140,180,0.15)" strokeWidth={0.5} listening={false} />
        );
      }
      for (let y = 0; y < maxY; y += gridPx) {
        gridLines.push(
          <Line key={`gh-${y}`} points={[0, y, maxX, y]} stroke="rgba(100,140,180,0.15)" strokeWidth={0.5} listening={false} />
        );
      }
    }
  }

  // Calibration markers
  const calMarkers = state.calibration.points.map((p, i) => (
    <Group key={`cal-${i}`}>
      <Circle x={p.x} y={p.y} radius={6 / state.stageScale} fill="#FF4444" stroke="#fff" strokeWidth={2 / state.stageScale} />
      <Text x={p.x + 10 / state.stageScale} y={p.y - 8 / state.stageScale} text={`P${i + 1}`} fontSize={14 / state.stageScale} fill="#FF4444" fontStyle="bold" />
    </Group>
  ));
  if (state.calibration.points.length === 2) {
    const [a, b] = state.calibration.points;
    calMarkers.push(
      <Line key="cal-line" points={[a.x, a.y, b.x, b.y]} stroke="#FF4444" strokeWidth={2 / state.stageScale} dash={[6 / state.stageScale, 4 / state.stageScale]} />
    );
  }

  // Measure markers
  const measureMarkers = state.measure.points.map((p, i) => (
    <Group key={`msr-${i}`}>
      <Circle x={p.x} y={p.y} radius={5 / state.stageScale} fill="#00AAFF" stroke="#fff" strokeWidth={2 / state.stageScale} />
    </Group>
  ));
  if (state.measure.points.length === 2 && ppf) {
    const [a, b] = state.measure.points;
    const distPx = pixelDistance(a, b);
    const distFt = distPx / ppf;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    measureMarkers.push(
      <Line key="msr-line" points={[a.x, a.y, b.x, b.y]} stroke="#00AAFF" strokeWidth={2 / state.stageScale} dash={[6 / state.stageScale, 4 / state.stageScale]} />,
      <Rect key="msr-bg" x={midX - 40 / state.stageScale} y={midY - 14 / state.stageScale} width={80 / state.stageScale} height={20 / state.stageScale} fill="rgba(0,0,0,0.7)" cornerRadius={4 / state.stageScale} />,
      <Text key="msr-text" x={midX - 36 / state.stageScale} y={midY - 10 / state.stageScale} text={formatFeetInches(distFt)} fontSize={13 / state.stageScale} fill="#00AAFF" fontStyle="bold" />
    );
  }

  // Draw polygon preview
  const polygonPreview = [];
  if (state.drawPolygon.vertices.length > 0) {
    const flatPts = state.drawPolygon.vertices.flatMap(v => [v.x, v.y]);
    polygonPreview.push(
      <Line key="poly-lines" points={flatPts} stroke="#E040FB" strokeWidth={2 / state.stageScale} dash={[5 / state.stageScale, 3 / state.stageScale]} />
    );
    state.drawPolygon.vertices.forEach((v, i) =>
      polygonPreview.push(
        <Circle key={`pv-${i}`} x={v.x} y={v.y} radius={5 / state.stageScale} fill="#E040FB" stroke="#fff" strokeWidth={1.5 / state.stageScale} />
      )
    );
  }

  // Furniture items for current floor
  const currentFurniture = state.furniture.filter(f => f.floorPlanId === state.activeFloorPlanId);

  // Snap helper
  const snapPos = useCallback(
    (x: number, y: number) => {
      if (!state.snapToGrid || !ppf) return { x, y };
      const gridPx = inchesToPixels(state.gridSizeIn, ppf);
      return { x: snapToGridValue(x, gridPx), y: snapToGridValue(y, gridPx) };
    },
    [state.snapToGrid, state.gridSizeIn, ppf]
  );

  // Cursor style
  const cursorStyle =
    state.toolMode === 'calibrate' ? 'crosshair' :
    state.toolMode === 'measure' ? 'crosshair' :
    state.toolMode === 'draw-polygon' ? 'crosshair' :
    state.toolMode === 'export-select' ? 'crosshair' :
    state.toolMode === 'place' ? 'cell' :
    'default';

  // Export selection rect drawing
  const handleMouseDown = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (state.toolMode !== 'export-select') return;
      const pos = pointerToImageCoords();
      if (!pos) return;
      dispatch({ type: 'SET_EXPORT_SELECTION', payload: { start: pos, rect: null } });
    },
    [state.toolMode, pointerToImageCoords, dispatch]
  );

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (state.toolMode !== 'export-select' || !state.exportSelection.start) return;
      const pos = pointerToImageCoords();
      if (!pos) return;
      const s = state.exportSelection.start;
      dispatch({
        type: 'SET_EXPORT_SELECTION',
        payload: {
          start: s,
          rect: {
            x: Math.min(s.x, pos.x),
            y: Math.min(s.y, pos.y),
            width: Math.abs(pos.x - s.x),
            height: Math.abs(pos.y - s.y),
          },
        },
      });
    },
    [state.toolMode, state.exportSelection.start, pointerToImageCoords, dispatch]
  );

  const handleMouseUp = useCallback(() => {
    if (state.toolMode !== 'export-select') return;
    // Selection is finalized — toolbar will read it from state
    // Just clear the start point so we stop tracking
    if (state.exportSelection.rect) {
      dispatch({
        type: 'SET_EXPORT_SELECTION',
        payload: { start: null, rect: state.exportSelection.rect },
      });
    }
  }, [state.toolMode, state.exportSelection.rect, dispatch]);

  // Selection rectangle overlay
  const selectionOverlay = state.exportSelection.rect && state.toolMode === 'export-select' ? (
    <Rect
      x={state.exportSelection.rect.x}
      y={state.exportSelection.rect.y}
      width={state.exportSelection.rect.width}
      height={state.exportSelection.rect.height}
      stroke="#E9C46A"
      strokeWidth={2 / state.stageScale}
      dash={[8 / state.stageScale, 4 / state.stageScale]}
      fill="rgba(233, 196, 106, 0.1)"
      listening={false}
    />
  ) : null;

  return (
    <div ref={containerRef} className="canvas-container" style={{ cursor: cursorStyle }}>
      {!activeFloorPlan && (
        <div className="canvas-empty">
          <div className="canvas-empty-icon">🏡</div>
          <div className="canvas-empty-title">Welcome home.</div>
          <div className="canvas-empty-sub">Drop a floor plan image to start planning your space</div>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={dims.width}
        height={dims.height}
        x={state.stagePos.x}
        y={state.stagePos.y}
        scaleX={state.stageScale}
        scaleY={state.stageScale}
        draggable={state.toolMode === 'select' && !state.selectedFurnitureId}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            dispatch({ type: 'SET_STAGE_POS', payload: { x: e.target.x(), y: e.target.y() } });
          }
        }}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
      >
        {/* Floor plan image layer */}
        <Layer>
          {floorImage && (
            <KonvaImage
              id="floor-image"
              image={floorImage}
              x={0}
              y={0}
              width={floorImage.width}
              height={floorImage.height}
              listening={true}
            />
          )}
        </Layer>

        {/* Grid layer */}
        <Layer listening={false}>{gridLines}</Layer>

        {/* Furniture layer */}
        <Layer>
          {currentFurniture.map(item => (
            <FurnitureItem
              key={item.id}
              item={item}
              isSelected={state.selectedFurnitureId === item.id}
              isJustPlaced={justPlacedId === item.id}
              snapPos={snapPos}
              stageScale={state.stageScale}
            />
          ))}
        </Layer>

        {/* Overlay layer (calibration, measure, draw, export selection) */}
        <Layer listening={false}>
          {calMarkers}
          {measureMarkers}
          {polygonPreview}
          {selectionOverlay}
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="zoom-indicator">
        {Math.round(state.stageScale * 100)}%
      </div>
    </div>
  );
});
