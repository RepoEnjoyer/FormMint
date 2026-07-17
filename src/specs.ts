import type { AccessoryParameters, BodyScale, DesignKind, ProjectBrief, Workspace } from './types';

export const OFFICIAL_SPEC_URL = 'https://create.roblox.com/docs/avatar/rigid-accessories/specifications';
export const MARKETPLACE_POLICY_URL = 'https://create.roblox.com/docs/marketplace/marketplace-policy';
export const FEES_URL = 'https://create.roblox.com/docs/marketplace/marketplace-fees-and-commissions';
export const IMPORT_GUIDE_URL = 'https://create.roblox.com/docs/avatar/rigid-accessories/import';
export const SPEC_VERIFIED_DATE = '2026-07-17';
export const TRIANGLE_LIMIT = 4_000;

export const HAT_BOUNDS: Record<BodyScale, { width: number; height: number; depth: number }> = {
  Normal: { width: 1.87, height: 2.5, depth: 1.87 },
  Classic: { width: 3, height: 4, depth: 3 },
  Slender: { width: 1.78, height: 2.5, depth: 1.78 },
};

export const DESIGN_META: Record<DesignKind, { name: string; description: string; countLabel: string; heightLabel: string }> = {
  crown: {
    name: 'Crown array',
    description: 'A readable ring-and-spire silhouette with evenly spaced points.',
    countLabel: 'Spire count',
    heightLabel: 'Spire height',
  },
  halo: {
    name: 'Signal halo',
    description: 'A floating torus with compact upward signal fins.',
    countLabel: 'Fin count',
    heightLabel: 'Fin height',
  },
  orbit: {
    name: 'Orbit frame',
    description: 'Crossing rings and small nodes for a technical floating shape.',
    countLabel: 'Node count',
    heightLabel: 'Ring spread',
  },
  horns: {
    name: 'Arc horns',
    description: 'A mirrored tapered pair assembled as one exportable mesh object.',
    countLabel: 'Curve steps',
    heightLabel: 'Horn rise',
  },
};

export const PRESETS: Array<{ name: string; parameters: AccessoryParameters }> = [
  {
    name: 'Citrus crown',
    parameters: { design: 'crown', radius: 0.7, thickness: 0.085, height: 0.46, count: 7, detail: 10, offsetY: 0.22, color: '#d9ff5f', roughness: 0.38, metalness: 0.35 },
  },
  {
    name: 'Quiet signal',
    parameters: { design: 'halo', radius: 0.72, thickness: 0.065, height: 0.22, count: 6, detail: 12, offsetY: 0.62, color: '#ff8064', roughness: 0.3, metalness: 0.55 },
  },
  {
    name: 'Orbit array',
    parameters: { design: 'orbit', radius: 0.66, thickness: 0.045, height: 0.38, count: 5, detail: 12, offsetY: 0.46, color: '#aa8cff', roughness: 0.27, metalness: 0.65 },
  },
  {
    name: 'Arc horns',
    parameters: { design: 'horns', radius: 0.72, thickness: 0.11, height: 0.62, count: 7, detail: 9, offsetY: 0.12, color: '#71e7cf', roughness: 0.54, metalness: 0.08 },
  },
];

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `fm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProject(now = new Date()): ProjectBrief {
  const timestamp = now.toISOString();
  return {
    id: createId(),
    name: 'Untitled accessory',
    collection: '',
    coreNoun: 'crown',
    aesthetic: 'futuristic streetwear',
    audience: 'players building clean sci-fi outfits',
    differentiator: 'a compact silhouette with asymmetric signal details',
    palette: 'charcoal and electric lime',
    bodyScale: 'Normal',
    parameters: { ...PRESETS[0]!.parameters },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createWorkspace(now = new Date()): Workspace {
  return {
    version: 1,
    active: createProject(now),
    saved: [],
    economics: {
      uploadFee: 80,
      publishingAdvance: 1_500,
      salePrice: 85,
      creatorRate: 30,
      rebateRate: 30,
    },
    launch: {
      original: false,
      cleanMesh: false,
      studioImport: false,
      aftFit: false,
      avatarTests: false,
      marketplaceSettings: false,
      thumbnail: false,
      listing: false,
    },
  };
}
