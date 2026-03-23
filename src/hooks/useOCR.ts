import { useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { parseDimensionText } from '../utils/geometry';
import { useAppState } from './useAppState';

export function useOCR() {
  const { dispatch } = useAppState();

  const runOCR = useCallback(async (imageUrl: string) => {
    dispatch({ type: 'SET_OCR_RUNNING', payload: true });
    dispatch({ type: 'SET_OCR_PROGRESS', payload: 0 });

    try {
      const worker = await createWorker('eng', undefined, {
        logger: (m: { progress: number }) => {
          if (typeof m.progress === 'number') {
            dispatch({ type: 'SET_OCR_PROGRESS', payload: Math.round(m.progress * 100) });
          }
        },
      });

      const { data } = await worker.recognize(imageUrl);
      const dimensions = parseDimensionText(data.text);
      dispatch({ type: 'SET_OCR_DIMENSIONS', payload: dimensions });

      await worker.terminate();
    } catch (err) {
      console.error('OCR failed:', err);
      dispatch({ type: 'SET_OCR_DIMENSIONS', payload: [] });
    } finally {
      dispatch({ type: 'SET_OCR_RUNNING', payload: false });
      dispatch({ type: 'SET_OCR_PROGRESS', payload: 100 });
    }
  }, [dispatch]);

  return { runOCR };
}
