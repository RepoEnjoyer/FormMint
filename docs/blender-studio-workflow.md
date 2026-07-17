# Inspect-to-Studio workflow

FormMint catches common model problems before Blender and Studio finish the job. It is a planning preflight, not a substitute for Studio validation.

## 1. Inspect locally in FormMint

Open **Inspect** and choose one `.glb`, `.gltf`, or `.obj` model. A `.gltf` may be selected with its local `.bin` and texture dependencies. FormMint does not upload the files or retain their filenames.

Review the mesh count, triangles, vertices, bounds, origin offset, normals, UV coverage, open edges, non-manifold edges, and zero-area triangles. Select a finding to highlight supported problem edges in the viewport.

If useful, choose **Prepare safe copy**. This creates a non-destructive copy that can:

- remove zero-area faces;
- merge render meshes;
- weld exact duplicate vertices;
- recalculate normals;
- recenter the model; and
- scale an oversized model into the selected planning boundary.

It does not fill holes, repair non-manifold topology, unwrap UVs, retopologize, or guarantee acceptance. Export the prepared GLB only after checking that the changes suit the design.

The separate **Blockout** workspace remains available for generating a simple crown or halo starting mesh when there is no source model yet.

## 2. Inspect in Blender

Import the GLB using **File > Import > glTF 2.0**. Save a Blender project before editing.

Work through this order:

1. Confirm there is one intended accessory mesh and no imported camera or light.
2. Check the silhouette from front, back, sides, top, and three-quarter views.
3. Inspect intersecting procedural pieces. Keep deliberate intersections only when they produce a clean result in Studio; use a careful union and retopology when a continuous surface is required.
4. Enter Edit Mode, inspect non-manifold geometry, repair holes, and recalculate outside normals.
5. Remove hidden or accidental faces that do not contribute to the visible item.
6. Improve the primitive UV layout before painting a final texture.
7. Keep texture dimensions at or below the current Marketplace limit.
8. Apply rotation and scale with `Ctrl+A` after the final proportions are settled.
9. Check the final triangle count. Modifiers can increase it beyond FormMint's inspected count.
10. Export the finished mesh using Roblox's current Blender export guidance.

Do not blindly run destructive cleanup operations. Inspect the result after every major change and keep incremental project versions.

## 3. Import into Studio

Use **File > 3D Importer** and select the finished `.fbx` or `.gltf` file. Review every importer warning.

The imported model must still follow the current rigid accessory specifications. FormMint cannot validate Studio properties, attachments, moderation, or the final exported file after Blender changes.

## 4. Use the Accessory Fitting Tool

1. Open **Avatar > Accessory**.
2. Select the imported MeshPart.
3. Choose the correct asset category and intended body scale.
4. Position, scale, and rotate the mesh using the AFT preview, not only the workspace mannequin.
5. Test several default bodies and animations.
6. Generate the MeshPart Accessory.

The AFT creates the appropriate rigid-accessory attachment. Do not rely on third-party attachment objects for this workflow.

## 5. Final Marketplace checks

Before paying anything:

- verify the category is accurate;
- confirm Material is Plastic, Transparency is `0`, and VertexColor is the default;
- remove scripts, extra Parts, and unrelated objects;
- test clipping and visibility on several avatars;
- verify the final triangle count, dimensions, normals, and texture sizes;
- confirm the design does not copy protected intellectual property or another creator's item;
- prepare a truthful thumbnail with a readable silhouette; and
- review the latest official policy, upload fee, publishing advance, membership, and verification requirements.

Official references:

- [Rigid accessory specifications](https://create.roblox.com/docs/avatar/rigid-accessories/specifications)
- [Import rigid accessories](https://create.roblox.com/docs/avatar/rigid-accessories/import)
- [Accessory Fitting Tool](https://create.roblox.com/docs/avatar/accessory-fitting-tool)
- [Marketplace policy](https://create.roblox.com/docs/marketplace/marketplace-policy)
- [Fees and commissions](https://create.roblox.com/docs/marketplace/marketplace-fees-and-commissions)
