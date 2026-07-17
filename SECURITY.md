# Security policy

## Supported versions

Security fixes apply to the latest version on the default branch.

| Version | Supported |
| --- | --- |
| Latest `2.x` | Yes |
| Older versions | No |

## Report a vulnerability

Do not publish vulnerability details in a public issue.

Use GitHub's **Security** tab and select **Report a vulnerability**. Include the affected version, reproduction steps, impact, and any suggested mitigation. If private reporting is not available, open a public issue that asks the maintainer to enable a private channel without including sensitive details.

Useful reports include project-file validation bypasses, imported-model resource escapes, unsafe downloads, script injection, unintended data transmission, dependency vulnerabilities reachable in FormMint, or geometry processing that can freeze the browser within documented limits.

Imported models are untrusted input. FormMint limits total selected bytes, file count, vertex count, and triangle count; resolves GLTF dependencies only from explicitly selected local files or embedded data; and never interprets imported HTML or scripts. Reports must not contain source filenames, paths, identity, or device data.

Marketplace rejections, policy questions, normal modelling limitations, and feature requests are not security vulnerabilities.
