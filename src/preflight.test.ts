import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type Material } from 'three';
import { describe, expect, it } from 'vitest';
import { analyzeObject, prepareSafeGeometry } from './preflight';
import { HAT_BOUNDS } from './specs';

function mesh(geometry: BufferGeometry): Mesh {
  return new Mesh(geometry, new MeshStandardMaterial());
}

function disposeGroup(group: Group): void {
  group.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const candidate = child as Mesh<BufferGeometry, Material | Material[]>;
    candidate.geometry.dispose();
    const materials = Array.isArray(candidate.material) ? candidate.material : [candidate.material];
    materials.forEach((material) => material.dispose());
  });
}

describe('imported model preflight', () => {
  it('passes a centered, closed, single-mesh candidate', () => {
    const group = new Group();
    group.add(mesh(new BoxGeometry(1, 1, 1)));
    const analysis = analyzeObject(group, 'Normal');

    expect(analysis.report.metrics.meshes).toBe(1);
    expect(analysis.report.metrics.triangles).toBe(12);
    expect(analysis.report.metrics.boundaryEdges).toBe(0);
    expect(analysis.report.metrics.degenerateTriangles).toBe(0);
    expect(analysis.report.browserGatePassed).toBe(true);
    disposeGroup(group);
  });

  it('reports open edges and exposes line positions for the viewport', () => {
    const group = new Group();
    group.add(mesh(new PlaneGeometry(1, 1, 1, 1)));
    const analysis = analyzeObject(group, 'Normal');

    expect(analysis.report.metrics.boundaryEdges).toBe(4);
    expect(analysis.overlay.boundary.length).toBe(4 * 6);
    expect(analysis.report.findings.find(({ id }) => id === 'boundary')?.severity).toBe('error');
    disposeGroup(group);
  });

  it('detects collapsed triangles', () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 2, 0, 0], 3));
    const group = new Group();
    group.add(mesh(geometry));
    const analysis = analyzeObject(group, 'Normal');

    expect(analysis.report.metrics.degenerateTriangles).toBe(1);
    expect(analysis.overlay.degenerate.length).toBe(18);
    expect(analysis.report.browserGatePassed).toBe(false);
    disposeGroup(group);
  });

  it('prepares a merged, centered copy and scales oversized geometry down', () => {
    const group = new Group();
    const left = mesh(new BoxGeometry(2, 2, 2));
    left.position.set(4, 1, 0);
    const right = mesh(new BoxGeometry(2, 2, 2));
    right.position.set(7, 1, 0);
    group.add(left, right);

    const result = prepareSafeGeometry(group, 'Normal');
    const preparedGroup = new Group();
    preparedGroup.add(mesh(result.geometry));
    const analysis = analyzeObject(preparedGroup, 'Normal');
    const limits = HAT_BOUNDS.Normal;

    expect(analysis.report.metrics.meshes).toBe(1);
    expect(analysis.report.metrics.centerOffset).toBeLessThan(0.001);
    expect(analysis.report.metrics.width).toBeLessThanOrEqual(limits.width);
    expect(analysis.report.metrics.height).toBeLessThanOrEqual(limits.height);
    expect(analysis.report.metrics.depth).toBeLessThanOrEqual(limits.depth);
    expect(result.changes.some((change) => change.includes('Merged 2'))).toBe(true);
    expect(result.changes.some((change) => change.includes('Recentered'))).toBe(true);
    expect(result.changes.some((change) => change.includes('Uniformly scaled'))).toBe(true);

    disposeGroup(preparedGroup);
    disposeGroup(group);
  });
});
