import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppState } from './hooks/useAppState';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Canvas } from './components/Canvas';
import type { CanvasHandle } from './components/Canvas';
import { FurniturePalette } from './components/FurniturePalette';
import { CalibrationPanel } from './components/CalibrationPanel';
import { FloorPlanLoader } from './components/FloorPlanLoader';
import { Toolbar } from './components/Toolbar';
import { AuthGate } from './components/AuthGate';
import { ProjectPicker } from './components/ProjectPicker';
import { UserMenu } from './components/UserMenu';
import { SharedView } from './components/SharedView';
import { useCloudPersistence } from './hooks/useCloudPersistence';
import { uploadFloorPlanImage } from './lib/storage';
import { createProject, fetchProjects, updateProject } from './lib/api';
import { hasCalibratedFloorPlan } from './utils/calibrationTransitions';
import { getNextNewProjectName, NEW_PROJECT_BASE_NAME } from './utils/projectNames';
import './App.css';

interface ActiveProject {
  id: string;
  name: string;
}

function AppInner() {
  const { state, dispatch, undo, redo } = useAppState();
  const { user, isGuest } = useAuth();
  const [project, setProject] = useState<ActiveProject | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [projectRenameError, setProjectRenameError] = useState<string | null>(null);
  const [projectCreateError, setProjectCreateError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const creatingProjectRef = useRef(false);

  const projectId = project?.id ?? null;
  const hasWorkingDraft = state.floorPlans.length > 0 || state.furniture.length > 0;
  const hasCalibratedDraft = hasCalibratedFloorPlan(state.floorPlans);

  // Cloud autosave for authenticated users
  const cloudSave = useCloudPersistence(projectId);

  useEffect(() => {
    if (!user || isGuest) {
      setProject(null);
      setProjectRenameError(null);
      setProjectCreateError(null);
      setIsEditingProjectName(false);
    }
  }, [user, isGuest]);

  // Show project picker for authenticated users who haven't selected a project.
  // Once they start working locally, hide picker and let first calibration create project.
  useEffect(() => {
    if (!user || isGuest) {
      setShowProjectPicker(false);
      return;
    }
    if (projectId) {
      setShowProjectPicker(false);
      return;
    }
    setShowProjectPicker(!hasWorkingDraft);
  }, [user, isGuest, projectId, hasWorkingDraft]);

  useEffect(() => {
    if (project) {
      setProjectNameDraft(project.name);
    } else {
      setProjectNameDraft('');
    }
  }, [project]);

  const createProjectFromCurrentWork = useCallback(async () => {
    if (!user || isGuest || projectId || creatingProjectRef.current) {
      return;
    }

    creatingProjectRef.current = true;
    let suggestedName = NEW_PROJECT_BASE_NAME;

    try {
      try {
        const existingProjects = await fetchProjects();
        suggestedName = getNextNewProjectName(existingProjects.map((entry) => entry.name));
      } catch (err) {
        console.warn('Project list fetch failed; using default project name:', err);
      }

      const createdProject = await createProject(user.id, suggestedName);
      setProject({ id: createdProject.id, name: createdProject.name });
      setProjectRenameError(null);
      setProjectCreateError(null);
    } catch (err) {
      console.error('Auto-create project failed:', err);
      setProjectCreateError('Autosave setup failed. Make another edit to retry.');
    } finally {
      creatingProjectRef.current = false;
    }
  }, [user, isGuest, projectId]);

  // Auto-create for authenticated drafts once calibration exists.
  useEffect(() => {
    if (user && !isGuest && !projectId && hasCalibratedDraft) {
      void createProjectFromCurrentWork();
    }
  }, [user, isGuest, projectId, hasCalibratedDraft, state.furniture.length, createProjectFromCurrentWork]);

  const commitProjectRename = useCallback(async () => {
    if (!project || isRenamingProject) return;

    const trimmedName = projectNameDraft.trim();
    if (!trimmedName) {
      setProjectNameDraft(project.name);
      setIsEditingProjectName(false);
      return;
    }

    if (trimmedName === project.name) {
      setIsEditingProjectName(false);
      setProjectRenameError(null);
      return;
    }

    setIsRenamingProject(true);
    try {
      await updateProject(project.id, { name: trimmedName });
      setProject((previous) => (previous ? { ...previous, name: trimmedName } : previous));
      setProjectRenameError(null);
    } catch (err) {
      console.error('Project rename failed:', err);
      setProjectRenameError('Rename failed. Try again.');
      setProjectNameDraft(project.name);
    } finally {
      setIsRenamingProject(false);
      setIsEditingProjectName(false);
    }
  }, [project, projectNameDraft, isRenamingProject]);

  const cancelProjectRename = useCallback(() => {
    setProjectNameDraft(project?.name ?? '');
    setProjectRenameError(null);
    setIsEditingProjectName(false);
  }, [project]);

  const saveStatusLabel = useMemo(() => {
    if (!user || isGuest) return null;
    if (!projectId) {
      if (projectCreateError) return projectCreateError;
      if (hasCalibratedDraft) return 'Setting up autosave...';
      return hasWorkingDraft ? 'Autosave starts after first calibration' : 'Select or start a project';
    }
    if (cloudSave.status === 'saving') return 'Saving...';
    if (cloudSave.status === 'error') return 'Autosave issue';
    if (cloudSave.status === 'saved' && cloudSave.lastSavedAt) {
      return `Saved ${cloudSave.lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    return 'Autosave on';
  }, [
    user,
    isGuest,
    projectId,
    hasWorkingDraft,
    hasCalibratedDraft,
    projectCreateError,
    cloudSave.status,
    cloudSave.lastSavedAt,
  ]);

  const saveStatusTone = useMemo(() => {
    if (!projectId) {
      if (projectCreateError) return 'error';
      if (hasCalibratedDraft) return 'saving';
      return 'idle';
    }
    return cloudSave.status;
  }, [projectId, projectCreateError, hasCalibratedDraft, cloudSave.status]);

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

  return (
    <div className="app" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
      <header className="app-header">
        <div className="app-logo">
          <svg className="logo-icon" viewBox="0 0 590 590" xmlns="http://www.w3.org/2000/svg">
            <path d="M 363.0,23.5 L 21.5,23.0 L 363.0,23.5 Z M 336.0,51.5 L 49.5,51.0 L 336.0,51.5 Z M 126.0,534.5 L 63.5,534.0 L 62.5,65.0 L 68.0,63.5 L 359.0,64.5 L 352.0,72.5 L 304.0,71.5 L 303.0,111.5 L 295.5,111.0 L 295.0,71.5 L 236.0,71.5 L 234.5,73.0 L 234.0,120.5 L 226.5,120.0 L 226.0,71.5 L 71.5,72.0 L 71.5,207.0 L 126.5,207.0 L 126.0,214.5 L 71.5,215.0 L 71.5,312.0 L 126.5,313.0 L 126.0,320.5 L 71.5,321.0 L 71.5,415.0 L 126.5,416.0 L 126.0,424.5 L 71.5,424.0 L 71.5,526.0 L 126.0,526.5 L 126.0,534.5 Z M 188.5,70.0 L 188.0,67.5 L 166.5,67.0 L 189.0,66.5 L 188.0,64.5 L 135.0,64.5 L 133.5,66.0 L 137.5,67.0 L 135.0,67.5 L 134.0,70.5 L 188.5,70.0 Z M 66.5,174.0 L 66.5,120.0 L 65.0,119.5 L 64.5,174.0 L 66.5,174.0 Z M 69.5,174.0 L 69.5,120.0 L 68.0,119.5 L 67.5,173.0 L 69.5,174.0 Z M 235.0,202.5 L 226.5,202.0 L 226.0,149.5 L 155.5,149.0 L 286.0,148.5 L 234.5,150.0 L 235.0,202.5 Z M 388.0,535.5 L 237.0,534.5 L 236.5,527.0 L 295.5,526.0 L 296.0,416.5 L 303.5,417.0 L 304.0,453.5 L 425.0,453.5 L 426.0,420.5 L 433.5,421.0 L 433.5,436.0 L 436.0,437.5 L 517.0,437.5 L 519.5,436.0 L 519.5,321.0 L 476.0,320.5 L 474.5,319.0 L 474.5,313.0 L 479.0,311.5 L 518.0,312.5 L 519.5,311.0 L 519.5,215.0 L 472.0,215.5 L 465.0,214.5 L 464.5,213.0 L 477.0,206.5 L 518.0,207.5 L 519.5,206.0 L 518.5,175.0 L 519.5,170.0 L 527.0,159.5 L 527.5,534.0 L 388.0,535.5 Z M 541.0,547.5 L 541.0,187.5 L 541.0,547.5 Z M 162.0,423.5 L 154.5,422.0 L 154.5,209.0 L 164.0,206.5 L 178.0,207.5 L 178.5,214.0 L 155.5,215.0 L 155.5,312.0 L 208.0,312.5 L 208.5,320.0 L 155.5,321.0 L 155.5,416.0 L 161.0,415.5 L 162.5,417.0 L 162.0,423.5 Z M 432.0,378.5 L 425.5,378.0 L 425.5,321.0 L 407.5,320.0 L 413.0,311.5 L 425.5,312.0 L 424.5,226.0 L 430.0,224.5 L 433.5,225.0 L 433.5,312.0 L 437.5,314.0 L 437.5,319.0 L 433.5,321.0 L 433.5,377.0 L 432.0,378.5 Z M 303.0,304.5 L 295.5,304.0 L 295.5,232.0 L 293.0,230.5 L 304.5,231.0 L 303.0,304.5 Z M 70.5,282.0 L 70.5,242.0 L 69.0,240.5 L 67.0,243.5 L 66.0,240.5 L 64.5,242.0 L 64.5,282.0 L 66.5,282.0 L 67.0,277.5 L 68.5,278.0 L 68.5,282.0 L 70.5,282.0 Z M 304.0,388.5 L 293.5,388.0 L 296.5,384.0 L 296.0,332.5 L 303.5,333.0 L 304.0,388.5 Z M 70.5,389.0 L 70.5,348.0 L 67.5,348.0 L 67.0,370.5 L 66.5,348.0 L 65.0,347.5 L 64.5,389.0 L 66.0,389.5 L 67.0,387.5 L 68.0,389.5 L 70.5,389.0 Z M 522.5,403.0 L 522.5,355.0 L 521.0,354.5 L 520.5,403.0 L 522.5,403.0 Z M 525.5,403.0 L 526.5,355.0 L 524.0,354.5 L 523.5,402.0 L 525.5,403.0 Z M 155.0,526.5 L 155.0,423.5 L 155.0,526.5 Z M 519.5,526.0 L 519.0,444.5 L 434.0,444.5 L 433.0,464.5 L 426.0,464.5 L 424.0,460.5 L 305.0,460.5 L 303.5,462.0 L 304.0,526.5 L 425.0,526.5 L 424.5,505.0 L 426.0,502.5 L 430.0,501.5 L 433.5,503.0 L 434.0,526.5 L 519.5,526.0 Z M 382.5,459.0 L 382.0,454.5 L 340.5,455.0 L 341.0,459.5 L 382.5,459.0 Z M 208.0,534.5 L 156.0,534.5 L 155.5,527.0 L 208.0,526.5 L 208.0,534.5 Z M 387.5,534.0 L 387.0,528.5 L 360.0,527.5 L 349.5,529.0 L 350.0,534.5 L 387.5,534.0 Z" fill="#A2AA8E" fillRule="evenodd"/>
            <path d="M 389.0,203.5 L 356.0,202.5 L 353.5,199.0 L 386.0,166.5 L 418.0,173.5 L 447.0,170.5 L 409.0,162.5 L 400.0,158.5 L 398.5,154.0 L 423.0,132.5 L 463.0,134.5 L 482.0,130.5 L 448.0,125.5 L 440.0,122.5 L 439.5,120.0 L 483.5,84.0 L 470.0,87.5 L 431.0,107.5 L 431.5,93.0 L 441.0,68.5 L 427.5,85.0 L 414.5,118.0 L 382.0,139.5 L 380.5,128.0 L 388.0,94.5 L 375.5,115.0 L 367.5,151.0 L 343.0,174.5 L 334.0,179.5 L 336.5,156.0 L 342.5,136.0 L 354.5,110.0 L 363.5,98.0 L 392.0,72.5 L 425.0,56.5 L 477.0,43.5 L 540.0,38.5 L 542.5,41.0 L 541.5,50.0 L 527.5,101.0 L 513.5,132.0 L 495.5,158.0 L 477.0,175.5 L 448.0,191.5 L 427.0,198.5 L 389.0,203.5 Z" fill="#DDBA5E" fillRule="evenodd"/>
            <path d="M 569.0,576.5 L 208.5,576.0 L 208.5,389.0 L 321.0,388.5 L 362.5,333.0 L 209.0,332.5 L 208.5,203.0 L 304.0,203.5 L 308.5,166.0 L 317.5,128.0 L 331.5,98.0 L 344.5,80.0 L 363.0,61.5 L 386.0,45.5 L 423.0,29.5 L 462.0,19.5 L 523.0,12.5 L 571.5,13.0 L 565.5,63.0 L 550.5,115.0 L 528.5,158.0 L 502.0,188.5 L 467.0,212.5 L 418.0,227.5 L 390.0,230.5 L 236.5,231.0 L 237.0,304.5 L 417.5,305.0 L 335.0,415.5 L 236.5,416.0 L 236.5,548.0 L 541.5,548.0 L 541.5,183.0 L 569.0,136.5 L 569.0,576.5 Z M 154.0,576.5 L 21.5,576.0 L 21.5,24.0 L 375.0,22.5 L 337.0,50.5 L 48.5,52.0 L 50.0,549.5 L 126.5,548.0 L 126.5,121.0 L 292.5,121.0 L 286.0,148.5 L 154.5,150.0 L 154.0,576.5 Z M 383.5,204.0 L 416.0,201.5 L 450.0,191.5 L 478.0,175.5 L 495.5,159.0 L 512.5,135.0 L 525.5,108.0 L 539.5,63.0 L 543.0,37.5 L 473.0,43.5 L 432.0,53.5 L 391.0,72.5 L 364.5,96.0 L 343.5,131.0 L 335.5,158.0 L 333.0,185.5 L 368.5,151.0 L 375.5,117.0 L 388.0,94.5 L 380.5,124.0 L 380.0,143.5 L 415.5,118.0 L 428.5,84.0 L 440.0,69.5 L 431.5,90.0 L 428.0,111.5 L 447.0,99.5 L 482.5,84.0 L 435.5,122.0 L 453.0,127.5 L 482.0,130.5 L 468.0,133.5 L 441.0,133.5 L 424.0,130.5 L 394.5,156.0 L 417.0,165.5 L 447.0,170.5 L 415.0,172.5 L 385.0,165.5 L 349.5,202.0 L 383.5,204.0 Z" fill="#234242" fillRule="evenodd"/>
          </svg>
          <span className="logo-text">Floorish</span>
        </div>
        <FloorPlanLoader />

        {user && !isGuest && !showProjectPicker && (
          <div className="project-header-meta">
            {project ? (
              <div className="project-header-topline">
                {isEditingProjectName ? (
                  <input
                    className="project-header-name-input"
                    aria-label="Project name"
                    value={projectNameDraft}
                    onChange={(event) => setProjectNameDraft(event.target.value)}
                    onBlur={() => {
                      void commitProjectRename();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void commitProjectRename();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelProjectRename();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    className="project-header-name-btn"
                    onClick={() => {
                      setProjectNameDraft(project.name);
                      setProjectRenameError(null);
                      setIsEditingProjectName(true);
                    }}
                    title="Rename project"
                  >
                    <span className="project-header-name-text">{project.name}</span>
                    <span className="project-header-name-edit">Rename</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="project-header-topline">
                <span className="project-header-draft-label">Draft Project</span>
              </div>
            )}

            {saveStatusLabel && (
              <span className={`project-save-status project-save-status-${saveStatusTone}`}>
                {saveStatusLabel}
              </span>
            )}
            {projectRenameError && <span className="project-rename-error">{projectRenameError}</span>}
          </div>
        )}

        <UserMenu />
      </header>

      {!showProjectPicker && <Toolbar projectId={projectId} canvasRef={canvasRef} />}

      {showProjectPicker && !isGuest ? (
        <div className="app-body">
          <ProjectPicker
            onProjectLoaded={(loadedProject) => {
              setProject({ id: loadedProject.id, name: loadedProject.name });
              setShowProjectPicker(false);
            }}
          />
        </div>
      ) : (
        <div className="app-body">
          <aside className="sidebar">
            <CalibrationPanel />
            <FurniturePalette />
          </aside>
          <main className="main-canvas">
            <Canvas ref={canvasRef} />
          </main>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/share/:token"
            element={
              <AppProvider>
                <SharedView />
              </AppProvider>
            }
          />
          <Route
            path="*"
            element={
              <AuthGate>
                <AppProvider>
                  <AppInner />
                </AppProvider>
              </AuthGate>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
