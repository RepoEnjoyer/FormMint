import type { BufferGeometry } from 'three';
import { measureGeometry } from './geometry';
import { HAT_BOUNDS, TRIANGLE_LIMIT } from './specs';
import type { BodyScale, ValidationCheck, ValidationResult } from './types';

function rounded(value: number): string {
  return value.toFixed(2).replace(/\.00$/u, '');
}

export function validateAccessory(geometry: BufferGeometry, bodyScale: BodyScale): ValidationResult {
  const metrics = measureGeometry(geometry);
  const limits = HAT_BOUNDS[bodyScale];
  const insideBounds = metrics.width <= limits.width && metrics.height <= limits.height && metrics.depth <= limits.depth;
  const triangleStatus = metrics.triangles <= TRIANGLE_LIMIT ? 'pass' : 'fail';
  const checks: ValidationCheck[] = [
    {
      id: 'single-mesh',
      label: 'Single mesh object',
      detail: 'FormMint merges every generated component into one export mesh.',
      status: 'pass',
    },
    {
      id: 'triangles',
      label: `${metrics.triangles.toLocaleString()} / ${TRIANGLE_LIMIT.toLocaleString()} triangles`,
      detail: triangleStatus === 'pass' ? 'Inside the current rigid accessory budget.' : 'Reduce detail or component count before export.',
      status: triangleStatus,
    },
    {
      id: 'bounds',
      label: `${rounded(metrics.width)} × ${rounded(metrics.height)} × ${rounded(metrics.depth)} studs`,
      detail: insideBounds
        ? `Inside the ${bodyScale} Hat boundary of ${limits.width} × ${limits.height} × ${limits.depth}.`
        : `Exceeds the ${bodyScale} Hat boundary of ${limits.width} × ${limits.height} × ${limits.depth}.`,
      status: insideBounds ? 'pass' : 'fail',
    },
    {
      id: 'watertight',
      label: metrics.boundaryEdges === 0 ? 'No exposed geometric edges' : `${metrics.boundaryEdges} suspect geometric edges`,
      detail: metrics.boundaryEdges === 0
        ? 'Every generated shell is closed under a position-based edge check.'
        : 'Inspect and repair the mesh in Blender before importing it into Studio.',
      status: metrics.boundaryEdges === 0 ? 'pass' : 'warning',
    },
    {
      id: 'uvs',
      label: geometry.hasAttribute('uv') ? 'UV coordinates included' : 'UV coordinates missing',
      detail: geometry.hasAttribute('uv') ? 'The export retains primitive UVs for further texturing.' : 'Create a UV map in Blender.',
      status: geometry.hasAttribute('uv') ? 'pass' : 'warning',
    },
    {
      id: 'studio',
      label: 'Studio validation still required',
      detail: 'Use the 3D Importer and Accessory Fitting Tool on multiple bodies before paying any upload fee.',
      status: 'warning',
    },
  ];
  return {
    metrics,
    checks,
    exportReady: checks.every((check) => check.status !== 'fail'),
  };
}
