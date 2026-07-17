import { Mesh, MeshStandardMaterial, type BufferGeometry } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { safeFilename } from './content';
import { serializeProject } from './storage';
import type { ProjectBrief } from './types';

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportMesh(geometry: BufferGeometry, project: ProjectBrief): Mesh {
  const material = new MeshStandardMaterial({
    color: project.parameters.color,
    roughness: project.parameters.roughness,
    metalness: project.parameters.metalness,
  });
  const mesh = new Mesh(geometry.clone(), material);
  mesh.name = 'AccessoryMesh';
  return mesh;
}

function disposeMesh(mesh: Mesh): void {
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach((material) => material.dispose());
}

export async function downloadGlb(geometry: BufferGeometry, project: ProjectBrief): Promise<void> {
  const mesh = exportMesh(geometry, project);
  try {
    const result = await new GLTFExporter().parseAsync(mesh, { binary: true, onlyVisible: true });
    if (!(result instanceof ArrayBuffer)) throw new Error('GLB exporter returned an unexpected result.');
    download(new Blob([result], { type: 'model/gltf-binary' }), `${safeFilename(project.name)}.glb`);
  } finally {
    disposeMesh(mesh);
  }
}

export function downloadObj(geometry: BufferGeometry, project: ProjectBrief): void {
  const mesh = exportMesh(geometry, project);
  try {
    const content = new OBJExporter().parse(mesh);
    download(new Blob([content], { type: 'text/plain' }), `${safeFilename(project.name)}.obj`);
  } finally {
    disposeMesh(mesh);
  }
}

export function downloadProject(project: ProjectBrief): void {
  download(new Blob([serializeProject(project)], { type: 'application/json' }), `${safeFilename(project.name)}.formmint.json`);
}

export function downloadPreview(canvas: HTMLCanvasElement, project: ProjectBrief): void {
  canvas.toBlob((blob) => {
    if (blob !== null) download(blob, `${safeFilename(project.name)}-preview.png`);
  }, 'image/png');
}
