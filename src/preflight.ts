import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  SkinnedMesh,
  Vector3,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HAT_BOUNDS, TRIANGLE_LIMIT } from './specs';
import type { BodyScale } from './types';

export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
export const MAX_IMPORT_FILES = 64;
export const MAX_INSPECT_VERTICES = 500_000;
export const MAX_INSPECT_TRIANGLES = 750_000;

export type FindingSeverity = 'pass' | 'warning' | 'error';
export type OverlayKind = 'boundary' | 'degenerate' | 'none';

export interface PreflightFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  action: string;
  overlay: OverlayKind;
}

export interface PreflightMetrics {
  meshes: number;
  triangles: number;
  vertices: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  degenerateTriangles: number;
  components: number;
  materials: number;
  textures: number;
  maxTextureSize: number;
  width: number;
  height: number;
  depth: number;
  centerOffset: number;
  hasUvs: boolean;
  hasNormals: boolean;
  hasVertexColors: boolean;
  hasSkinning: boolean;
}

export interface PreflightOverlay {
  boundary: Float32Array;
  degenerate: Float32Array;
}

export interface PreflightReport {
  format: 'formmint-preflight/v2';
  bodyScale: BodyScale;
  metrics: PreflightMetrics;
  findings: PreflightFinding[];
  blockers: number;
  warnings: number;
  browserGatePassed: boolean;
  disclaimer: string;
}

export interface PreflightAnalysis {
  report: PreflightReport;
  overlay: PreflightOverlay;
}

export interface RepairResult {
  geometry: BufferGeometry;
  changes: string[];
}

interface EdgeRecord {
  count: number;
  start: Vector3;
  end: Vector3;
}

interface GeometryScan {
  triangles: number;
  vertices: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  degenerateTriangles: number;
  components: number;
  boundaryPositions: number[];
  degeneratePositions: number[];
}

interface MeshRecord {
  geometry: BufferGeometry;
  material: Material | Material[];
  skinned: boolean;
}

const EDGE_PRECISION = 100_000;
const DEGENERATE_EPSILON = 1e-12;

function pointKey(point: Vector3): string {
  return `${Math.round(point.x * EDGE_PRECISION)},${Math.round(point.y * EDGE_PRECISION)},${Math.round(point.z * EDGE_PRECISION)}`;
}

function pushSegment(target: number[], start: Vector3, end: Vector3): void {
  target.push(start.x, start.y, start.z, end.x, end.y, end.z);
}

function scanGeometry(geometry: BufferGeometry): GeometryScan {
  const position = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const triangles = Math.floor((index?.count ?? position.count) / 3);
  const vertexAt = (triangle: number, corner: number) => index === null ? triangle * 3 + corner : index.getX(triangle * 3 + corner);
  const edges = new Map<string, EdgeRecord>();
  const parents = Array.from({ length: triangles }, (_, value) => value);
  const ownerByPoint = new Map<string, number>();
  const degeneratePositions: number[] = [];
  let degenerateTriangles = 0;

  const root = (value: number): number => {
    let current = value;
    while (parents[current] !== current) {
      parents[current] = parents[parents[current]!]!;
      current = parents[current]!;
    }
    return current;
  };
  const union = (left: number, right: number): void => {
    const leftRoot = root(left);
    const rightRoot = root(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };

  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const points = [0, 1, 2].map((corner) => {
      const vertex = vertexAt(triangle, corner);
      return new Vector3(position.getX(vertex), position.getY(vertex), position.getZ(vertex));
    });
    const [a, b, c] = points as [Vector3, Vector3, Vector3];
    const areaSquared = b.clone().sub(a).cross(c.clone().sub(a)).lengthSq();
    if (areaSquared <= DEGENERATE_EPSILON) {
      degenerateTriangles += 1;
      pushSegment(degeneratePositions, a, b);
      pushSegment(degeneratePositions, b, c);
      pushSegment(degeneratePositions, c, a);
    }

    for (const point of points) {
      const key = pointKey(point);
      const owner = ownerByPoint.get(key);
      if (owner === undefined) ownerByPoint.set(key, triangle);
      else union(triangle, owner);
    }

    for (const [left, right] of [[0, 1], [1, 2], [2, 0]] as const) {
      const start = points[left]!;
      const end = points[right]!;
      const key = [pointKey(start), pointKey(end)].sort().join('|');
      const existing = edges.get(key);
      if (existing === undefined) edges.set(key, { count: 1, start, end });
      else existing.count += 1;
    }
  }

  const boundaryPositions: number[] = [];
  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  for (const edge of edges.values()) {
    if (edge.count === 1) {
      boundaryEdges += 1;
      pushSegment(boundaryPositions, edge.start, edge.end);
    } else if (edge.count > 2) {
      nonManifoldEdges += 1;
      pushSegment(boundaryPositions, edge.start, edge.end);
    }
  }

  return {
    triangles,
    vertices: position.count,
    boundaryEdges,
    nonManifoldEdges,
    degenerateTriangles,
    components: triangles === 0 ? 0 : new Set(parents.map((_, indexValue) => root(indexValue))).size,
    boundaryPositions,
    degeneratePositions,
  };
}

function isMeshObject(child: Object3D): child is Mesh<BufferGeometry, Material | Material[]> {
  if (!(child instanceof Mesh)) return false;
  const candidate = child as Mesh<BufferGeometry, Material | Material[]>;
  return candidate.geometry instanceof BufferGeometry;
}

function collectMeshes(object: Object3D): MeshRecord[] {
  const records: MeshRecord[] = [];
  object.updateMatrixWorld(true);
  object.traverse((child) => {
    if (!isMeshObject(child)) return;
    const geometry = child.geometry.clone();
    geometry.applyMatrix4(child.matrixWorld);
    records.push({
      geometry,
      material: child.material,
      skinned: [child instanceof SkinnedMesh, geometry.hasAttribute('skinIndex'), geometry.hasAttribute('skinWeight')].some(Boolean),
    });
  });
  return records;
}

export function assertObjectComplexity(object: Object3D): void {
  let vertices = 0;
  let triangles = 0;
  object.traverse((child) => {
    if (!isMeshObject(child)) return;
    const position = child.geometry.getAttribute('position');
    vertices += position.count;
    triangles += Math.floor((child.geometry.getIndex()?.count ?? position.count) / 3);
  });
  if (vertices > MAX_INSPECT_VERTICES || triangles > MAX_INSPECT_TRIANGLES) {
    throw new Error(`The model is too complex for safe browser inspection (${vertices.toLocaleString()} vertices, ${triangles.toLocaleString()} triangles). Reduce it in Blender first.`);
  }
}

function texturesFromMaterial(material: Material): Texture[] {
  const textures: Texture[] = [];
  for (const value of Object.values(material as unknown as Record<string, unknown>)) {
    if (value !== null && typeof value === 'object' && 'isTexture' in value && (value as { isTexture?: unknown }).isTexture === true) textures.push(value as Texture);
  }
  return textures;
}

function textureDimension(texture: Texture): number {
  const image = texture.image as { width?: unknown; height?: unknown } | undefined;
  const width = typeof image?.width === 'number' ? image.width : 0;
  const height = typeof image?.height === 'number' ? image.height : 0;
  return Math.max(width, height);
}

function rounded(value: number): string {
  return value.toFixed(2).replace(/\.00$/u, '');
}

function finding(id: string, severity: FindingSeverity, title: string, detail: string, action: string, overlay: OverlayKind = 'none'): PreflightFinding {
  return { id, severity, title, detail, action, overlay };
}

export function analyzeObject(object: Object3D, bodyScale: BodyScale): PreflightAnalysis {
  assertObjectComplexity(object);
  const meshes = collectMeshes(object);
  const scans = meshes.map(({ geometry }) => scanGeometry(geometry));
  const bounds = new Box3();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  let hasUvs = meshes.length > 0;
  let hasNormals = meshes.length > 0;
  let hasVertexColors = false;
  let hasSkinning = false;

  for (const record of meshes) {
    record.geometry.computeBoundingBox();
    if (record.geometry.boundingBox !== null) bounds.union(record.geometry.boundingBox);
    hasUvs = hasUvs && record.geometry.hasAttribute('uv');
    hasNormals = hasNormals && record.geometry.hasAttribute('normal');
    hasVertexColors = hasVertexColors || record.geometry.hasAttribute('color');
    hasSkinning = hasSkinning || record.skinned;
    for (const material of Array.isArray(record.material) ? record.material : [record.material]) {
      materials.add(material);
      for (const texture of texturesFromMaterial(material)) textures.add(texture);
    }
  }

  const size = bounds.isEmpty() ? new Vector3() : bounds.getSize(new Vector3());
  const center = bounds.isEmpty() ? new Vector3() : bounds.getCenter(new Vector3());
  const metrics: PreflightMetrics = {
    meshes: meshes.length,
    triangles: scans.reduce((sum, scan) => sum + scan.triangles, 0),
    vertices: scans.reduce((sum, scan) => sum + scan.vertices, 0),
    boundaryEdges: scans.reduce((sum, scan) => sum + scan.boundaryEdges, 0),
    nonManifoldEdges: scans.reduce((sum, scan) => sum + scan.nonManifoldEdges, 0),
    degenerateTriangles: scans.reduce((sum, scan) => sum + scan.degenerateTriangles, 0),
    components: scans.reduce((sum, scan) => sum + scan.components, 0),
    materials: materials.size,
    textures: textures.size,
    maxTextureSize: Math.max(0, ...[...textures].map(textureDimension)),
    width: size.x,
    height: size.y,
    depth: size.z,
    centerOffset: center.length(),
    hasUvs,
    hasNormals,
    hasVertexColors,
    hasSkinning,
  };

  const limits = HAT_BOUNDS[bodyScale];
  const insideBounds = size.x <= limits.width && size.y <= limits.height && size.z <= limits.depth;
  const findings: PreflightFinding[] = [
    finding(
      'mesh-count',
      metrics.meshes === 1 ? 'pass' : 'error',
      metrics.meshes === 1 ? 'One render mesh' : `${metrics.meshes} render meshes found`,
      metrics.meshes === 1 ? 'The imported scene contains one render mesh.' : 'Marketplace rigid accessories require one render mesh object.',
      metrics.meshes === 1 ? 'No change needed.' : 'Prepare a merged copy before Studio import.',
    ),
    finding(
      'triangles',
      metrics.triangles <= TRIANGLE_LIMIT ? 'pass' : 'error',
      `${metrics.triangles.toLocaleString()} / ${TRIANGLE_LIMIT.toLocaleString()} triangles`,
      metrics.triangles <= TRIANGLE_LIMIT ? 'The model is inside the current rigid accessory triangle budget.' : 'The model exceeds the current rigid accessory triangle budget.',
      metrics.triangles <= TRIANGLE_LIMIT ? 'Keep checking the final exported file.' : 'Reduce geometry in Blender; automatic decimation is intentionally not applied.',
    ),
    finding(
      'bounds',
      insideBounds ? 'pass' : 'error',
      `${rounded(size.x)} × ${rounded(size.y)} × ${rounded(size.z)} studs`,
      insideBounds ? `Inside the selected ${bodyScale} Hat planning boundary.` : `Exceeds the selected ${bodyScale} Hat planning boundary.`,
      insideBounds ? 'Confirm fit with the Accessory Fitting Tool.' : 'Scale a prepared copy to fit, then re-check proportions in Studio.',
    ),
    finding(
      'boundary',
      metrics.boundaryEdges === 0 && metrics.nonManifoldEdges === 0 ? 'pass' : 'error',
      metrics.boundaryEdges === 0 && metrics.nonManifoldEdges === 0 ? 'No exposed or non-manifold edges' : `${metrics.boundaryEdges} open · ${metrics.nonManifoldEdges} non-manifold edges`,
      metrics.boundaryEdges === 0 && metrics.nonManifoldEdges === 0 ? 'Every geometric edge is paired under FormMint’s position-based scan.' : 'Open or over-shared edges can fail watertightness checks.',
      metrics.boundaryEdges === 0 && metrics.nonManifoldEdges === 0 ? 'No change needed.' : 'Use the highlighted edges to repair the source mesh in Blender.',
      'boundary',
    ),
    finding(
      'degenerate',
      metrics.degenerateTriangles === 0 ? 'pass' : 'error',
      metrics.degenerateTriangles === 0 ? 'No zero-area triangles' : `${metrics.degenerateTriangles} zero-area triangles`,
      metrics.degenerateTriangles === 0 ? 'No collapsed faces were detected.' : 'Collapsed faces create unreliable normals and validation failures.',
      metrics.degenerateTriangles === 0 ? 'No change needed.' : 'Prepare a cleaned copy or repair the highlighted faces manually.',
      'degenerate',
    ),
    finding(
      'uvs',
      metrics.hasUvs ? 'pass' : 'warning',
      metrics.hasUvs ? 'UV coordinates present' : 'UV coordinates missing',
      metrics.hasUvs ? 'Every imported render mesh contains a UV channel.' : 'At least one render mesh has no UV channel.',
      metrics.hasUvs ? 'Inspect UV quality in Blender.' : 'Create and inspect a UV map before texturing.',
    ),
    finding(
      'normals',
      metrics.hasNormals ? 'pass' : 'warning',
      metrics.hasNormals ? 'Vertex normals present' : 'Vertex normals missing',
      metrics.hasNormals ? 'Every imported render mesh includes normals.' : 'FormMint can generate normals on a prepared copy.',
      metrics.hasNormals ? 'Inspect shading for flipped faces.' : 'Prepare a cleaned copy, then inspect the result.',
    ),
    finding(
      'skinning',
      metrics.hasSkinning ? 'error' : 'pass',
      metrics.hasSkinning ? 'Skinning data detected' : 'No skinning data',
      metrics.hasSkinning ? 'Rigid accessories must not include skinning attributes.' : 'No rigid-accessory skinning conflict was detected.',
      metrics.hasSkinning ? 'Prepare an unskinned copy or remove armatures in Blender.' : 'No change needed.',
    ),
    finding(
      'vertex-colors',
      metrics.hasVertexColors ? 'warning' : 'pass',
      metrics.hasVertexColors ? 'Vertex colors detected' : 'No vertex colors',
      metrics.hasVertexColors ? 'Marketplace validation can reject unsupported vertex color data.' : 'No vertex color channel was detected.',
      metrics.hasVertexColors ? 'Prepare a copy without vertex colors after confirming they are not needed.' : 'No change needed.',
    ),
    finding(
      'texture-size',
      metrics.maxTextureSize <= 2048 ? 'pass' : 'error',
      metrics.textures === 0 ? 'No embedded textures detected' : `Largest texture: ${metrics.maxTextureSize || 'unknown'} px`,
      metrics.maxTextureSize <= 2048 ? 'Detected texture dimensions are within the documented maximum.' : 'At least one detected texture exceeds 2048 pixels.',
      metrics.maxTextureSize <= 2048 ? 'Verify external textures that were not embedded.' : 'Resize the source texture before Studio import.',
    ),
    finding(
      'center',
      metrics.centerOffset <= 0.01 ? 'pass' : 'warning',
      metrics.centerOffset <= 0.01 ? 'Geometry centered at origin' : `Geometry center offset: ${rounded(metrics.centerOffset)}`,
      metrics.centerOffset <= 0.01 ? 'The geometric center is close to the scene origin.' : 'Large origin offsets make fitting and export harder to reason about.',
      metrics.centerOffset <= 0.01 ? 'No change needed.' : 'Recenter a prepared copy, then fit it in Studio.',
    ),
    finding(
      'components',
      metrics.components <= 1 ? 'pass' : 'warning',
      metrics.components <= 1 ? 'One connected component' : `${metrics.components} disconnected components`,
      metrics.components <= 1 ? 'The mesh is a single connected geometric component.' : 'A single mesh object can still contain disconnected shells.',
      metrics.components <= 1 ? 'No change needed.' : 'Inspect whether separate shells are intentional; boolean-union them in Blender when required.',
    ),
  ];

  const blockers = findings.filter(({ severity }) => severity === 'error').length;
  const warnings = findings.filter(({ severity }) => severity === 'warning').length;
  meshes.forEach(({ geometry }) => geometry.dispose());

  return {
    report: {
      format: 'formmint-preflight/v2',
      bodyScale,
      metrics,
      findings,
      blockers,
      warnings,
      browserGatePassed: blockers === 0,
      disclaimer: 'FormMint performs local planning checks only. Roblox Studio, the Accessory Fitting Tool, and Roblox validation remain authoritative.',
    },
    overlay: {
      boundary: new Float32Array(scans.flatMap(({ boundaryPositions }) => boundaryPositions)),
      degenerate: new Float32Array(scans.flatMap(({ degeneratePositions }) => degeneratePositions)),
    },
  };
}

function triangleAttributeValues(geometry: BufferGeometry, attributeName: 'position' | 'uv', triangle: number, corner: number): number[] {
  const attribute = geometry.getAttribute(attributeName);
  const index = geometry.getIndex();
  const vertex = index === null ? triangle * 3 + corner : index.getX(triangle * 3 + corner);
  const values = [attribute.getX(vertex), attribute.getY(vertex)];
  if (attributeName === 'position') values.push(attribute.getZ(vertex));
  return values;
}

function cleanedGeometry(source: BufferGeometry, keepUvs: boolean): { geometry: BufferGeometry; removed: number } {
  const position = source.getAttribute('position');
  const index = source.getIndex();
  const triangles = Math.floor((index?.count ?? position.count) / 3);
  const positions: number[] = [];
  const uvs: number[] = [];
  let removed = 0;

  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const aValues = triangleAttributeValues(source, 'position', triangle, 0);
    const bValues = triangleAttributeValues(source, 'position', triangle, 1);
    const cValues = triangleAttributeValues(source, 'position', triangle, 2);
    const a = new Vector3(aValues[0], aValues[1], aValues[2]);
    const b = new Vector3(bValues[0], bValues[1], bValues[2]);
    const c = new Vector3(cValues[0], cValues[1], cValues[2]);
    if (b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() <= DEGENERATE_EPSILON) {
      removed += 1;
      continue;
    }
    positions.push(...aValues, ...bValues, ...cValues);
    if (keepUvs) {
      uvs.push(
        ...triangleAttributeValues(source, 'uv', triangle, 0),
        ...triangleAttributeValues(source, 'uv', triangle, 1),
        ...triangleAttributeValues(source, 'uv', triangle, 2),
      );
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (keepUvs) geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return { geometry, removed };
}

export function prepareSafeGeometry(object: Object3D, bodyScale: BodyScale): RepairResult {
  const meshes = collectMeshes(object);
  if (meshes.length === 0) throw new Error('No render mesh was found in the imported model.');
  const preserveUvs = meshes.every(({ geometry }) => geometry.hasAttribute('uv'));
  const cleaned = meshes.map(({ geometry }) => cleanedGeometry(geometry, preserveUvs));
  const changes: string[] = [];
  const removed = cleaned.reduce((sum, value) => sum + value.removed, 0);
  if (removed > 0) changes.push(`Removed ${removed} zero-area ${removed === 1 ? 'triangle' : 'triangles'}.`);
  if (meshes.length > 1) changes.push(`Merged ${meshes.length} render meshes into one export mesh.`);
  if (!preserveUvs) changes.push('Removed incomplete UV data because one or more source meshes had no UV channel.');
  if (meshes.some(({ geometry }) => geometry.hasAttribute('color'))) changes.push('Removed vertex color attributes from the prepared copy.');
  if (meshes.some(({ skinned }) => skinned)) changes.push('Removed skinning attributes from the prepared rigid copy.');

  const merged = mergeGeometries(cleaned.map(({ geometry }) => geometry), false);
  const welded = mergeVertices(merged, 1e-5);
  merged.dispose();
  cleaned.forEach(({ geometry }) => geometry.dispose());
  meshes.forEach(({ geometry }) => geometry.dispose());
  welded.computeVertexNormals();
  welded.computeBoundingBox();

  const bounds = welded.boundingBox ?? new Box3();
  const center = bounds.getCenter(new Vector3());
  if (center.length() > 0.0001) {
    welded.translate(-center.x, -center.y, -center.z);
    changes.push('Recentered geometry at the scene origin.');
  }
  welded.computeBoundingBox();
  const size = (welded.boundingBox ?? new Box3()).getSize(new Vector3());
  const limits = HAT_BOUNDS[bodyScale];
  const scale = Math.min(
    size.x > 0 ? limits.width / size.x : 1,
    size.y > 0 ? limits.height / size.y : 1,
    size.z > 0 ? limits.depth / size.z : 1,
  );
  if (scale < 1) {
    const safeScale = scale * 0.98;
    welded.scale(safeScale, safeScale, safeScale);
    changes.push(`Uniformly scaled the prepared copy to 98% of the ${bodyScale} Hat planning boundary.`);
  }
  welded.computeBoundingBox();
  welded.computeBoundingSphere();
  if (changes.length === 0) changes.push('Rebuilt normals and welded exact duplicate vertices on a prepared copy.');
  return { geometry: welded, changes };
}

export function createPreviewGeometry(object: Object3D): BufferGeometry {
  const meshes = collectMeshes(object);
  if (meshes.length === 0) throw new Error('No render mesh was found in the imported model.');
  const cleaned = meshes.map(({ geometry }) => cleanedGeometry(geometry, false).geometry);
  const merged = mergeGeometries(cleaned, false);
  cleaned.forEach((geometry) => geometry.dispose());
  meshes.forEach(({ geometry }) => geometry.dispose());
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

export function disposeObject(object: Object3D): void {
  const disposedMaterials = new Set<Material>();
  const disposedTextures = new Set<Texture>();
  object.traverse((child) => {
    if (!isMeshObject(child)) return;
    child.geometry.dispose();
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      if (disposedMaterials.has(material)) continue;
      for (const texture of texturesFromMaterial(material)) {
        if (!disposedTextures.has(texture)) texture.dispose();
        disposedTextures.add(texture);
      }
      material.dispose();
      disposedMaterials.add(material);
    }
  });
}
