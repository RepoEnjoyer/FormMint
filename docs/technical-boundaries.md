# Technical and trust boundaries

## What FormMint verifies

The live gate evaluates the geometry held in browser memory:

- triangle and vertex counts;
- width, height, and depth against the selected Hat body-scale boundary;
- whether the export object is built as one merged mesh;
- UV attribute presence; and
- position-based edge pairing for likely exposed geometric edges.

The edge check treats vertices at the same quantized position as the same point. This handles normal UV seams, but it is not a full solid-modelling or self-intersection proof.

## What FormMint cannot verify

FormMint cannot prove:

- Marketplace acceptance or moderation outcomes;
- legal originality or commercial-use rights;
- demand, conversion, profit, or price-floor compliance;
- final geometry after the user edits or exports through another tool;
- Roblox Studio properties, attachment placement, animation fit, or category correctness;
- final texture quality, PBR maps, compression, or moderation; or
- whether a generated concept resembles an existing item that appeared after the user's last search.

## Procedural geometry model

Each silhouette family produces closed primitive shells. FormMint transforms and merges them into one indexed `BufferGeometry`, then computes normals and bounding volumes. A merged object can still contain intersecting or disconnected shells. That is why the product calls the output a starting mesh and includes Blender cleanup in the required workflow.

## Export model

- GLB export uses Three.js `GLTFExporter` with one mesh and one standard material.
- OBJ export contains one mesh object but does not include a separate material file.
- PNG export captures the local WebGL canvas.
- Project export is readable JSON containing the brief and procedural parameters.

No export contains the user's computer path, account identity, or Marketplace credentials.

## Privacy model

The application has no runtime fetch client, telemetry SDK, remote asset, account, cookie, or advertising code. Projects are stored in one versioned local-storage record. Explicit links to official documentation can navigate to the external site only after the user selects them.

Browser storage and exported project JSON are not encrypted. Anyone with access to the same browser profile or exported file may read the brief.
