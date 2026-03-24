import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchProjects,
  deleteProject,
  updateProject,
  fetchFloorPlans,
  fetchFurniture,
  dbFloorPlanToApp,
  dbFurnitureToApp,
  type Project,
} from '../lib/api';
import { getFloorPlanImageUrl } from '../lib/storage';
import { useAppState } from '../hooks/useAppState';
import { usePersistence } from '../hooks/usePersistence';

interface ProjectPickerProps {
  onProjectLoaded: (projectId: string) => void;
}

export function ProjectPicker({ onProjectLoaded }: ProjectPickerProps) {
  const { user } = useAuth();
  const { dispatch } = useAppState();
  const { importLayout } = usePersistence();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadProjects();
  }, [user, loadProjects]);

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await updateProject(id, { name: renameValue.trim() });
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: renameValue.trim() } : p))
      );
    } catch (err) {
      console.error('Failed to rename project:', err);
    } finally {
      setRenamingId(null);
    }
  };

  const handleOpen = async (project: Project) => {
    try {
      // Load floor plans
      const fpRows = await fetchFloorPlans(project.id);
      const floorPlans = await Promise.all(
        fpRows.map(async (row: Record<string, unknown>) => {
          const imageUrl = row.image_path
            ? (await getFloorPlanImageUrl(row.image_path as string)) ?? ''
            : '';
          return dbFloorPlanToApp(row, imageUrl);
        })
      );

      // Load furniture for all floor plans
      const allFurniture = (
        await Promise.all(
          fpRows.map((fp: Record<string, unknown>) => fetchFurniture(fp.id as string))
        )
      )
        .flat()
        .map((row: Record<string, unknown>) => dbFurnitureToApp(row));

      // Hydrate state
      dispatch({
        type: 'LOAD_STATE',
        payload: {
          floorPlans,
          furniture: allFurniture,
          activeFloorPlanId: floorPlans[0]?.id ?? null,
          showGrid: project.settings.showGrid,
          gridSizeIn: project.settings.gridSizeIn,
          snapToGrid: project.settings.snapToGrid,
        },
      });

      onProjectLoaded(project.id);
    } catch (err) {
      console.error('Failed to open project:', err);
    }
  };

  if (loading) {
    return (
      <div className="project-picker">
        <div className="project-picker-loading">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="project-picker">
      <div className="project-picker-header">
        <h2 className="project-picker-title">Your Projects</h2>
        <label className="btn-sm btn-ghost" style={{ cursor: 'pointer' }}>
          📂 Import
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && importLayout(e.target.files[0])}
          />
        </label>
      </div>

      {projects.length === 0 ? (
        <div className="project-picker-empty">
          <p>Drop or browse floor plan images above to start a new project.</p>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((p) => (
            <div key={p.id} className="project-card" onClick={() => handleOpen(p)}>
              <div className="project-card-info">
                {renamingId === p.id ? (
                  <input
                    className="project-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(p.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <h3 className="project-card-name">{p.name}</h3>
                )}
                <span className="project-card-date">
                  Updated {new Date(p.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-icon"
                  title="Rename"
                  onClick={() => {
                    setRenamingId(p.id);
                    setRenameValue(p.name);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="btn-icon"
                  title="Delete"
                  onClick={() => handleDelete(p.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
