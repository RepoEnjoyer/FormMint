import { describe, expect, it } from 'vitest';
import { importModelFiles } from './modelImport';
import { analyzeObject, disposeObject, MAX_IMPORT_FILES } from './preflight';

const closedTetrahedron = `
o Candidate
v 0 0 0
v 1 0 0
v 0 1 0
v 0 0 1
f 1 3 2
f 1 2 4
f 2 3 4
f 3 1 4
`;

describe('local model import', () => {
  it('parses a selected OBJ without network access', async () => {
    const imported = await importModelFiles([new File([closedTetrahedron], 'candidate.obj', { type: 'text/plain' })]);
    const analysis = analyzeObject(imported.object, 'Normal');

    expect(imported.bytes).toBeGreaterThan(0);
    expect(analysis.report.metrics.meshes).toBe(1);
    expect(analysis.report.metrics.triangles).toBe(4);
    expect(analysis.report.metrics.boundaryEdges).toBe(0);
    disposeObject(imported.object);
  });

  it('rejects ambiguous selections containing multiple models', async () => {
    const first = new File([closedTetrahedron], 'first.obj');
    const second = new File([closedTetrahedron], 'second.obj');

    await expect(importModelFiles([first, second])).rejects.toThrow('exactly one');
  });

  it('rejects excessive related-file selections before parsing', async () => {
    const files = Array.from({ length: MAX_IMPORT_FILES + 1 }, (_, index) => new File(['x'], `texture-${index}.png`));

    await expect(importModelFiles(files)).rejects.toThrow(`at most ${MAX_IMPORT_FILES}`);
  });
});
