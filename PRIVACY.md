# Privacy model

FormMint is local-first. Its core functionality does not require an account, API key, server, analytics service, advertising provider, or Marketplace credential.

## Stored data

One versioned workspace record is stored in the current browser's local storage. It contains the active project, locally saved variations, editable economics assumptions, and launch checklist state.

The project brief can include names, audiences, aesthetics, and design notes. Do not enter information that should not be available to someone with access to the same browser profile.

## Network behavior

Application source contains no runtime network client. The 3D forge, validation, prompt building, calculator, persistence, and exports run locally.

A request occurs only when the user initially loads a hosted copy or explicitly opens an official documentation link. Browser extensions and synchronization features remain outside FormMint's control.

## Exports

GLB, OBJ, PNG, and FormMint JSON files are created in the browser and downloaded locally. Project JSON is readable and not encrypted. It contains the project brief and procedural parameters, never a computer path or account credential.

## Clearing data

Delete saved projects from the Concept shelf. To remove the full workspace, clear the site's storage in the browser. Export anything valuable first.
