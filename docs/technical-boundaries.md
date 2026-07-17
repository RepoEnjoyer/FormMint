# Technical and trust boundaries

## Imported-model checks

FormMint traverses the selected model in browser memory, bakes scene transforms into temporary geometry, and evaluates:

- render mesh, triangle, vertex, material, texture, and connected-component counts;
- dimensions, center offset, and selected Hat planning bounds;
- open edges, edges shared by more than two faces, and zero-area triangles;
- UV, normal, vertex-color, and skinning attributes; and
- detected texture dimensions.

The edge scan quantizes positions to five decimal places before pairing edges. This reduces false holes at ordinary UV or normal seams, but it is not a complete manifold, winding, self-intersection, surface-area, or solid-volume proof.

## Prepared-copy pipeline

`prepareSafeGeometry` never mutates the parsed source scene. It creates new geometry, removes detected zero-area triangles, merges render meshes, optionally preserves a complete UV channel, removes rigid-incompatible color and skin attributes, welds exact duplicate vertices, rebuilds normals, recenters, and scales down when selected Hat bounds are exceeded.

The pipeline deliberately does not:

- decimate or retopologize;
- boolean-union shells;
- fill arbitrary holes;
- invent or unwrap UVs;
- preserve incomplete material groups; or
- claim that the result will pass Roblox validation.

## Import threat model

- Total selection: at most 64 files and 64 MiB.
- Parsed scene: at most 500,000 vertices and 750,000 triangles.
- One GLB, GLTF, or OBJ model per inspection.
- GLTF resources resolve only to selected local files, embedded data, or temporary blob URLs.
- No imported HTML, scripts, or remote URLs are executed.
- OBJ material libraries are not interpreted in version 2.0.

These limits reduce accidental browser exhaustion; they do not make arbitrary third-party files trustworthy. Keep the browser and dependencies current.

## What FormMint cannot prove

FormMint cannot prove Marketplace acceptance, moderation, ownership, originality, demand, profit, exact Studio hierarchy, attachment placement, avatar fit, PBR quality, or the state of a file after another tool edits it.

Roblox Studio's 3D Importer, Accessory Fitting Tool, UGC validation, and current official documentation remain authoritative.

## Export model

- Prepared GLB uses Three.js `GLTFExporter` with one mesh and one standard preview material.
- Blockout GLB and OBJ export one generated mesh object.
- PNG captures the local WebGL canvas.
- Preflight JSON includes metrics, findings, the selected planning boundary, a disclaimer, and generation time.
- Project JSON contains the user-entered brief and blockout parameters.

Preflight exports contain no source filename, computer path, account identity, device information, or Marketplace credential.
