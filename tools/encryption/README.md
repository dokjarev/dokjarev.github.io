# Text encryption — Jarev browser tool

**Public URL (when GitHub Pages has deployed):** https://jarev.nl/tools/encryption/

A self-contained, general-purpose **text encryption/decryption demonstration** using native Web Crypto. This page and its source code have **no affiliation with any particular clinical or research system**.

## Usage

1. Open the page over HTTPS.
2. Choose **Encrypt** and enter short, non-sensitive sample text.
3. Enter a memorable, strong passphrase of at least 20 characters and confirm.
4. Encrypt and copy the generated `ENC1.` token.
5. Switch to **Decrypt**, paste the token, and enter the same passphrase.

The application makes no network calls after its static assets load, uses no analytics/cookies/browser storage, and does not connect to a backend. The decrypted output clears after 30 seconds; all inputs clear on tab hide/close. Clipboard history, extensions, hosting, compromised devices and password recovery are outside the tool's protection.

## Cryptography

- PBKDF2-HMAC-SHA-256, 600,000 iterations; 16-byte cryptographically random salt per encryption.
- AES-256-GCM, fresh 12-byte IV and 128-bit authentication tag.
- Authenticated context label: `JAREV|TextEncryption|v1`.
- `ENC1.` + URL-safe base64 of `salt || nonce || AES-GCM ciphertext/tag`.
- 8,192 text characters maximum, also capped to 16 KiB UTF-8; max 24,000-character token.
- Fresh salt/nonce means ciphertext is randomized, not a deterministic lookup key.
- The `ENC1` format is **not compatible** with tokens made by prior specialized demonstrations.

## Security and scope

This is a publicly hosted prototype for non-sensitive/test text, **not** an audited or approved solution for confidential or regulated information. Encryption cannot provide authentication, access control, safe key recovery, audit trails, or protections from malicious browser extensions and compromised hosting.

Source code: `index.html`, `app.js`, `style.css`. The old specialized demonstration route redirects to this generic tool for link continuity.

## Validation

- JavaScript syntax has been verified.
- Hosted browser and end-to-end encryption testing should be verified after deployment with test text.
