import type { EconomicsInputs, ProjectBrief } from './types';

function clean(value: string, fallback: string): string {
  return value.trim() === '' ? fallback : value.trim();
}

export function buildReferencePrompt(project: ProjectBrief): string {
  const noun = clean(project.coreNoun, 'head accessory');
  const aesthetic = clean(project.aesthetic, 'stylized low-poly');
  const audience = clean(project.audience, 'players building coordinated outfits');
  const difference = clean(project.differentiator, 'a strong original silhouette');
  const palette = clean(project.palette, project.parameters.color);
  return `Original low-poly rigid avatar ${noun} for ${audience}. ${aesthetic} direction, ${palette} palette, ${difference}. One clear readable silhouette, no text, no logos, no brands, no copyrighted characters, and no resemblance to existing famous marketplace items. Show consistent front, back, left, right, top, and three-quarter views on a plain neutral background. Game-ready concept sheet, simple geometry, practical thickness, clean material separation, under 4,000 triangles.`;
}

export function buildListingDraft(project: ProjectBrief): { titles: string[]; description: string } {
  const noun = clean(project.coreNoun, 'Accessory');
  const aesthetic = clean(project.aesthetic, 'Original');
  const palette = clean(project.palette, 'Signature');
  const collection = clean(project.collection, 'Form Series');
  const capital = (value: string) => value.replace(/\b\w/gu, (letter) => letter.toUpperCase());
  const titles = [
    `${capital(palette.split(' and ')[0] ?? palette)} ${capital(noun)}`,
    `${capital(aesthetic.split(' ')[0] ?? aesthetic)} ${capital(noun)}`,
    `${capital(collection)} ${capital(noun)}`,
  ].map((title) => title.slice(0, 50));
  const description = `${capital(noun)} with ${clean(project.differentiator, 'an original, outfit-friendly silhouette')}. Designed for ${clean(project.audience, 'coordinated avatar looks')}.`;
  return { titles: [...new Set(titles)], description };
}

export function estimateEconomics(inputs: EconomicsInputs): {
  upfront: number;
  creatorPerSale: number;
  estimatedRecoveryPerSale: number;
  salesToRecover: number;
} {
  const upfront = Math.max(0, inputs.uploadFee) + Math.max(0, inputs.publishingAdvance);
  const creatorPerSale = Math.max(0, inputs.salePrice) * Math.max(0, inputs.creatorRate) / 100;
  const estimatedRecoveryPerSale = creatorPerSale + Math.max(0, inputs.salePrice) * Math.max(0, inputs.rebateRate) / 100;
  return {
    upfront,
    creatorPerSale,
    estimatedRecoveryPerSale,
    salesToRecover: estimatedRecoveryPerSale <= 0 ? 0 : Math.ceil(upfront / estimatedRecoveryPerSale),
  };
}

export function safeFilename(value: string): string {
  const cleaned = value.toLowerCase().trim().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '').slice(0, 60);
  return cleaned === '' ? 'formmint-accessory' : cleaned;
}
