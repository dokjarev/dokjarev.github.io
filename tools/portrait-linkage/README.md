# PORTRAIT ID encryption — web demonstration

**URL (GitHub Pages, after deployment):** https://jarev.nl/tools/portrait-linkage/

**Status:** Browser-only **prototype, synthetic test identifiers only**. This code is public and has **not** been approved by LUMC for patient identifiers or clinical study linkage. The page is intentionally not linked from the site's main navigation. The URL is still publicly accessible and this is **not** an access-control mechanism.

## Purpose and use

- Enter fictitious ID such as `TEST-000123`.
- Choose a unique passphrase of 20 or more characters, confirm and acknowledge test-only use.
- Encrypt to a portable `PTR1.` token, then switch to Decrypt to reverse it with the same passphrase.
- The token format is compatible with the original offline PORTRAIT demonstration.
- **No real HiX numbers, Castor subject identifiers, clinical record details, passwords, or mapping tables are to be used.**

This demo does not connect to HiX, Castor, an authentication system, or any server-side database.

## Architecture

- Static HTML, CSS, JavaScript, without external dependencies.
- HTTPS GitHub Pages required for Web Crypto. Client-side PBKDF2-HMAC-SHA-256 (600,000 iterations) with fresh 16-byte salt and AES-256-GCM with fresh 12-byte nonce (128-bit authentication tag).
- Authenticated context label: `PORTRAIT|HiX|patient-id|v1`.
- Token encoding: `PTR1.` + URL-safe base64 of `salt || nonce || AES-GCM ciphertext/tag`.
- No `fetch`, tracking, cookies, client-side storage, backend, service worker or network calls in the application code.
- Content Security Policy forbids network connections, third-party scripts, images, fonts and form submissions. This is defense-in-depth, not a formal security assessment.
- Encryption is randomized; two encryptions of one ID do **not** yield the same token. It is not a queryable identifier index.
- Does not provide data recovery without the original passphrase.
- Decrypted output auto-clears in 30 seconds or when tab is hidden. Browser history, extensions, compromised devices and clipboard histories remain outside application control.

## Recommended real PORTRAIT workflow

For clinical study linkage, **first** confirm an approved existing enrollment code-key procedure and data controller authorization. Where appropriate, use **Castor's encrypted and searchable field** with role-based permissions, keeping the existing coded participant IDs. Do not store identifiers inside a personal public website or a public GitHub repository.

See:
- https://helpdesk.castoredc.com/hc/en-us/articles/27151210813213-Encrypt-specific-fields-in-EDC-CDMS
- https://helpdesk.castoredc.com/hc/en-us/articles/27151298117533-Working-with-encrypted-data-in-EDC-CDMS
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

## Testing and release

- Source files are checked into the site repository.
- JavaScript was parsed successfully by the connector-hosted JS runtime.
- **Browser end-to-end test and live GitHub Pages deployment have not been independently confirmed**; check locally using synthetic data before relying on the demo.
- Do not promote this to a tool handling real hospital identifiers without institutional approval, a documented threat model, formal security review, key-management/recovery design, authorized hosting and audit controls.
