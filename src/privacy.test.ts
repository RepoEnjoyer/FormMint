import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const ignored = new Set(['.git', 'coverage', 'dist', 'node_modules']);
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.svg', '.ts', '.tsx', '.txt', '.yaml', '.yml']);

function sourceFiles(directory = root): string[] {
  return readdirSync(directory).flatMap((entry) => {
    if (ignored.has(entry)) return [];
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    const extension = entry.includes('.') ? entry.slice(entry.lastIndexOf('.')) : '';
    return textExtensions.has(extension) ? [path] : [];
  });
}

describe('publication hygiene', () => {
  it('credits only the public GitHub identity', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { author?: string };
    expect(manifest.author).toBe('RepoEnjoyer');
  });

  it('contains no common local paths, private keys, or committed secret assignments', () => {
    const forbidden: Array<[string, RegExp]> = [
      ['Unix home directory', /\/(?:Users|home|root)\/[\w.-]+/u],
      ['Windows user directory', /[A-Z]:\\Users\\[^\\\s]+/iu],
      ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u],
      ['secret assignment', /(?:API[_-]?KEY|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET|PASSWORD)\s*=\s*[^\s${}][^\s]*/iu],
      ['local file URL', /file:\/\/(?:localhost)?\//iu],
    ];
    const findings: string[] = [];

    for (const file of sourceFiles()) {
      const content = readFileSync(file, 'utf8');
      for (const [label, pattern] of forbidden) if (pattern.test(content)) findings.push(`${relative(root, file)}: ${label}`);
    }
    expect(findings).toEqual([]);
  });

  it('keeps application source free of analytics and remote network clients', () => {
    const applicationFiles = sourceFiles(join(root, 'src')).filter((file) => !file.endsWith('.test.ts'));
    const patterns = [/\bfetch\s*\(/u, /\bXMLHttpRequest\b/u, /\bWebSocket\b/u, /\bsendBeacon\s*\(/u, /dangerouslySetInnerHTML/u, /\binnerHTML\s*=/u];
    const findings = applicationFiles.filter((file) => patterns.some((pattern) => pattern.test(readFileSync(file, 'utf8'))));
    expect(findings).toEqual([]);
  });
});
