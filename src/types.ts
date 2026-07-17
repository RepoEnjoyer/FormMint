export const DESIGN_KINDS = ['crown', 'halo', 'orbit', 'horns'] as const;
export const BODY_SCALES = ['Normal', 'Classic', 'Slender'] as const;

export type DesignKind = (typeof DESIGN_KINDS)[number];
export type BodyScale = (typeof BODY_SCALES)[number];
export type ViewName = 'preflight' | 'forge' | 'concept' | 'launch';

export interface AccessoryParameters {
  design: DesignKind;
  radius: number;
  thickness: number;
  height: number;
  count: number;
  detail: number;
  offsetY: number;
  color: string;
  roughness: number;
  metalness: number;
}

export interface ProjectBrief {
  id: string;
  name: string;
  collection: string;
  coreNoun: string;
  aesthetic: string;
  audience: string;
  differentiator: string;
  palette: string;
  bodyScale: BodyScale;
  parameters: AccessoryParameters;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProject extends ProjectBrief {
  savedAt: string;
}

export interface EconomicsInputs {
  uploadFee: number;
  publishingAdvance: number;
  salePrice: number;
  creatorRate: number;
  rebateRate: number;
}

export interface LaunchChecklist {
  original: boolean;
  cleanMesh: boolean;
  studioImport: boolean;
  aftFit: boolean;
  avatarTests: boolean;
  marketplaceSettings: boolean;
  thumbnail: boolean;
  listing: boolean;
}

export interface Workspace {
  version: 1;
  active: ProjectBrief;
  saved: SavedProject[];
  economics: EconomicsInputs;
  launch: LaunchChecklist;
}

export interface GeometryMetrics {
  triangles: number;
  vertices: number;
  boundaryEdges: number;
  width: number;
  height: number;
  depth: number;
}

export interface ValidationCheck {
  id: string;
  label: string;
  detail: string;
  status: 'pass' | 'warning' | 'fail';
}

export interface ValidationResult {
  metrics: GeometryMetrics;
  checks: ValidationCheck[];
  exportReady: boolean;
}
