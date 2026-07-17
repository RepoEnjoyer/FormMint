# Changelog

All notable changes to FormMint are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versioning follows [Semantic Versioning](https://semver.org/).

## 2.0.0 - 2026-07-17

### Added

- Local GLB, GLTF, and OBJ model import with related local GLTF resources.
- Imported-model checks for mesh and component counts, triangle budget, bounds, origin offset, topology, UVs, normals, vertex colors, skinning, materials, and detected texture dimensions.
- Viewport overlays for open, non-manifold, and zero-area geometry findings.
- Reversible prepared-copy pipeline with merge, degenerate removal, rigid-attribute stripping, normal rebuilding, recentering, welding, and safe scale-down.
- Prepared GLB, privacy-safe preflight JSON, and inspection PNG exports.
- Import resource, byte, vertex, and triangle limits for browser safety.
- Premium dark interface with Inspect as the default workflow.
- GitHub Pages deployment workflow.

### Changed

- Repositioned the procedural generator as the secondary Blockout Lab.
- Replaced prompt and listing filler with focused project notes and a work-packet guide.
- Replaced the Robux calculator interface with an official Studio handoff checklist.
- Updated repository links, privacy documentation, threat model, roadmap, and maintainer handoff.

## 1.0.0 - 2026-07-17

### Added

- Four procedural rigid Hat accessory blockout families.
- Interactive Three.js preview with a generic head proxy and body-scale boundaries.
- GLB, OBJ, PNG, and portable project exports.
- Local project shelf, launch checklist, automated tests, and CI.
