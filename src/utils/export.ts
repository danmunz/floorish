import Konva from 'konva';
import jsPDF from 'jspdf';

interface ExportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Capture a region of the Konva stage as a data URL.
 * Temporarily resets viewport (position/scale) so we capture image-space coords.
 */
function captureRegion(
  stage: Konva.Stage,
  region: ExportRect,
  pixelRatio = 2
): string {
  // Save current viewport
  const prevX = stage.x();
  const prevY = stage.y();
  const prevScaleX = stage.scaleX();
  const prevScaleY = stage.scaleY();

  // Reset to 1:1 for accurate capture
  stage.position({ x: 0, y: 0 });
  stage.scale({ x: 1, y: 1 });
  stage.batchDraw();

  const dataUrl = stage.toDataURL({
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    pixelRatio,
    mimeType: 'image/png',
  });

  // Restore viewport
  stage.position({ x: prevX, y: prevY });
  stage.scale({ x: prevScaleX, y: prevScaleY });
  stage.batchDraw();

  return dataUrl;
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '').trim() || 'floor-plan';
}

export function exportAsPng(
  stage: Konva.Stage,
  region: ExportRect,
  planName: string
) {
  const dataUrl = captureRegion(stage, region);
  const filename = `Floorish - ${sanitizeFilename(planName)}.png`;
  triggerDownload(dataUrl, filename);
}

export function exportAsPdf(
  stage: Konva.Stage,
  region: ExportRect,
  planName: string
) {
  const dataUrl = captureRegion(stage, region);

  const orientation = region.width >= region.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [region.width, region.height] });

  pdf.addImage(dataUrl, 'PNG', 0, 0, region.width, region.height);
  pdf.save(`Floorish - ${sanitizeFilename(planName)}.pdf`);
}
