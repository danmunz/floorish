import { useState, useCallback } from 'react';
import { STYLE_PRESETS, buildPrompt, DEFAULT_NEGATIVE_PROMPT } from '../data/stylePresets';
import { generateRestyle, getReplicateApiKey, resizeImageToBase64 } from '../lib/styleEngine';
import { insertStyleGeneration, updateStyleGeneration } from '../lib/styleApi';
import { uploadStyleResult, getStyleResultUrl } from '../lib/roomPhotoStorage';
import { useAuth } from '../hooks/useAuth';
import { ApiKeySettings } from './ApiKeySettings';
import { RoomPhotoPanel } from './RoomPhotoPanel';
import { useAppState } from '../hooks/useAppState';
import { RoomListPanel } from './RoomListPanel';

interface StylePanelProps {
  projectId: string | null;
  floorPlanId: string | null;
}

type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

export function StylePanel({ projectId, floorPlanId }: StylePanelProps) {
  const { state } = useAppState();
  const { user } = useAuth();
  const currentRooms = state.rooms.filter(r => r.floorPlanId === floorPlanId);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('japandi');
  const [customModifiers, setCustomModifiers] = useState('');
  const [denoiseStrength, setDenoiseStrength] = useState(0.65);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);

  const hasApiKey = !!getReplicateApiKey();

  const handleSelectPhoto = useCallback((url: string | null, photoId: string | null) => {
    setSelectedPhotoUrl(url);
    setSelectedPhotoId(photoId);
    setResultImageUrl(null);
    setStatus('idle');
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedPhotoUrl) return;

    setStatus('generating');
    setError(null);
    setResultImageUrl(null);

    const prompt = buildPrompt(selectedStyle, customModifiers.trim() || undefined);
    const negativePrompt = DEFAULT_NEGATIVE_PROMPT;

    // Create a pending generation record in the DB
    let generationId: string | null = null;
    if (projectId) {
      try {
        const gen = await insertStyleGeneration({
          project_id: projectId,
          source_photo_id: selectedPhotoId,
          style_preset: selectedStyle,
          prompt,
          negative_prompt: negativePrompt,
          denoise_strength: denoiseStrength,
          status: 'pending',
        });
        generationId = gen.id;
      } catch {
        // Non-blocking: continue even if DB insert fails
      }
    }

    try {
      const imageBase64 = await resizeImageToBase64(selectedPhotoUrl, 512);
      const result = await generateRestyle({
        imageBase64,
        stylePresetId: selectedStyle,
        customModifiers: customModifiers.trim() || undefined,
        denoiseStrength,
      });

      // Upload result image to storage for persistence
      let persistedUrl = result.imageUrl;
      if (user) {
        try {
          const resp = await fetch(result.imageUrl);
          const blob = await resp.blob();
          const storagePath = await uploadStyleResult(blob, user.id);
          const signedUrl = await getStyleResultUrl(storagePath);
          if (signedUrl) persistedUrl = signedUrl;

          if (generationId) {
            await updateStyleGeneration(generationId, {
              result_image_path: storagePath,
              status: 'completed',
            });
          }
        } catch {
          // Storage upload failed — still show the Replicate URL
          if (generationId) {
            await updateStyleGeneration(generationId, { status: 'completed' }).catch(() => {});
          }
        }
      }

      setResultImageUrl(persistedUrl);
      setStatus('done');
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      setStatus('error');
      if (generationId) {
        await updateStyleGeneration(generationId, {
          status: 'failed',
          error_message: message,
        }).catch(() => {});
      }
    }
  }, [selectedPhotoUrl, selectedPhotoId, selectedStyle, customModifiers, denoiseStrength, projectId, user]);

  const handleDownload = useCallback(async () => {
    if (!resultImageUrl) return;
    try {
      const resp = await fetch(resultImageUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floorish-restyle-${selectedStyle}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('Failed to download result');
    }
  }, [resultImageUrl, selectedStyle]);

  const denoiseLabel = denoiseStrength <= 0.45
    ? 'Preserve structure'
    : denoiseStrength <= 0.7
      ? 'Balanced'
      : 'Full restyle';

  return (
    <div className="style-panel">
      {/* API Key Section */}
      {!hasApiKey && <ApiKeySettings />}

      {/* Rooms */}
      <RoomListPanel floorPlanId={floorPlanId} />

      {/* Room Photos */}
      <RoomPhotoPanel
        projectId={projectId}
        floorPlanId={floorPlanId}
        selectedPhotoUrl={selectedPhotoUrl}
        onSelectPhoto={handleSelectPhoto}
        roomId={state.selectedRoomId}
        rooms={currentRooms}
      />

      {/* Style Presets */}
      <div className="style-presets-section">
        <h3 className="style-section-title">Design Style</h3>
        <div className="style-preset-grid">
          {STYLE_PRESETS.map(preset => (
            <button
              key={preset.id}
              className={`style-preset-card ${selectedStyle === preset.id ? 'selected' : ''}`}
              onClick={() => setSelectedStyle(preset.id)}
              title={preset.description}
            >
              <span
                className="style-preset-swatch"
                style={{ backgroundColor: preset.swatch }}
              />
              <span className="style-preset-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Modifiers */}
      <div className="style-modifiers-section">
        <label className="style-section-label" htmlFor="custom-modifiers">
          Custom Modifiers <span className="style-optional">(optional)</span>
        </label>
        <input
          id="custom-modifiers"
          type="text"
          className="style-modifier-input"
          placeholder="e.g. add a fireplace, remove the island"
          value={customModifiers}
          onChange={e => setCustomModifiers(e.target.value)}
        />
      </div>

      {/* Denoise Slider */}
      <div className="style-denoise-section">
        <div className="style-denoise-header">
          <label className="style-section-label" htmlFor="denoise-slider">
            Transform Strength
          </label>
          <span className="style-denoise-value">{denoiseLabel} ({Math.round(denoiseStrength * 100)}%)</span>
        </div>
        <input
          id="denoise-slider"
          type="range"
          className="style-denoise-slider"
          min={0.35}
          max={0.85}
          step={0.05}
          value={denoiseStrength}
          onChange={e => setDenoiseStrength(parseFloat(e.target.value))}
        />
        <div className="style-denoise-labels">
          <span>Preserve</span>
          <span>Restyle</span>
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="style-generate-btn"
        onClick={handleGenerate}
        disabled={!selectedPhotoUrl || !hasApiKey || status === 'generating'}
      >
        {status === 'generating' ? (
          <>
            <span className="style-spinner" />
            Generating…
          </>
        ) : (
          '🎨 Generate Restyle'
        )}
      </button>

      {!hasApiKey && selectedPhotoUrl && (
        <p className="style-hint">Add your Replicate API key above to enable generation.</p>
      )}
      {!selectedPhotoUrl && hasApiKey && (
        <p className="style-hint">Select a room photo above to get started.</p>
      )}

      {/* Error */}
      {error && (
        <div className="style-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result */}
      {resultImageUrl && (
        <div className="style-result-section">
          <div className="style-result-header">
            <h3 className="style-section-title">Result</h3>
            <div className="style-result-actions">
              <button
                className="style-result-btn"
                onClick={() => setShowCompare(!showCompare)}
              >
                {showCompare ? 'Hide Compare' : 'Compare'}
              </button>
              <button className="style-result-btn" onClick={handleDownload}>
                💾 Save
              </button>
            </div>
          </div>

          {showCompare && selectedPhotoUrl ? (
            <div
              className="style-compare"
              onMouseMove={e => {
                const rect = (e.target as HTMLElement).closest('.style-compare')?.getBoundingClientRect();
                if (rect) setComparePosition(((e.clientX - rect.left) / rect.width) * 100);
              }}
            >
              <div className="style-compare-original" style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}>
                <img src={selectedPhotoUrl} alt="Original" />
              </div>
              <div className="style-compare-result" style={{ clipPath: `inset(0 0 0 ${comparePosition}%)` }}>
                <img src={resultImageUrl} alt="Restyled" />
              </div>
              <div className="style-compare-divider" style={{ left: `${comparePosition}%` }}>
                <div className="style-compare-handle" />
              </div>
              <div className="style-compare-labels">
                <span>Original</span>
                <span>Restyled</span>
              </div>
            </div>
          ) : (
            <img className="style-result-image" src={resultImageUrl} alt="Restyled room" />
          )}
        </div>
      )}

      {/* Settings (collapsible, shown when key exists) */}
      {hasApiKey && (
        <details className="style-settings-details">
          <summary className="style-settings-summary">⚙️ API Settings</summary>
          <ApiKeySettings />
        </details>
      )}
    </div>
  );
}
