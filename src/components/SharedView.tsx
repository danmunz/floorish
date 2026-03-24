import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Line, Text as KonvaText, Rect, Group } from 'react-konva';
import {
  fetchProjectByShareToken,
  fetchFloorPlans,
  fetchFurniture,
  dbFloorPlanToApp,
  dbFurnitureToApp,
} from '../lib/api';
import { getFloorPlanImageUrl } from '../lib/storage';
import type { FloorPlan, PlacedFurniture } from '../types';

export function SharedView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [furniture, setFurniture] = useState<PlacedFurniture[]>([]);
  const [activeFpId, setActiveFpId] = useState<string | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load shared project data
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const shareData = await fetchProjectByShareToken(token);
        if (!shareData) {
          setError('This share link is invalid or has expired.');
          setLoading(false);
          return;
        }

        const project = shareData.projects as unknown as Record<string, unknown>;
        setProjectName(project.name as string);

        const fpRows = await fetchFloorPlans(shareData.project_id);
        const fps = await Promise.all(
          fpRows.map(async (row: Record<string, unknown>) => {
            const imageUrl = row.image_path
              ? (await getFloorPlanImageUrl(row.image_path as string)) ?? ''
              : '';
            return dbFloorPlanToApp(row, imageUrl);
          })
        );
        setFloorPlans(fps);
        setActiveFpId(fps[0]?.id ?? null);

        const allFurniture = (
          await Promise.all(
            fpRows.map((fp: Record<string, unknown>) => fetchFurniture(fp.id as string))
          )
        )
          .flat()
          .map((row: Record<string, unknown>) => dbFurnitureToApp(row));
        setFurniture(allFurniture);
      } catch (err) {
        console.error(err);
        setError('Failed to load shared project.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setStageSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load floor plan image
  const activeFp = floorPlans.find((fp) => fp.id === activeFpId);
  useEffect(() => {
    if (!activeFp?.imageUrl) {
      setFloorImage(null);
      return;
    }
    const img = new window.Image();
    img.src = activeFp.imageUrl;
    img.onload = () => setFloorImage(img);
  }, [activeFp?.imageUrl]);

  const activeFurniture = furniture.filter((f) => f.floorPlanId === activeFpId);

  if (loading) {
    return (
      <div className="shared-view">
        <div className="auth-loading">
          <div className="auth-spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-view">
        <div className="shared-error">
          <h2>Oops!</h2>
          <p>{error}</p>
          <a href="/" className="btn-primary">
            Create your own with Floorish
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-view">
      <header className="shared-header">
        <div className="app-logo">
          <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L4 20h6v20h28V20h6L24 4z" fill="#264653" stroke="#264653" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M24 14c3 2 5 6 4 10-2-1-5-3-6-6 1 3 1 6-1 9-2-3-3-7-1-10-3 2-6 2-8 0 3-1 6-1 9 0-2-2-3-5-1-8 2 2 4 4 4 5z" fill="#7A8B52" opacity="0.9"/>
            <circle cx="24" cy="16" r="2.5" fill="#E9C46A"/>
          </svg>
          <span className="logo-text">Floorish</span>
        </div>
        <span className="shared-project-name">{projectName}</span>
        <span className="shared-badge">View only</span>
        <a href="/" className="guest-sign-in-btn" style={{ textDecoration: 'none' }}>
          Create your own
        </a>
      </header>

      {floorPlans.length > 1 && (
        <div className="floor-tabs" style={{ padding: '0 12px' }}>
          {floorPlans.map((fp) => (
            <div
              key={fp.id}
              className={`floor-tab ${fp.id === activeFpId ? 'active' : ''}`}
              onClick={() => setActiveFpId(fp.id)}
            >
              <span className="floor-tab-name">{fp.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="shared-canvas" ref={containerRef}>
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {floorImage && (
              <KonvaImage
                image={floorImage}
                x={0}
                y={0}
                width={floorImage.width}
                height={floorImage.height}
              />
            )}
            {activeFurniture.map((f) => (
              <Group key={f.id} x={f.x} y={f.y} rotation={f.rotation}>
                {f.shape === 'rect' ? (
                  <Rect
                    width={f.widthPx}
                    height={f.heightPx}
                    fill={f.color}
                    opacity={0.7}
                    cornerRadius={4}
                    stroke={f.color}
                    strokeWidth={1.5}
                  />
                ) : (
                  <Line
                    points={f.vertices ?? []}
                    fill={f.color}
                    opacity={0.7}
                    closed
                    stroke={f.color}
                    strokeWidth={1.5}
                  />
                )}
                <KonvaText
                  text={f.name}
                  width={f.widthPx}
                  height={f.heightPx}
                  align="center"
                  verticalAlign="middle"
                  fontSize={12}
                  fill="#264653"
                  fontFamily="DM Sans, sans-serif"
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
