import { describe, expect, it } from 'vitest';
import { createProject, createWorkspace } from './specs';
import { MAX_PROJECT_BYTES, PROJECT_FORMAT, STORAGE_KEY, loadWorkspace, parseProject, saveWorkspace, serializeProject, validateWorkspace, type StorageLike } from './storage';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('project files', () => {
  it('round-trips a portable project', () => {
    const project = { ...createProject(new Date('2026-07-17T00:00:00.000Z')), name: 'Signal Crown' };
    const content = serializeProject(project, new Date('2026-07-17T01:00:00.000Z'));
    const envelope = JSON.parse(content) as { format: string };

    expect(envelope.format).toBe(PROJECT_FORMAT);
    expect(parseProject(content)).toEqual(project);
  });

  it('rejects malformed, incompatible, and oversized project files', () => {
    expect(() => parseProject('{bad')).toThrow('valid JSON');
    expect(() => parseProject(JSON.stringify({ format: 'other' }))).toThrow('compatible');
    expect(() => parseProject('x'.repeat(MAX_PROJECT_BYTES + 1))).toThrow('256 KiB');
  });

  it('rejects out-of-range geometry and invalid colors', () => {
    const project = createProject();
    const envelope = { format: PROJECT_FORMAT, project: { ...project, parameters: { ...project.parameters, radius: 99 } } };
    expect(() => parseProject(JSON.stringify(envelope))).toThrow('parameters.radius');

    envelope.project.parameters.radius = 0.7;
    envelope.project.parameters.color = 'lime';
    expect(() => parseProject(JSON.stringify(envelope))).toThrow('hex color');
  });
});

describe('workspace persistence', () => {
  it('saves and loads the complete workspace', () => {
    const storage = new MemoryStorage();
    const workspace = createWorkspace(new Date('2026-07-17T00:00:00.000Z'));

    expect(saveWorkspace(workspace, storage)).toBe(true);
    expect(storage.values.has(STORAGE_KEY)).toBe(true);
    expect(loadWorkspace(storage).workspace).toEqual(workspace);
  });

  it('rejects duplicate saved project IDs', () => {
    const workspace = createWorkspace();
    const saved = { ...workspace.active, savedAt: new Date().toISOString() };
    workspace.saved = [saved, { ...saved }];
    expect(() => validateWorkspace(workspace)).toThrow('unique');
  });

  it('fails safely when browser storage is unavailable', () => {
    const broken: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };

    expect(loadWorkspace(broken).warning).toContain('fresh project');
    expect(saveWorkspace(createWorkspace(), broken)).toBe(false);
  });
});
