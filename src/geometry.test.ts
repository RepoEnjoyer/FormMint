import { describe, expect, it } from 'vitest';
import { createAccessoryGeometry, measureGeometry } from './geometry';
import { HAT_BOUNDS, PRESETS, TRIANGLE_LIMIT, createProject } from './specs';
import type { AccessoryParameters } from './types';
import { validateAccessory } from './validation';

describe('procedural geometry', () => {
  it.each(PRESETS)('builds the $name preset as a closed mesh inside the triangle budget', ({ parameters }) => {
    const geometry = createAccessoryGeometry(parameters);
    const metrics = measureGeometry(geometry);

    expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
    expect(geometry.hasAttribute('normal')).toBe(true);
    expect(geometry.hasAttribute('uv')).toBe(true);
    expect(metrics.triangles).toBeLessThanOrEqual(TRIANGLE_LIMIT);
    expect(metrics.boundaryEdges).toBe(0);
    expect([metrics.width, metrics.height, metrics.depth].every(Number.isFinite)).toBe(true);
    geometry.dispose();
  });

  it('changes complexity when detail and component count increase', () => {
    const low: AccessoryParameters = { ...PRESETS[0]!.parameters, count: 4, detail: 5 };
    const high: AccessoryParameters = { ...low, count: 12, detail: 16 };
    const lowGeometry = createAccessoryGeometry(low);
    const highGeometry = createAccessoryGeometry(high);

    expect(measureGeometry(highGeometry).triangles).toBeGreaterThan(measureGeometry(lowGeometry).triangles);
    lowGeometry.dispose();
    highGeometry.dispose();
  });

  it('detects an item that exceeds its selected Hat boundary', () => {
    const project = createProject();
    const geometry = createAccessoryGeometry({ ...project.parameters, radius: HAT_BOUNDS.Slender.width });
    const result = validateAccessory(geometry, 'Slender');

    expect(result.exportReady).toBe(false);
    expect(result.checks.find((check) => check.id === 'bounds')?.status).toBe('fail');
    geometry.dispose();
  });

  it('reports one export mesh and passes the default project gate', () => {
    const project = createProject();
    const geometry = createAccessoryGeometry(project.parameters);
    const result = validateAccessory(geometry, project.bodyScale);

    expect(result.checks.find((check) => check.id === 'single-mesh')?.status).toBe('pass');
    expect(result.exportReady).toBe(true);
    geometry.dispose();
  });
});
