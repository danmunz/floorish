import { useRef, useEffect, useCallback } from 'react';
import { Group, Rect, Ellipse, Line, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useAppState } from '../hooks/useAppState';
import type { PlacedFurniture } from '../types';
import { snapAngle, calculateLabelFontSize } from '../utils/geometry';

interface Props {
  item: PlacedFurniture;
  isSelected: boolean;
  isJustPlaced: boolean;
  snapPos: (x: number, y: number) => { x: number; y: number };
  stageScale: number;
}

export function FurnitureItem({ item, isSelected, isJustPlaced, snapPos, stageScale }: Props) {
  const { state, dispatch } = useAppState();
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, item.widthPx, item.heightPx, item.rotation]);

  useEffect(() => {
    if (!isJustPlaced || !groupRef.current) return;

    const node = groupRef.current;
    node.scale({ x: 0.92, y: 0.92 });
    node.opacity(0.65);

    const tween = new Konva.Tween({
      node,
      duration: 0.22,
      easing: Konva.Easings.EaseOut,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });

    tween.play();

    return () => {
      tween.destroy();
      node.scale({ x: 1, y: 1 });
      node.opacity(1);
    };
  }, [isJustPlaced]);

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const { x, y } = snapPos(e.target.x(), e.target.y());
      dispatch({ type: 'UPDATE_FURNITURE', payload: { id: item.id, updates: { x, y } } });
    },
    [dispatch, item.id, snapPos]
  );

  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    // Reset scale on node, apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const rotation = snapAngle(node.rotation(), 15);

    dispatch({
      type: 'UPDATE_FURNITURE',
      payload: {
        id: item.id,
        updates: {
          x: node.x(),
          y: node.y(),
          widthPx: Math.max(5, item.widthPx * scaleX),
          heightPx: Math.max(5, item.heightPx * scaleY),
          rotation,
        },
      },
    });
  }, [dispatch, item.id, item.widthPx, item.heightPx]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (state.toolMode !== 'select') return;
      e.cancelBubble = true;
      dispatch({ type: 'SELECT_FURNITURE', payload: item.id });
    },
    [dispatch, item.id, state.toolMode]
  );

  // Build shape
  const strokeW = Math.max(1, 1.5 / stageScale);
  let shape;
  if (item.shape === 'polygon' && item.vertices) {
    const scaled = [];
    for (let i = 0; i < item.vertices.length; i += 2) {
      scaled.push(item.vertices[i] * item.widthPx);
      scaled.push(item.vertices[i + 1] * item.heightPx);
    }
    shape = (
      <Line
        points={scaled}
        closed
        fill={item.color + '55'}
        stroke={item.color}
        strokeWidth={strokeW}
      />
    );
  } else if (item.shape === 'ellipse') {
    shape = (
      <Ellipse
        x={item.widthPx / 2}
        y={item.heightPx / 2}
        radiusX={item.widthPx / 2}
        radiusY={item.heightPx / 2}
        fill={item.color + '55'}
        stroke={item.color}
        strokeWidth={strokeW}
      />
    );
  } else {
    shape = (
      <Rect
        width={item.widthPx}
        height={item.heightPx}
        fill={item.color + '55'}
        stroke={item.color}
        strokeWidth={strokeW}
        cornerRadius={2}
      />
    );
  }

  const isEllipse = item.shape === 'ellipse';
  const labelPadX = 8;
  const labelPadY = 4;
  const availW = Math.max(1, (isEllipse ? item.widthPx * 0.7 : item.widthPx) - labelPadX);
  const availH = Math.max(1, (isEllipse ? item.heightPx * 0.7 : item.heightPx) - labelPadY);
  const baseFontSize = calculateLabelFontSize(item.name, availW, availH);
  const labelFontSize = baseFontSize > 0 ? Math.max(baseFontSize, 10 / stageScale) : 0;
  const showLabel = labelFontSize > 0 || isSelected;
  const labelBoxX = isEllipse ? item.widthPx * 0.15 : labelPadX / 2;
  const labelBoxY = isEllipse ? item.heightPx * 0.15 : labelPadY / 2;

  // Clamp scale-compensated transformer values to prevent them from growing
  // absurdly large at low zoom or vanishing at high zoom.
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const trBorderWidth = clamp(1.5 / stageScale, 0.5, 4);
  const trAnchorStroke = clamp(1.5 / stageScale, 0.5, 4);
  const trAnchorSize = clamp(8 / stageScale, 4, 16);
  const trAnchorRadius = clamp(2 / stageScale, 1, 4);
  const trRotateOffset = clamp(20 / stageScale, 10, 40);

  return (
    <>
      <Group
        ref={groupRef}
        x={item.x}
        y={item.y}
        rotation={item.rotation}
        draggable={state.toolMode === 'select' && !item.locked}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onClick={handleClick}

      >
        {shape}
        {showLabel && (
          <Text
            text={item.name}
            x={labelBoxX}
            y={labelBoxY}
            width={availW}
            height={availH}
            fontSize={labelFontSize > 0 ? labelFontSize : 10 / stageScale}
            fill={item.color}
            fontFamily="'DM Sans', sans-serif"
            fontStyle="600"
            align="center"
            verticalAlign="middle"
            listening={false}
            wrap="word"
            ellipsis
          />
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={!item.locked}
          rotationSnaps={Array.from({ length: 24 }, (_, i) => i * 15)}
          rotationSnapTolerance={10}
          enabledAnchors={item.locked ? [] : [
            'top-left', 'top-right', 'bottom-left', 'bottom-right',
            'middle-left', 'middle-right', 'top-center', 'bottom-center',
          ]}
          borderStroke="#264653"
          borderStrokeWidth={trBorderWidth}
          anchorFill="#E9C46A"
          anchorStroke="#264653"
          anchorStrokeWidth={trAnchorStroke}
          anchorSize={trAnchorSize}
          anchorCornerRadius={trAnchorRadius}
          rotateAnchorOffset={trRotateOffset}
          rotateAnchorCursor="grab"
          padding={4}
          boundBoxFunc={(_oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return _oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}
