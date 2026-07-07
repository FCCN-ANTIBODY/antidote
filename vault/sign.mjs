// vault/sign.mjs — THE VENDORED ATTESTATION CORE for the offline origin, byte-mirroring
// anecdote.channel composer/sign.mjs (the same core bin/attest.mjs mirrors for the enterprise path,
// and the Atlas vendors into its bin tools). One signature grammar for the whole constellation:
//
//   sig: { alg: "ed25519", by: "key:sha256:<hex>", key: "<b64 raw pub>", signature: "<b64>" }
//
// Because this mirrors composer/sign.mjs exactly, an identity minted HERE is the same kind of thing
// as an identity minted in the anecdote app — same fingerprint format, same canonical bytes, same
// verify — so the two systems share identity BY CONSTRUCTION. (Sharing a specific key across
// origins is a deliberate export gesture, never ambient — the met/meet idiom; see
// docs/offline-origin.md.)
//
// Pure core: no DOM, no network, no storage. WebCrypto behind one seam (opts.subtle), portable
// base64 (Buffer or btoa), defaultHash portable to Node — every module here runs in the browser and
// under node test/*.test.mjs unchanged.

export const SIG_ALG = "ed25519";
const ALG = { name: "Ed25519" };

function subtleOf(opts = {}) {
  const s = opts.subtle || (globalThis.crypto && globalThis.crypto.subtle);
  if (!s) throw new Error("sign: no WebCrypto SubtleCrypto available");
  return s;
}

// ---- hashing (the anecdote defaultHash: "sha256:<hex>", browser subtle or node:crypto) ------------
const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function defaultHash(bytes) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (subtle) return "sha256:" + hex(new Uint8Array(await subtle.digest("SHA-256", bytes)));
  const { createHash } = await import("node:crypto");
  return "sha256:" + createHash("sha256").update(bytes).digest("hex");
}

// Content-address any object: hash of its canonical bytes. == composer/ballot.mjs ballotId when the
// object is a signed ballot — the id everyone in the constellation already computes.
export async function contentId(obj) {
  return defaultHash(new TextEncoder().encode(canonicalize(obj)));
}

// ---- identity ------------------------------------------------------------------------------------

// A fresh device identity. `extractable` defaults FALSE here (unlike the demo-portable composer
// core): the offline origin persists the CryptoKey itself in origin-scoped IndexedDB (vault/keep.mjs)
// and never serializes the private half — the production posture composer/sign.mjs documents.
export async function generateIdentity(opts = {}) {
  const subtle = subtleOf(opts);
  const pair = await subtle.generateKey(ALG, opts.extractable === true, ["sign", "verify"]);
  const raw = new Uint8Array(await subtle.exportKey("raw", pair.publicKey)); // public half is always exportable
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, raw, fingerprint: await fingerprint(raw) };
}

// Content-address a public key: "key:sha256:<hex>" — a key id and a content id are the same kind of thing.
export async function fingerprint(rawPub) {
  return "key:" + (await defaultHash(rawPub));
}

export function exportPublic(identity) { return b64(identity.raw); }

export async function importPublic(b64str, opts = {}) {
  const subtle = subtleOf(opts);
  return subtle.importKey("raw", unb64(b64str), ALG, true, ["verify"]);
}

// ---- canonical bytes (deterministic; sign and verify MUST agree) ---------------------------------
export function canonicalize(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
}

// ---- attest / verify (generic: sign ANY object) ---------------------------------------------------
export async function attest(obj, identity, opts = {}) {
  const subtle = subtleOf(opts);
  const rest = { ...obj }; delete rest.sig;
  const bytes = new TextEncoder().encode(canonicalize(rest));
  const signature = new Uint8Array(await subtle.sign(ALG, identity.privateKey, bytes));
  return { ...rest, sig: { alg: SIG_ALG, by: identity.fingerprint, key: exportPublic(identity), signature: b64(signature) } };
}

export async function verifyAttestation(obj, opts = {}) {
  const errors = [];
  if (!obj || !obj.sig) return { ok: false, by: null, alg: null, errors: ["no sig"] };
  const { sig } = obj;
  if (sig.alg !== SIG_ALG) return { ok: false, by: sig.by || null, alg: sig.alg, errors: [`unsupported alg ${sig.alg}`] };
  const subtle = subtleOf(opts);
  const rest = { ...obj }; delete rest.sig;
  const bytes = new TextEncoder().encode(canonicalize(rest));
  let ok = false;
  try {
    const key = await importPublic(sig.key, opts);
    ok = await subtle.verify(ALG, key, unb64(sig.signature), bytes);
  } catch (e) { errors.push("verify threw: " + e.message); }
  if (!ok) errors.push("signature does not verify");
  const expect = await fingerprint(unb64(sig.key));
  if (expect !== sig.by) errors.push(`key fingerprint ${expect} != sig.by ${sig.by}`);
  return { ok: ok && errors.length === 0, by: sig.by || null, alg: sig.alg, errors };
}

// ---- env-portable base64 (no deps) ----------------------------------------------------------------
export function b64(u8) {
  if (typeof Buffer !== "undefined") return Buffer.from(u8).toString("base64");
  let s = ""; for (const x of u8) s += String.fromCharCode(x); return btoa(s);
}
export function unb64(s) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(s, "base64"));
  const bin = atob(s); const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8;
}
