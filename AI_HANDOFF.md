# AI handoff

This document gives another AI developer enough context to continue FormMint without weakening its trust boundaries.

## Product intent

FormMint helps a beginner move from a specific original concept to a real rigid Hat accessory starting mesh with fewer avoidable mistakes. It is not an automatic Marketplace publisher, moderation oracle, trend scraper, or profit guarantee.

The core must remain local-first and usable without an account, API key, paid service, analytics system, or runtime backend.

## Architecture

- `src/types.ts` defines projects, geometry parameters, workspace state, calculator inputs, checklist state, metrics, and validation results.
- `src/specs.ts` contains verified official limits, Hat bounds, source URLs, design metadata, presets, and fresh-workspace factories.
- `src/geometry.ts` creates closed procedural primitives, transforms them, merges them into one Three.js geometry, measures them, and performs position-based edge pairing.
- `src/validation.ts` turns geometry measurements and the selected body scale into readable pass, warning, and fail checks.
- `src/exporters.ts` creates one-mesh GLB and OBJ files, PNG canvas captures, and portable project JSON.
- `src/content.ts` contains pure reference-prompt, listing, filename, and economics helpers.
- `src/storage.ts` validates all untrusted imported project and saved workspace data before use.
- `src/components/ModelViewport.tsx` owns the WebGL scene, generic mannequin proxy, orbit controls, lighting, and boundary box.
- `src/components/ForgeView.tsx` provides procedural parameters, metrics, validation, and export actions.
- `src/components/ConceptView.tsx` provides the brief, generated copy, file portability, and local project shelf.
- `src/components/LaunchView.tsx` provides the manual production gate, economics assumptions, and official links.
- `src/App.tsx` coordinates workspace persistence, geometry lifetime, navigation, saved projects, imports, exports, and notifications.
- `src/styles.css` contains the complete responsive visual system.

## Geometry model

Each family produces an array of individually closed primitive geometries. Transform matrices are baked into each geometry, and `mergeGeometries` creates one indexed `BufferGeometry` for preview and export.

This is a merge, not a boolean union. Components can overlap or remain as disconnected closed shells inside one mesh object. The live edge check quantizes vertex positions and expects every geometric edge to appear twice, which avoids false openings at normal UV seams. It does not detect self-intersection or prove that a downstream importer will accept the asset.

Temporary pieces, replaced preview meshes, materials, bounds, controls, renderer resources, and obsolete generated geometries are explicitly disposed. Preserve that behavior when changing Three.js code.

## Official rules

The following were verified on 2026-07-17 and must be rechecked before changing or presenting them as current:

- one mesh;
- at most 4,000 triangles;
- watertight geometry;
- Hat bounds for Normal, Classic, and Slender;
- textures no larger than 2048 × 2048;
- Marketplace object settings; and
- current upload, publishing, membership, identity, and two-step verification requirements.

Only official Creator Hub or Roblox support sources should be used for technical or Marketplace claims. Update `SPEC_VERIFIED_DATE`, tests, README, and changelog together.

## Security and privacy invariants

- Treat project imports and browser storage as untrusted.
- Keep project files at 256 KiB or less, saved projects at 100 or fewer, and every geometry control bounded.
- Do not render imported HTML or use raw HTML injection.
- Do not add Marketplace credential handling, direct publishing, silent requests, telemetry, or remote assets.
- Do not claim generated output is accepted, original, profitable, or artist-finished.
- Keep exports free of local paths and identity fields.
- Keep publication-hygiene tests passing and manually inspect fixtures, screenshots, lockfiles, and docs before publishing.

## Tests

Vitest covers:

- all silhouette presets, closure, UVs, finite bounds, and the triangle budget;
- complexity growth and body-bound failures;
- prompt constraints, listing length, safe filenames, and economics calculations;
- project round trips, malformed and oversized imports, input ranges, invalid colors, duplicate IDs, and storage failures; and
- public authorship, common personal path and secret patterns, and the absence of runtime analytics or network clients.

`npm run check` runs ESLint, strict TypeScript, all tests, and the production build. CI runs that gate on supported Node release lines.

## Current limitations

- No boolean union or remeshing
- Primitive UVs only
- One preview material and no texture painting
- Hat accessories only
- Generic mannequin proxy, not an AFT replacement
- No inspection of a file after Blender edits
- No browser-level end-to-end test suite yet
- A sizeable production bundle because the 3D engine and exporters are client-side

## Best next steps

1. Add a safe GLB/OBJ re-import inspector so users can validate the file they actually edited in Blender.
2. Add antenna-cluster and headband families with the same closed-mesh and default-bound tests.
3. Add Playwright coverage for keyboard navigation, project portability, geometry-failure states, and export controls.

Read `CONTRIBUTING.md`, `docs/technical-boundaries.md`, `PRIVACY.md`, and `SECURITY.md` before expanding the product boundary.
