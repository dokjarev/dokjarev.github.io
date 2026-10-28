"use strict";
/*
 * PORTRAIT browser-only cryptography demonstration.
 * Synthetic identifiers only. No fetch, XMLHttpRequest, storage, analytics, or third-party code.
 * PTR1 tokens are compatible with the earlier offline prototype (same PBKDF2, AAD and byte layout).
 */
(() => {
  const PREFIX = "PTR1.";
  const AAD = new TextEncoder().encode("PORTRAIT|HiX|patient-id|v1");
  const ROUNDS = 600000;
  const SALT_SIZE = 16;
  const IV_SIZE = 12;
  const MAX_ID_SIZE = 64;
  const FAKE_ID = /^TEST-[A-Za-z0-9_-]{1,59}$/;

  const el = id => document.getElementById(id);
  const ui = {
    form: el("cryptoForm"), encryptTab: el("encryptTab"), decryptTab: el("decryptTab"),
    source: el("source"), sourceLabel: el("sourceLabel"), sourceHint: el("sourceHint"),
    passphrase: el("passphrase"), confirmPassphrase: el("confirmPassphrase"),
    confirmRow: el("confirmRow"), testOnlyRow: el("testOnlyRow"), testOnly: el("testOnly"),
    run: el("runButton"), clear: el("clearButton"), status: el("status"),
    outputBlock: el("outputBlock"), output: el("output"), outputLabel: el("outputLabel"),
    outputHint: el("outputHint"), copy: el("copyButton")
  };
  let mode = "encrypt";
  let busy = false;
  let resetTimer = null;

  function announce(message, kind = "") {
    ui.status.textContent = message;
    ui.status.className = "status" + (kind ? " " + kind : "");
  }

  function purgeOutput() {
    if (resetTimer !== null) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
    ui.output.value = "";
    ui.outputBlock.hidden = true;
  }

  function clearAll(showMessage = true) {
    purgeOutput();
    ui.source.value = "";
    ui.passphrase.value = "";
    ui.confirmPassphrase.value = "";
    ui.testOnly.checked = false;
    announce(showMessage ? "All fields cleared." : "");
  }

  function setMode(nextMode) {
    if (busy) return;
    mode = nextMode;
    clearAll(false);
    const enc = mode === "encrypt";
    ui.encryptTab.classList.toggle("selected", enc);
    ui.decryptTab.classList.toggle("selected", !enc);
    ui.encryptTab.setAttribute("aria-pressed", String(enc));
    ui.decryptTab.setAttribute("aria-pressed", String(!enc));
    ui.sourceLabel.textContent = enc ? "Fictitious identifier" : "Encrypted test token";
    ui.source.placeholder = enc ? "TEST-000123" : "PTR1. ...";
    ui.sourceHint.textContent = enc ?
      "Use TEST- followed by 1–59 letters, digits, underscores or hyphens. Leading zeros are preserved." :
      "Paste a token produced by this prototype or the compatible offline test tool.";
    ui.confirmRow.hidden = !enc;
    ui.testOnlyRow.hidden = !enc;
    ui.outputLabel.textContent = enc ? "Encrypted token" : "Decrypted test identifier";
    ui.run.textContent = enc ? "Encrypt test ID" : "Decrypt token";
    ui.copy.hidden = !enc;
    ui.outputHint.textContent = enc ?
      "Copying may leave data in your system clipboard history." :
      "The decrypted test result disappears after 30 seconds or when the tab is hidden.";
    ui.source.maxLength = enc ? MAX_ID_SIZE : 512;
  }

  function toB64Url(bytes) {
    let binary = "";
    for (const value of bytes) binary += String.fromCharCode(value);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function fromB64Url(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("Invalid token");
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(b64 + "=".repeat((4 - b64.length % 4) % 4)), c => c.charCodeAt(0));
  }
  async function deriveKey(password, salt) {
    const rawKey = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {name: "PBKDF2", hash: "SHA-256", salt, iterations: ROUNDS},
      rawKey, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]
    );
  }

  async function encrypt(id, password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const key = await deriveKey(password, salt);
    const encrypted = new Uint8Array(await crypto.subtle.encrypt(
      {name: "AES-GCM", iv, additionalData: AAD, tagLength: 128}, key,
      new TextEncoder().encode(id)
    ));
    const bytes = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
    bytes.set(salt);
    bytes.set(iv, SALT_SIZE);
    bytes.set(encrypted, SALT_SIZE + IV_SIZE);
    return PREFIX + toB64Url(bytes);
  }

  async function decrypt(token, password) {
    if (!token.startsWith(PREFIX) || token.length > 512 || token.length < 50) {
      throw new Error("Invalid token");
    }
    const bytes = fromB64Url(token.slice(PREFIX.length));
    if (bytes.length < SALT_SIZE + IV_SIZE + 17 ||
        bytes.length > SALT_SIZE + IV_SIZE + MAX_ID_SIZE + 16) {
      throw new Error("Invalid token size");
    }
    const salt = bytes.slice(0, SALT_SIZE);
    const iv = bytes.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
    const ciphertext = bytes.slice(SALT_SIZE + IV_SIZE);
    const key = await deriveKey(password, salt);
    const plainBytes = await crypto.subtle.decrypt(
      {name: "AES-GCM", iv, additionalData: AAD, tagLength: 128}, key, ciphertext
    );
    const value = new TextDecoder("utf-8", {fatal: true}).decode(plainBytes);
    if (!FAKE_ID.test(value)) throw new Error("Not a synthetic test ID");
    return value;
  }

  async function run(event) {
    event.preventDefault();
    if (busy) return;
    purgeOutput();
    if (!window.isSecureContext || !window.crypto || !crypto.subtle) {
      announce("Web Crypto requires a supported browser and HTTPS. Try current Edge or Chrome.", "error");
      return;
    }
    const source = ui.source.value.trim();
    const password = ui.passphrase.value;
    if (password.length < 20) {
      announce("Use a passphrase of at least 20 characters.", "error");
      return;
    }
    if (mode === "encrypt") {
      if (!FAKE_ID.test(source)) {
        announce("For this demo, enter a fictitious ID such as TEST-000123.", "error");
        return;
      }
      if (!ui.testOnly.checked) {
        announce("Confirm that this is synthetic test data.", "error");
        return;
      }
      if (password !== ui.confirmPassphrase.value) {
        announce("Passphrases do not match.", "error");
        return;
      }
    } else if (!source) {
      announce("Paste a test token to decrypt.", "error");
      return;
    }

    const currentMode = mode;
    busy = true;
    ui.run.disabled = true;
    ui.encryptTab.disabled = true;
    ui.decryptTab.disabled = true;
    announce("Processing locally in your browser…");
    try {
      const result = currentMode === "encrypt" ?
        await encrypt(source, password) : await decrypt(source, password);
      ui.output.value = result;
      ui.outputBlock.hidden = false;
      ui.source.value = "";
      ui.passphrase.value = "";
      ui.confirmPassphrase.value = "";
      ui.testOnly.checked = false;
      announce(currentMode === "encrypt" ?
        "Encrypted test token created. You will need the same passphrase to decrypt it." :
        "Test token decrypted. Output will clear after 30 seconds.", "success");
      if (currentMode === "decrypt") {
        resetTimer = setTimeout(() => {
          purgeOutput();
          announce("Decrypted test result cleared.");
        }, 30000);
      }
    } catch (_) {
      announce(currentMode === "decrypt" ?
        "Cannot decrypt. Check the token and passphrase. Only synthetic TEST- IDs are supported." :
        "Encryption failed in this browser.", "error");
    } finally {
      busy = false;
      ui.run.disabled = false;
      ui.encryptTab.disabled = false;
      ui.decryptTab.disabled = false;
    }
  }

  ui.form.addEventListener("submit", run);
  ui.encryptTab.addEventListener("click", () => setMode("encrypt"));
  ui.decryptTab.addEventListener("click", () => setMode("decrypt"));
  ui.clear.addEventListener("click", () => { if (!busy) clearAll(); });
  ui.copy.addEventListener("click", async () => {
    if (mode !== "encrypt" || !ui.output.value) return;
    try {
      await navigator.clipboard.writeText(ui.output.value);
      announce("Encrypted test token copied. Review clipboard history when finished.", "success");
    } catch (_) {
      announce("Copy unavailable. Select the token and copy it manually.", "error");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (mode === "decrypt") purgeOutput();
      ui.source.value = "";
      ui.passphrase.value = "";
      ui.confirmPassphrase.value = "";
    }
  });
  window.addEventListener("pagehide", () => clearAll(false));
  setMode("encrypt");
})();
