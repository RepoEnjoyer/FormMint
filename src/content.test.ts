import { describe, expect, it } from 'vitest';
import { buildListingDraft, buildReferencePrompt, estimateEconomics, safeFilename } from './content';
import { createProject } from './specs';

describe('creator helpers', () => {
  it('builds a constrained multi-view concept prompt from the brief', () => {
    const project = { ...createProject(), coreNoun: 'signal crown', palette: 'black and lime' };
    const prompt = buildReferencePrompt(project);

    expect(prompt).toContain('signal crown');
    expect(prompt).toContain('black and lime');
    expect(prompt).toContain('front, back, left, right, top');
    expect(prompt).toContain('no brands');
    expect(prompt).toContain('under 4,000 triangles');
  });

  it('creates short listing options without repeating exact titles', () => {
    const listing = buildListingDraft({ ...createProject(), collection: 'Signal Series', coreNoun: 'halo' });

    expect(new Set(listing.titles).size).toBe(listing.titles.length);
    expect(listing.titles.every((title) => title.length <= 50)).toBe(true);
    expect(listing.description).toContain('Halo');
  });

  it('estimates upfront recovery using editable rates', () => {
    const result = estimateEconomics({ uploadFee: 80, publishingAdvance: 1_500, salePrice: 100, creatorRate: 30, rebateRate: 30 });

    expect(result.upfront).toBe(1_580);
    expect(result.creatorPerSale).toBe(30);
    expect(result.estimatedRecoveryPerSale).toBe(60);
    expect(result.salesToRecover).toBe(27);
  });

  it('creates portable safe filenames', () => {
    expect(safeFilename('  Neon / Signal Crown!  ')).toBe('neon-signal-crown');
    expect(safeFilename('***')).toBe('formmint-accessory');
  });
});
