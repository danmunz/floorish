import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useOCR } from '../hooks/useOCR';
import { computePixelsPerFoot, formatFeetInches, pixelDistance } from '../utils/geometry';

export function CalibrationPanel() {
  const { state, dispatch } = useAppState();
  const { runOCR } = useOCR();
  const [manualFeet, setManualFeet] = useState('');
  const [manualInches, setManualInches] = useState('');

  const activeFloorPlan = state.floorPlans.find(fp => fp.id === state.activeFloorPlanId);
  const calPoints = state.calibration.points;
  const hasTwoPoints = calPoints.length >= 2;
  const pixDist = hasTwoPoints ? pixelDistance(calPoints[0], calPoints[1]) : 0;

  // Auto-run OCR when a new floor plan is loaded
  const lastOcrId = useRef<string | null>(null);
  useEffect(() => {
    if (activeFloorPlan && activeFloorPlan.imageUrl && lastOcrId.current !== activeFloorPlan.id) {
      lastOcrId.current = activeFloorPlan.id;
      runOCR(activeFloorPlan.imageUrl);
    }
  }, [activeFloorPlan, runOCR]);

  const handleApplyManual = useCallback(() => {
    const feet = parseFloat(manualFeet) || 0;
    const inches = parseFloat(manualInches) || 0;
    const totalFeet = feet + inches / 12;
    if (totalFeet <= 0 || !hasTwoPoints || !state.activeFloorPlanId) return;

    const ppf = computePixelsPerFoot(calPoints[0], calPoints[1], totalFeet);
    dispatch({
      type: 'SET_CALIBRATION',
      payload: {
        floorPlanId: state.activeFloorPlanId,
        pixelsPerFoot: ppf,
        points: [calPoints[0], calPoints[1]],
        distanceFt: totalFeet,
      },
    });
    setManualFeet('');
    setManualInches('');
  }, [manualFeet, manualInches, hasTwoPoints, calPoints, state.activeFloorPlanId, dispatch]);

  const handleApplyDetected = useCallback((totalFeet: number) => {
    if (!hasTwoPoints || !state.activeFloorPlanId) return;
    const ppf = computePixelsPerFoot(calPoints[0], calPoints[1], totalFeet);
    dispatch({
      type: 'SET_CALIBRATION',
      payload: {
        floorPlanId: state.activeFloorPlanId,
        pixelsPerFoot: ppf,
        points: [calPoints[0], calPoints[1]],
        distanceFt: totalFeet,
      },
    });
  }, [hasTwoPoints, calPoints, state.activeFloorPlanId, dispatch]);

  const startCalibration = useCallback(() => {
    dispatch({ type: 'SET_TOOL_MODE', payload: 'calibrate' });
  }, [dispatch]);

  const resetPoints = useCallback(() => {
    dispatch({ type: 'RESET_CALIBRATION_POINTS' });
  }, [dispatch]);

  return (
    <div className="calibration-panel">
      <div className="calibration-header">
        <h3>Scale Calibration</h3>
        {activeFloorPlan?.pixelsPerFoot && (
          <span className="calibrated-badge">✓ Calibrated</span>
        )}
      </div>

      {activeFloorPlan?.pixelsPerFoot && (
        <div className="calibration-info">
          Scale: {activeFloorPlan.pixelsPerFoot.toFixed(1)} px/ft
          {activeFloorPlan.calibrationDistanceFt && (
            <span> · Ref: {formatFeetInches(activeFloorPlan.calibrationDistanceFt)}</span>
          )}
        </div>
      )}

      {/* OCR progress */}
      {state.calibration.ocrRunning && (
        <div className="ocr-progress">
          <div className="ocr-progress-label">Scanning dimensions… {state.calibration.ocrProgress}%</div>
          <div className="ocr-progress-bar">
            <div className="ocr-progress-fill" style={{ width: `${state.calibration.ocrProgress}%` }} />
          </div>
        </div>
      )}

      {/* Calibration steps */}
      {state.toolMode !== 'calibrate' && (
        <button className="btn-sm btn-primary" onClick={startCalibration} style={{ marginTop: 8 }}>
          {activeFloorPlan?.pixelsPerFoot ? 'Re-calibrate' : 'Start Calibration'}
        </button>
      )}

      {state.toolMode === 'calibrate' && (
        <div className="calibration-steps">
          <div className="cal-step">
            <span className={`cal-step-num ${calPoints.length >= 1 ? 'done' : ''}`}>1</span>
            <span>Click the first point of a known dimension</span>
            {calPoints.length >= 1 && <span className="cal-check">✓</span>}
          </div>
          <div className="cal-step">
            <span className={`cal-step-num ${calPoints.length >= 2 ? 'done' : ''}`}>2</span>
            <span>Click the second point</span>
            {calPoints.length >= 2 && <span className="cal-check">✓</span>}
          </div>

          {hasTwoPoints && (
            <>
              <div className="cal-pixel-dist">
                Distance: {Math.round(pixDist)} px
              </div>

              {/* Detected dimensions from OCR */}
              {state.calibration.detectedDimensions.length > 0 && (
                <div className="detected-dims">
                  <div className="detected-dims-label">Detected dimensions (click to apply):</div>
                  {state.calibration.detectedDimensions.map((dim, i) => (
                    <button
                      key={i}
                      className="detected-dim-btn"
                      onClick={() => handleApplyDetected(dim.totalFeet)}
                    >
                      {dim.text} ({formatFeetInches(dim.totalFeet)})
                    </button>
                  ))}
                </div>
              )}

              {/* Manual entry */}
              <div className="manual-entry">
                <div className="manual-entry-label">Or enter the real distance:</div>
                <div className="manual-inputs">
                  <label>
                    <input
                      type="number"
                      value={manualFeet}
                      onChange={e => setManualFeet(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                    ft
                  </label>
                  <label>
                    <input
                      type="number"
                      value={manualInches}
                      onChange={e => setManualInches(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="11"
                      step="1"
                    />
                    in
                  </label>
                </div>
                <button className="btn-sm btn-primary" onClick={handleApplyManual} disabled={!manualFeet && !manualInches}>
                  Apply
                </button>
              </div>

              <button className="btn-sm btn-ghost" onClick={resetPoints}>Reset Points</button>
            </>
          )}

          <button className="btn-sm btn-ghost" onClick={() => dispatch({ type: 'SET_TOOL_MODE', payload: 'select' })} style={{ marginTop: 4 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
