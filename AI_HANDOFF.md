# AI handoff

## Product intent

FormMint 2.0 helps a creator inspect and prepare the real rigid Hat accessory model they intend to finish. It is a local preflight, not a Roblox validator, moderation oracle, design generator, Marketplace client, or sales predictor.

The core must remain usable without an account, API key, paid service, analytics system, runtime backend, or imported-file upload.

## Architecture

- `src/modelImport.ts` validates the local selection, blocks ambiguous model sets, resolves only selected local GLTF resources, lazy-loads format parsers, and enforces file limits.
- `src/preflight.ts` contains imported-scene analysis, topology overlay generation, complexity limits, prepared-copy construction, and resource disposal.
- `src/components/PreflightView.tsx` owns the import session, source/prepared states, findings, exports, and privacy messaging.
- `src/components/PreflightViewport.tsx` renders imported or prepared geometry, Hat bounds, wireframe mode, and selected topology overlays.
- `src/geometry.ts` remains the secondary procedural Blockout Lab engine.
- `src/validation.ts` validates generated blockouts only; do not confuse it with imported-model or Roblox validation.
- `src/exporters.ts` creates prepared GLB, preflight JSON, blockout GLB/OBJ, project JSON, and PNG downloads.
- `src/storage.ts` validates the persistent notes/blockout workspace. Imported models are intentionally not stored.
- `src/components/ConceptView.tsx` is focused project notes and portable project data.
- `src/components/LaunchView.tsx` is the manual Blender/Studio/validation checklist.
- `src/App.tsx` coordinates navigation, blockout state, local workspace persistence, and notifications.

## Imported-model analysis

`analyzeObject` clones and world-bakes render geometry before scanning it. Edge keys use quantized positions, connected components use triangle union by shared quantized points, and overlay buffers contain world-space line segments.

The analysis reports planning signals. It does not detect every self-intersection, winding error, thin region, PBR rule, attachment problem, or Studio schema issue.

## Prepared-copy decisions

Preparation is intentionally non-destructive and conservative. It reconstructs non-degenerate triangles, merges meshes, keeps UVs only when complete across every render mesh, drops rigid-incompatible color and skinning attributes, welds exact duplicates, computes normals, recenters, and uniformly scales down to 98% of the selected Hat planning bounds when required.

Do not add automatic decimation, arbitrary hole filling, or boolean union without preview, rollback, fixtures, performance limits, and clear documentation of data loss.

## Privacy and security invariants

- Imported models remain in memory and are never placed in local storage.
- Do not display or export source filenames, local paths, identity, or device information.
- Keep the 64-file, 64-MiB, 500,000-vertex, and 750,000-triangle limits unless a tested replacement is safer.
- Treat models, textures, project JSON, and browser storage as untrusted.
- Never resolve a model dependency to a remote URL.
- Do not add telemetry, credentials, silent requests, raw HTML injection, or direct publishing.
- Every export must remain free of computer paths and account identity.

## Tests and release gate

Vitest covers procedural geometry, imported-model topology findings, overlay generation, safe preparation, storage validation, filenames, and publication hygiene. `npm run check` runs ESLint, strict TypeScript, tests, and a production build. CI runs on supported Node releases.

Before publishing a visual release, manually inspect the actual app at desktop and mobile widths, import closed/open/multi-mesh fixtures, prepare and export a GLB, and confirm the repository-wide privacy test and secret scan pass.

## Current limitations

- Hat planning modes only
- No FBX import or export
- No OBJ material-library interpretation
- No full manifold, winding, self-intersection, thickness, surface-area, or Studio hierarchy proof
- No automatic boolean union, retopology, decimation, UV generation, or texture editing
- Imported sessions are not persisted
- No repository Playwright suite yet
- Studio validation cannot run in browser CI

## Best next steps

1. Build UV and face-orientation overlays with fixture tests.
2. Add the Blender companion with duplicate-before-edit behavior and exact category-bound overlays.
3. Add browser end-to-end tests and release-generated screenshots.
