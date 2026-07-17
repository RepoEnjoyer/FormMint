<p align="center">
  <img src="public/icon.svg" width="88" height="88" alt="FormMint logo">
</p>

<h1 align="center">FormMint</h1>

<p align="center"><strong>Private model preflight for Roblox rigid accessories.</strong></p>

<p align="center">
  <a href="https://github.com/RepoEnjoyer/FormMint/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/RepoEnjoyer/FormMint/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-8d7cff.svg"></a>
  <img alt="Local first" src="https://img.shields.io/badge/data-local--first-65cdae.svg">
  <img alt="No API key" src="https://img.shields.io/badge/API_key-not%20needed-c9e85b.svg">
</p>

FormMint inspects the model you actually intend to finish. Drop in a GLB, GLTF, or OBJ file to find topology, bounds, UV, material, texture, skinning, and complexity problems before opening Roblox Studio or paying an upload fee.

It can create a reversible prepared copy by merging render meshes, removing zero-area triangles, rebuilding normals, recentering geometry, stripping rigid-incompatible attributes, and scaling oversized models down to the selected planning boundary. It never claims that a browser check guarantees Marketplace acceptance.

<p align="center"><a href="https://repoenjoyer.github.io/FormMint/"><strong>Open the local-first web app →</strong></a></p>

![FormMint imported-model preflight workspace](docs/preview.svg)

> The interface is local-first and contains no analytics, account system, Marketplace credentials, or application network client. Roblox Studio and current official validation remain authoritative.

## Why it is useful

- **Inspect real files:** Load GLB, GLTF, or OBJ candidates and related local textures.
- **See failures:** Display open, non-manifold, and collapsed topology directly over the model.
- **Get an actionable report:** Review blockers, warnings, measurements, and specific next actions.
- **Prepare a safe copy:** Keep the imported source untouched while FormMint creates a separate cleaned candidate.
- **Check the final direction:** Measure triangle count, mesh count, connected shells, bounds, origin offset, UV presence, normals, vertex colors, skinning, materials, and detected texture sizes.
- **Export locally:** Download a prepared GLB, a privacy-safe JSON audit, and a viewport PNG.
- **Start from a blockout when needed:** The secondary Blockout Lab still creates four editable procedural starting shapes.
- **Keep a portable work packet:** Save design notes and blockout parameters without an account.

## Fastest workflow

1. Open **Inspect** and select one model plus any related local texture files.
2. Read the blockers first. Select topology findings to show their problem lines in the viewport.
3. Switch the Hat planning boundary and confirm the model is proportioned for the intended body scale.
4. Select **Prepare reversible copy** to apply the safe, documented transformations.
5. Export the prepared GLB and preflight report.
6. Finish artistic topology, UVs, textures, intersections, and intentional disconnected shells in Blender.
7. Import the final candidate with Studio's current 3D Importer.
8. Convert it with the Accessory Fitting Tool, test multiple bodies, and run Roblox's current UGC validation before uploading.

Studio's importer supports FBX and glTF assets and performs its own error checking. FormMint exports GLB, the binary glTF form. See Roblox's official [import guide](https://create.roblox.com/docs/art/accessories/creating-rigid/importing) and [UGC validation documentation](https://create.roblox.com/docs/marketplace/validation-system).

## Checks performed

| Area | Local check |
| --- | --- |
| Scene | Render mesh count and rigid-accessory skinning conflicts |
| Complexity | Triangle and vertex counts with a 4,000-triangle rigid-accessory gate |
| Dimensions | Width, height, depth, origin offset, and selected Hat planning boundary |
| Topology | Open edges, edges shared by more than two faces, zero-area triangles, and disconnected components |
| Surface data | UV and normal presence, vertex colors, materials, detected textures, and maximum detected texture dimension |
| Presentation | Interactive orbit, wireframe mode, boundary box, issue overlays, and PNG capture |

The edge scan pairs quantized geometric positions so ordinary UV seams do not look like holes. It is still not a complete solid-modelling proof and does not detect every self-intersection.

## Safe preparation

Preparation is deliberately conservative:

- bakes object transforms into a generated copy;
- removes detected zero-area triangles;
- merges render meshes into one object;
- preserves UVs only when every source render mesh has them;
- removes vertex colors and skinning attributes from the rigid prepared copy;
- welds exact duplicate vertices while respecting retained attributes;
- rebuilds vertex normals;
- recenters the copy at the scene origin; and
- uniformly scales down only when the selected planning boundary is exceeded.

FormMint does **not** automatically decimate, boolean-union disconnected shells, invent UVs, repair arbitrary holes, or overwrite the imported source. Those operations can damage a model and remain explicit Blender work.

## Supported imports and safety limits

- Select exactly one `.glb`, `.gltf`, or `.obj` model at a time.
- Related textures and external GLTF resources can be selected alongside the model.
- Imports are limited to 64 MiB and 64 related files.
- Browser inspection stops above 500,000 vertices or 750,000 triangles.
- External dependencies are resolved only from the files the user selected; FormMint does not retrieve missing model resources from the internet.
- OBJ material libraries are not interpreted in this release. Use GLB when material fidelity matters.

## Quick start

Requirements: [Node.js](https://nodejs.org/) 20.19 or newer and npm.

```bash
git clone https://github.com/RepoEnjoyer/FormMint.git
cd FormMint
npm ci
npm run dev
```

For a production build:

```bash
npm run check
npm run preview
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite server |
| `npm run lint` | Check source and configuration files |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run the Vitest suite once |
| `npm run build` | Create the production bundle |
| `npm run check` | Run lint, types, tests, and build together |

## Privacy

Model processing happens in browser memory. Imported files are not placed in local storage, uploaded, analyzed remotely, or included in exported reports. Preflight reports intentionally exclude source filenames, file paths, user identity, and device information.

The browser workspace stores only project notes, procedural blockout parameters, and checklist state. Exported project JSON is readable and not encrypted. See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Important limitations

- FormMint is a planning and preparation tool, not Roblox's validator.
- A browser cannot prove moderation acceptance, ownership, originality, fit quality, or sales.
- Prepared meshes may still contain holes, self-intersections, intentional or accidental disconnected shells, poor UV layouts, weak topology, or undesirable shading.
- The Hat boundary is a planning aid. Studio's Accessory Fitting Tool is the fit authority.
- FBX import and export are not included; use GLB/GLTF or Blender for conversion.
- Imported models and prepared copies live only for the current page session unless exported.
- The procedural Blockout Lab produces starting geometry, not finished Marketplace assets.

## Documentation

- [Technical and trust boundaries](docs/technical-boundaries.md)
- [Blender and Studio workflow](docs/blender-studio-workflow.md)
- [Roadmap](ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [AI developer handoff](AI_HANDOFF.md)
- [Changelog](CHANGELOG.md)

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 RepoEnjoyer.
