"use strict";
/*
 * Generic, browser-only encryption demonstration.
 * Test and non-sensitive text only; no external dependencies, network calls or data persistence.
 */
(() => {
  const PREFIX = "ENC1.";
  const AAD = new TextEncoder().encode("JAREV|TextEncryption|v1");
  const ROUNDS = 600000;
  const SALT_SIZE = 16;
  const IV_SIZE = 12;
  const MAX_PLAIN_BYTES = 16384;
  const MAX_TOKEN_LENGTH = 24000;
  const el = id => document.getElementById(id);
  const ui = {
    form: el("cryptoForm"), encryptTab: el("encryptTab"), decryptTab: el("decryptTab"),
    source: el("source"), sourceLabel: el("sourceLabel"), sourceHint: el("sourceHint"),
    passphrase: el("passphrase"), confirmPassphrase: el("confirmPassphrase"),
    confirmRow: el("confirmRow"), run: el("runButton"), clear: el("clearButton"),
    status: el("status"), outputBlock: el("outputBlock"), output: el("output"),
    outputLabel: el("outputLabel"), outputHint: el("outputHint"), copy: el("copyButton")
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
    ui.sourceLabel.textContent = enc ? "Text to encrypt" : "Encrypted token";
    ui.source.placeholder = enc ? "Example: A message for testing" : "ENC1. ...";
    ui.sourceHint.textContent = enc ?
      "Up to 8,192 characters. Use non-sensitive sample text." :
      "Paste a token created with this general-purpose tool.";
    ui.confirmRow.hidden = !enc;
    ui.outputLabel.textContent = enc ? "Encrypted token" : "Decrypted text";
    ui.run.textContent = enc ? "Encrypt text" : "Decrypt token";
    ui.copy.hidden = !enc;
    ui.outputHint.textContent = enc ?
      "Clipboard managers and clipboard history may retain copied tokens." :
      "The decrypted output clears after 30 seconds or when this page is hidden.";
    ui.source.maxLength = enc ? 8192 : MAX_TOKEN_LENGTH;
    ui.source.rows = enc ? 4 : 5;
  }
  function toB64Url(bytes) {
    let s = "";
    for (const byte of bytes) s += String.fromCharCode(byte);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function fromB64Url(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error("Invalid token encoding");
    const input = s.replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(input + "=".repeat((4 - input.length % 4) % 4)), c => c.charCodeAt(0));
  }
  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {name: "PBKDF2", hash: "SHA-256", salt, iterations: ROUNDS},
      base, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]
    );
  }
  async function encrypt(text, password) {
    const plain = new TextEncoder().encode(text);
    if (plain.length > MAX_PLAIN_BYTES) throw new Error("Text is too long");
    const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));
    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const key = await deriveKey(password, salt);
    const cipher = new Uint8Array(await crypto.subtle.encrypt(
      {name: "AES-GCM", iv, additionalData: AAD, tagLength: 128}, key, plain
    ));
    const combined = new Uint8Array(SALT_SIZE + IV_SIZE + cipher.length);
    combined.set(salt);
    combined.set(iv, SALT_SIZE);
    combined.set(cipher, SALT_SIZE + IV_SIZE);
    return PREFIX + toB64Url(combined);
  }
  async function decrypt(token, password) {
    if (!token.startsWith(PREFIX) || token.length > MAX_TOKEN_LENGTH) throw new Error("Unknown token format");
    const combined = fromB64Url(token.slice(PREFIX.length));
    if (combined.length < SALT_SIZE + IV_SIZE + 16 ||
        combined.length > SALT_SIZE + IV_SIZE + MAX_PLAIN_BYTES + 16) {
      throw new Error("Invalid token length");
    }
    const salt = combined.slice(0, SALT_SIZE);
    const iv = combined.slice(SALT_SIZE, SALT_SIZE + IV_SIZE);
    const cipher = combined.slice(SALT_SIZE + IV_SIZE);
    const key = await deriveKey(password, salt);
    const plain = await crypto.subtle.decrypt(
      {name: "AES-GCM", iv, additionalData: AAD, tagLength: 128}, key, cipher
    );
    return new TextDecoder("utf-8", {fatal: true}).decode(plain);
  }
  async function run(event) {
    event.preventDefault();
    if (busy) return;
    purgeOutput();
    if (!window.isSecureContext || !window.crypto || !crypto.subtle) {
      announce("Web Crypto requires HTTPS and a supported browser.", "error");
      return;
    }
    const source = mode === "encrypt" ? ui.source.value : ui.source.value.trim();
    const password = ui.passphrase.value;
    if (!source || !source.trim()) {
      announce(mode === "encrypt" ? "Enter some sample text." : "Paste an encrypted token.", "error");
      return;
    }
    if (password.length < 20) {
      announce("Use a passphrase with at least 20 characters.", "error");
      return;
    }
    if (mode === "encrypt" && password !== ui.confirmPassphrase.value) {
      announce("Passphrases do not match.", "error");
      return;
    }
    const currentMode = mode;
    busy = true;
    ui.run.disabled = true;
    ui.encryptTab.disabled = true;
    ui.decryptTab.disabled = true;
    announce("Processing in your browser…");
    try {
      const result = currentMode === "encrypt" ?
        await encrypt(source, password) : await decrypt(source, password);
      ui.output.value = result;
      ui.outputBlock.hidden = false;
      ui.source.value = "";
      ui.passphrase.value = "";
      ui.confirmPassphrase.value = "";
      announce(currentMode === "encrypt" ?
        "Encrypted token created. Preserve your passphrase to decrypt it later." :
        "Token decrypted. The result clears after 30 seconds.", "success");
      if (currentMode === "decrypt") {
        resetTimer = setTimeout(() => {
          purgeOutput();
          announce("Decrypted output cleared.");
        }, 30000);
      }
    } catch (_) {
      announce(currentMode === "encrypt" ?
        "Encryption failed or input exceeded the supported size." :
        "Unable to decrypt. Check the passphrase and ensure the token starts with ENC1.", "error");
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
      announce("Encrypted token copied. Consider clearing clipboard history afterwards.", "success");
    } catch (_) {
      announce("Clipboard unavailable. Select and copy the token manually.", "error");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearAll(false);
  });
  window.addEventListener("pagehide", () => clearAll(false));
  setMode("encrypt");
})();
