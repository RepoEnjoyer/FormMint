# Privacy model

FormMint is local-first. Core functionality requires no account, API key, backend, analytics service, advertising provider, or Marketplace credential.

## Imported models

Selected model files and textures are parsed in browser memory. FormMint does not upload them, send them to an AI provider, or persist them in local storage. The source and prepared copy disappear when the page session ends unless the user explicitly downloads an export.

The interface uses the neutral label `Imported accessory` rather than exposing a source filename. Exported preflight reports intentionally exclude source filenames, local paths, user identity, device information, and browser details.

Related GLTF resources are resolved only from files selected in the same import action or embedded data. Missing dependencies are not fetched from the internet.

## Stored workspace data

One versioned workspace record is stored in the current browser's local storage. It contains project notes, procedural Blockout Lab parameters, locally saved variations, legacy economics fields retained for workspace compatibility, and checklist state.

Do not enter sensitive information into project notes. Anyone with access to the same browser profile can read local storage.

## Network behavior

Application source contains no runtime network client. Model inspection, repair preparation, procedural geometry, persistence, and exports run locally.

A request occurs only when the user initially loads a hosted copy or explicitly opens an official documentation link. Browser extensions, operating-system synchronization, and download-folder behavior remain outside FormMint's control.

## Exports

GLB, OBJ, PNG, preflight JSON, and FormMint project JSON files are created locally. Project JSON contains the user-entered brief and blockout parameters. Preflight JSON contains metrics and findings but no source file identity.

Exports are readable and not encrypted.

## Clearing data

Close or reload the page to discard imported models. Delete saved projects from Project Notes. To remove the entire workspace, clear the site's storage in the browser after exporting anything valuable.
