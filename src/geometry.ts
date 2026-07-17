import {
  Box3,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BufferGeometry } from 'three';
import type { AccessoryParameters, GeometryMetrics } from './types';

const UP = new Vector3(0, 1, 0);

function transformed(
  geometry: BufferGeometry,
  position = new Vector3(),
  quaternion = new Quaternion(),
  scale = new Vector3(1, 1, 1),
): BufferGeometry {
  const copy = geometry.clone();
  copy.applyMatrix4(new Matrix4().compose(position, quaternion, scale));
  geometry.dispose();
  return copy;
}

function horizontalTorus(radius: number, thickness: number, detail: number, y: number, tiltZ = 0): BufferGeometry {
  const quaternion = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, tiltZ, 'XYZ'));
  return transformed(new TorusGeometry(radius, thickness, Math.max(6, detail), Math.max(18, detail * 4)), new Vector3(0, y, 0), quaternion);
}

function coneAlong(direction: Vector3, base: number, length: number, detail: number, origin: Vector3): BufferGeometry {
  const normalized = direction.clone().normalize();
  const midpoint = origin.clone().addScaledVector(normalized, length / 2);
  const quaternion = new Quaternion().setFromUnitVectors(UP, normalized);
  return transformed(new ConeGeometry(base, length, Math.max(5, Math.round(detail * 0.7)), 1), midpoint, quaternion);
}

function createCrown(parameters: AccessoryParameters): BufferGeometry[] {
  const pieces = [horizontalTorus(parameters.radius, parameters.thickness, parameters.detail, parameters.offsetY)];
  for (let index = 0; index < parameters.count; index += 1) {
    const angle = (index / parameters.count) * Math.PI * 2;
    const position = new Vector3(
      Math.cos(angle) * parameters.radius * 0.91,
      parameters.offsetY + parameters.thickness * 0.55,
      Math.sin(angle) * parameters.radius * 0.91,
    );
    const alternatingHeight = parameters.height * (index % 2 === 0 ? 1 : 0.72);
    pieces.push(coneAlong(new Vector3(0, 1, 0), parameters.thickness * 1.42, alternatingHeight, parameters.detail, position));
  }
  return pieces;
}

function createHalo(parameters: AccessoryParameters): BufferGeometry[] {
  const y = parameters.offsetY;
  const pieces = [horizontalTorus(parameters.radius, parameters.thickness, parameters.detail, y)];
  for (let index = 0; index < parameters.count; index += 1) {
    const angle = (index / parameters.count) * Math.PI * 2;
    const position = new Vector3(
      Math.cos(angle) * parameters.radius,
      y + parameters.thickness * 0.6,
      Math.sin(angle) * parameters.radius,
    );
    pieces.push(coneAlong(new Vector3(0, 1, 0), parameters.thickness * 1.05, parameters.height, parameters.detail, position));
  }
  return pieces;
}

function createOrbit(parameters: AccessoryParameters): BufferGeometry[] {
  const pieces = [
    horizontalTorus(parameters.radius, parameters.thickness, parameters.detail, parameters.offsetY, Math.PI / 5),
    horizontalTorus(parameters.radius * 0.92, parameters.thickness, parameters.detail, parameters.offsetY, -Math.PI / 4),
  ];
  const sphereDetail = Math.max(5, Math.round(parameters.detail * 0.65));
  for (let index = 0; index < parameters.count; index += 1) {
    const angle = (index / parameters.count) * Math.PI * 2;
    const position = new Vector3(
      Math.cos(angle) * parameters.radius,
      parameters.offsetY + Math.sin(angle * 2) * parameters.height * 0.45,
      Math.sin(angle) * parameters.radius * 0.72,
    );
    pieces.push(transformed(new SphereGeometry(parameters.thickness * 1.7, sphereDetail, sphereDetail), position));
  }
  return pieces;
}

function createHorns(parameters: AccessoryParameters): BufferGeometry[] {
  const pieces: BufferGeometry[] = [];
  const steps = Math.max(4, parameters.count);
  for (const side of [-1, 1]) {
    const points = Array.from({ length: steps + 1 }, (_, index) => {
      const t = index / steps;
      return new Vector3(
        side * (0.28 + parameters.radius * 0.55 * t),
        parameters.offsetY + parameters.height * (0.12 + 0.88 * t),
        -0.06 - parameters.radius * 0.24 * Math.sin(t * Math.PI),
      );
    });
    const curve = new CatmullRomCurve3(points);
    for (let index = 0; index < steps; index += 1) {
      const start = curve.getPoint(index / steps);
      const end = curve.getPoint((index + 1) / steps);
      const direction = end.clone().sub(start);
      const length = direction.length() * 1.12;
      const t = index / steps;
      const bottom = parameters.thickness * (1 - t * 0.7);
      const top = parameters.thickness * (1 - ((index + 1) / steps) * 0.7);
      const quaternion = new Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
      const midpoint = start.clone().add(end).multiplyScalar(0.5);
      pieces.push(transformed(
        new CylinderGeometry(top, bottom, length, Math.max(5, parameters.detail), 1),
        midpoint,
        quaternion,
      ));
    }
  }
  return pieces;
}

export function createAccessoryGeometry(parameters: AccessoryParameters): BufferGeometry {
  const pieces = parameters.design === 'crown'
    ? createCrown(parameters)
    : parameters.design === 'halo'
      ? createHalo(parameters)
      : parameters.design === 'orbit'
        ? createOrbit(parameters)
        : createHorns(parameters);
  const merged = mergeGeometries(pieces, false);
  pieces.forEach((piece) => piece.dispose());
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

function pointKey(geometry: BufferGeometry, index: number): string {
  const position = geometry.getAttribute('position');
  const precision = 100_000;
  return `${Math.round(position.getX(index) * precision)},${Math.round(position.getY(index) * precision)},${Math.round(position.getZ(index) * precision)}`;
}

export function countBoundaryEdges(geometry: BufferGeometry): number {
  const edgeCounts = new Map<string, number>();
  const index = geometry.getIndex();
  const triangleCount = index === null ? geometry.getAttribute('position').count / 3 : index.count / 3;
  const vertexAt = (triangle: number, corner: number) => index === null ? triangle * 3 + corner : index.getX(triangle * 3 + corner);

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const vertices = [vertexAt(triangle, 0), vertexAt(triangle, 1), vertexAt(triangle, 2)];
    for (const [left, right] of [[0, 1], [1, 2], [2, 0]] as const) {
      const keys = [pointKey(geometry, vertices[left]!), pointKey(geometry, vertices[right]!)].sort();
      const key = `${keys[0]}|${keys[1]}`;
      edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
    }
  }
  return [...edgeCounts.values()].filter((count) => count !== 2).length;
}

export function measureGeometry(geometry: BufferGeometry): GeometryMetrics {
  const index = geometry.getIndex();
  const position = geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox?.clone() ?? new Box3();
  const size = bounds.getSize(new Vector3());
  return {
    triangles: Math.round((index?.count ?? position.count) / 3),
    vertices: position.count,
    boundaryEdges: countBoundaryEdges(geometry),
    width: size.x,
    height: size.y,
    depth: size.z,
  };
}
