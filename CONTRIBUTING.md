# Contributing to FormMint

FormMint welcomes focused improvements that make rigid-accessory model inspection safer, clearer, and easier to learn.

## Before starting

- Search existing issues and pull requests.
- Open a feature request before a major workflow or architecture change.
- Keep the core local-first and usable without an account, paid API, or hosted backend.
- Do not add analytics, tracking, marketplace scraping, remote fonts, or third-party scripts.
- Do not commit real credentials, private project data, local paths, Marketplace cookies, or identifying information.
- Do not include copied Marketplace meshes, official platform assets, logos, characters, brands, or other protected content.

Report vulnerabilities using [SECURITY.md](SECURITY.md), not a public issue.

## Development

Requirements: Node.js 20.19 or newer and npm.

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run check
npm audit
```

## Design rules

1. **Never promise acceptance or profit.** Studio, moderation, demand, and current official policy remain outside the app.
2. **Prepared means editable handoff.** Surface limitations honestly and direct creators to Blender and AFT.
3. **Rules need sources and dates.** Technical limits and fees must link to current official documentation.
4. **Safety limits are product features.** Keep imported files, saved projects, geometry complexity, and user text bounded.
5. **Every visual control needs a keyboard path.** Do not make orbiting or dragging the only way to complete a task.
6. **Small dependencies win.** Add a package only when it offers durable functionality that cannot be maintained locally.

## Geometry changes

Import and preflight changes must:

- keep source models on the device and avoid retaining filenames;
- bound file count, byte size, vertices, triangles, and overlay generation;
- avoid silently fetching remote model dependencies;
- leave the original source geometry untouched; and
- ship with malformed, ambiguous, and edge-case fixtures where relevant.

Blockout silhouette changes must:

New silhouette families must:

- produce one merged `BufferGeometry`;
- remain closed under the position-based edge test at supported settings;
- include normals and UV coordinates;
- dispose temporary geometries;
- remain responsive at maximum documented inputs;
- ship with low and high complexity tests; and
- default inside the Normal Hat boundary and current triangle budget.

Do not call a simple merge a boolean union. If a feature introduces union or remeshing, document its exact guarantees and failure cases.

## Pull requests

Include:

- the problem and chosen approach;
- screenshots using synthetic project data for interface changes;
- tests for import, preflight, geometry, validation, or storage changes;
- privacy, security, accessibility, and performance considerations; and
- updated source dates when official limits change.

By contributing, you agree that your work will be licensed under the repository's MIT License.
