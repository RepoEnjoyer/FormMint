import { describe, expect, it } from 'vitest';
import { safeFilename } from './content';

describe('creator helpers', () => {
  it('creates portable safe filenames', () => {
    expect(safeFilename('  Neon / Signal Crown!  ')).toBe('neon-signal-crown');
    expect(safeFilename('***')).toBe('formmint-accessory');
  });
});
