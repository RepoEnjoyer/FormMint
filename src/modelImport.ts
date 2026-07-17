import { LoadingManager, type Object3D } from 'three';
import { assertObjectComplexity, MAX_IMPORT_BYTES, MAX_IMPORT_FILES } from './preflight';

export interface ImportedModel {
  object: Object3D;
  bytes: number;
}

function extension(name: string): string {
  const index = name.lastIndexOf('.');
  return index === -1 ? '' : name.slice(index).toLowerCase();
}

function baseName(path: string): string {
  return path.replaceAll('\\', '/').split('/').pop() ?? path;
}

export async function importModelFiles(input: FileList | File[]): Promise<ImportedModel> {
  const files = Array.from(input);
  if (files.length === 0) throw new Error('Choose a GLB, GLTF, or OBJ model to inspect.');
  if (files.length > MAX_IMPORT_FILES) throw new Error(`Import at most ${MAX_IMPORT_FILES} related files at once.`);
  const bytes = files.reduce((sum, file) => sum + file.size, 0);
  if (bytes > MAX_IMPORT_BYTES) throw new Error('The selected files exceed FormMint’s 64 MiB local import limit.');
  const modelFiles = files.filter((file) => ['.glb', '.gltf', '.obj'].includes(extension(file.name)));
  if (modelFiles.length !== 1) throw new Error('Select exactly one GLB, GLTF, or OBJ model plus any related texture files.');
  const model = modelFiles[0]!;
  const urls = new Map<string, string>();
  const createdUrls: string[] = [];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    createdUrls.push(url);
    urls.set(baseName(file.name), url);
    const rawRelative: unknown = file.webkitRelativePath;
    const relative = typeof rawRelative === 'string' ? baseName(rawRelative) : '';
    if (relative !== '') urls.set(relative, url);
  }

  const manager = new LoadingManager();
  manager.setURLModifier((requested) => {
    if (requested.startsWith('data:') || requested.startsWith('blob:')) return requested;
    const clean = baseName(decodeURIComponent(requested.split(/[?#]/u)[0]!));
    const local = urls.get(clean);
    if (local !== undefined) return local;
    throw new Error(`Missing local dependency “${clean}”. Select the model and its textures together.`);
  });

  try {
    const kind = extension(model.name);
    const object = kind === '.obj'
      ? new (await import('three/examples/jsm/loaders/OBJLoader.js')).OBJLoader(manager).parse(await model.text())
      : (await new (await import('three/examples/jsm/loaders/GLTFLoader.js')).GLTFLoader(manager).parseAsync(kind === '.glb' ? await model.arrayBuffer() : await model.text(), '')).scene;
    object.name = 'ImportedAccessory';
    assertObjectComplexity(object);
    return { object, bytes };
  } catch (error) {
    throw new Error(error instanceof Error ? `Model import failed: ${error.message}` : 'Model import failed.', { cause: error });
  } finally {
    for (const url of createdUrls) URL.revokeObjectURL(url);
  }
}
