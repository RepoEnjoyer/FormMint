import { BODY_SCALES, DESIGN_KINDS, type AccessoryParameters, type BodyScale, type EconomicsInputs, type LaunchChecklist, type ProjectBrief, type SavedProject, type Workspace } from './types';
import { createWorkspace } from './specs';

export const STORAGE_KEY = 'formmint.workspace.v1';
export const PROJECT_FORMAT = 'formmint-project/v1';
export const MAX_PROJECT_BYTES = 256 * 1024;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, field: string, maximum: number, allowEmpty = true): string {
  if (typeof value !== 'string' || value.length > maximum || (!allowEmpty && value.trim() === '')) {
    throw new Error(`${field} must be ${allowEmpty ? 'a' : 'a non-empty'} string under ${maximum} characters.`);
  }
  return value;
}

function numberValue(value: unknown, field: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${field} must be true or false.`);
  return value;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new Error(`${field} is invalid.`);
  return value as T;
}

function timestamp(value: unknown, field: string): string {
  const text = stringValue(value, field, 40, false);
  if (Number.isNaN(Date.parse(text))) throw new Error(`${field} must be a valid timestamp.`);
  return text;
}

function validateParameters(value: unknown): AccessoryParameters {
  if (!isRecord(value)) throw new Error('Accessory parameters are invalid.');
  const color = stringValue(value.color, 'parameters.color', 7, false);
  if (!/^#[0-9a-f]{6}$/iu.test(color)) throw new Error('parameters.color must be a six-digit hex color.');
  return {
    design: enumValue(value.design, DESIGN_KINDS, 'parameters.design'),
    radius: numberValue(value.radius, 'parameters.radius', 0.3, 1.4),
    thickness: numberValue(value.thickness, 'parameters.thickness', 0.025, 0.3),
    height: numberValue(value.height, 'parameters.height', 0.08, 1.5),
    count: Math.round(numberValue(value.count, 'parameters.count', 3, 20)),
    detail: Math.round(numberValue(value.detail, 'parameters.detail', 5, 20)),
    offsetY: numberValue(value.offsetY, 'parameters.offsetY', -0.5, 1.5),
    color,
    roughness: numberValue(value.roughness, 'parameters.roughness', 0, 1),
    metalness: numberValue(value.metalness, 'parameters.metalness', 0, 1),
  };
}

function validateProject(value: unknown): ProjectBrief {
  if (!isRecord(value)) throw new Error('Project is invalid.');
  return {
    id: stringValue(value.id, 'project.id', 100, false),
    name: stringValue(value.name, 'project.name', 100),
    collection: stringValue(value.collection, 'project.collection', 100),
    coreNoun: stringValue(value.coreNoun, 'project.coreNoun', 80),
    aesthetic: stringValue(value.aesthetic, 'project.aesthetic', 160),
    audience: stringValue(value.audience, 'project.audience', 240),
    differentiator: stringValue(value.differentiator, 'project.differentiator', 300),
    palette: stringValue(value.palette, 'project.palette', 120),
    bodyScale: enumValue<BodyScale>(value.bodyScale, BODY_SCALES, 'project.bodyScale'),
    parameters: validateParameters(value.parameters),
    createdAt: timestamp(value.createdAt, 'project.createdAt'),
    updatedAt: timestamp(value.updatedAt, 'project.updatedAt'),
  };
}

function validateSaved(value: unknown): SavedProject {
  const project = validateProject(value);
  if (!isRecord(value)) throw new Error('Saved project is invalid.');
  return { ...project, savedAt: timestamp(value.savedAt, 'project.savedAt') };
}

function validateEconomics(value: unknown): EconomicsInputs {
  if (!isRecord(value)) throw new Error('Economics inputs are invalid.');
  return {
    uploadFee: numberValue(value.uploadFee, 'economics.uploadFee', 0, 1_000_000),
    publishingAdvance: numberValue(value.publishingAdvance, 'economics.publishingAdvance', 0, 1_000_000),
    salePrice: numberValue(value.salePrice, 'economics.salePrice', 0, 1_000_000),
    creatorRate: numberValue(value.creatorRate, 'economics.creatorRate', 0, 100),
    rebateRate: numberValue(value.rebateRate, 'economics.rebateRate', 0, 100),
  };
}

function validateLaunch(value: unknown): LaunchChecklist {
  if (!isRecord(value)) throw new Error('Launch checklist is invalid.');
  return {
    original: booleanValue(value.original, 'launch.original'),
    cleanMesh: booleanValue(value.cleanMesh, 'launch.cleanMesh'),
    studioImport: booleanValue(value.studioImport, 'launch.studioImport'),
    aftFit: booleanValue(value.aftFit, 'launch.aftFit'),
    avatarTests: booleanValue(value.avatarTests, 'launch.avatarTests'),
    marketplaceSettings: booleanValue(value.marketplaceSettings, 'launch.marketplaceSettings'),
    thumbnail: booleanValue(value.thumbnail, 'launch.thumbnail'),
    listing: booleanValue(value.listing, 'launch.listing'),
  };
}

export function validateWorkspace(value: unknown): Workspace {
  if (!isRecord(value) || value.version !== 1) throw new Error('Unsupported FormMint workspace version.');
  if (!Array.isArray(value.saved) || value.saved.length > 100) throw new Error('Saved project list is too large or invalid.');
  const active = validateProject(value.active);
  const saved = value.saved.map(validateSaved);
  const ids = new Set(saved.map((project) => project.id));
  if (ids.size !== saved.length) throw new Error('Saved project IDs must be unique.');
  return {
    version: 1,
    active,
    saved,
    economics: validateEconomics(value.economics),
    launch: validateLaunch(value.launch),
  };
}

export function serializeProject(project: ProjectBrief, now = new Date()): string {
  return `${JSON.stringify({ format: PROJECT_FORMAT, exportedAt: now.toISOString(), project }, null, 2)}\n`;
}

export function parseProject(content: string): ProjectBrief {
  if (new TextEncoder().encode(content).byteLength > MAX_PROJECT_BYTES) throw new Error('Project file exceeds the 256 KiB limit.');
  let value: unknown;
  try {
    value = JSON.parse(content) as unknown;
  } catch {
    throw new Error('Project file is not valid JSON.');
  }
  if (!isRecord(value) || value.format !== PROJECT_FORMAT) throw new Error('This is not a compatible FormMint project file.');
  return validateProject(value.project);
}

export function loadWorkspace(storage?: StorageLike): { workspace: Workspace; warning?: string } {
  const fallback = createWorkspace();
  if (storage === undefined) return { workspace: fallback };
  try {
    const content = storage.getItem(STORAGE_KEY);
    if (content === null) return { workspace: fallback };
    return { workspace: validateWorkspace(JSON.parse(content) as unknown) };
  } catch {
    return { workspace: fallback, warning: 'Saved workspace data could not be loaded, so FormMint opened a fresh project.' };
  }
}

export function saveWorkspace(workspace: Workspace, storage?: StorageLike): boolean {
  if (storage === undefined) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}
