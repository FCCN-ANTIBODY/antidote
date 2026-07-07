// bin/attest.mjs — THE VENDORED ATTESTATION CORE, byte-mirroring composer/sign.mjs (the same core the
// Atlas vendors into bin/drop.mjs / bin/dump.mjs / bin/atlas-index.mjs). Antidote keeps ONE copy that
// every verb imports, so the repo cannot drift against itself: a ballot's content-id here equals
// composer/ballot.mjs's ballotId, which is the whole reason the plaques work — the commitment IS the id
// everyone already has. No new crypto, boring on purpose (civic-node #88, "the public husk").
//
// Also carries the ledger-signer loader (the loadOrCreateSigner way — mirrors bin/atlas-index.mjs):
// the identity that signs the intake ledger's head and the heartbeat. Private key at
// keys/ledger-signer.pk8 (gitignored, base64 pkcs8), public fingerprint published at keys/ledger.fpr.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const te = new TextEncoder();
const subtle = globalThis.crypto.subtle;
export const b64 = (u8) => Buffer.from(u8).toString("base64");
export const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");

export function canonicalize(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
}
export async function defaultHash(bytes) { return "sha256:" + hex(new Uint8Array(await subtle.digest("SHA-256", bytes))); }
const fingerprint = async (rawPub) => "key:" + (await defaultHash(rawPub));
export async function contentId(obj) { return defaultHash(te.encode(canonicalize(obj))); } // == composer/ballot.mjs ballotId

export async function attest(obj, identity) {
  const rest = { ...obj }; delete rest.sig;
  const signature = new Uint8Array(await subtle.sign({ name: "Ed25519" }, identity.privateKey, te.encode(canonicalize(rest))));
  return { ...rest, sig: { alg: "ed25519", by: identity.fingerprint, key: b64(identity.raw), signature: b64(signature) } };
}
export async function verifyAttested(obj) {
  if (!obj || !obj.sig || obj.sig.alg !== "ed25519") return { ok: false, by: null, errors: ["no ed25519 sig"] };
  const rest = { ...obj }; delete rest.sig;
  try {
    const key = await subtle.importKey("raw", unb64(obj.sig.key), { name: "Ed25519" }, true, ["verify"]);
    const ok = await subtle.verify({ name: "Ed25519" }, key, unb64(obj.sig.signature), te.encode(canonicalize(rest)));
    const by = await fingerprint(unb64(obj.sig.key));
    if (!ok) return { ok: false, by, errors: ["signature does not verify"] };
    if (by !== obj.sig.by) return { ok: false, by, errors: ["key fingerprint != sig.by"] };
    return { ok: true, by, errors: [] };
  } catch (e) { return { ok: false, by: null, errors: ["verify threw: " + e.message] }; }
}
export async function generateIdentity() { // exported for tests
  const pair = await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const raw = new Uint8Array(await subtle.exportKey("raw", pair.publicKey));
  return { privateKey: pair.privateKey, raw, fingerprint: await fingerprint(raw) };
}

export async function loadOrCreateSigner(keyPath, { create = false } = {}) {
  if (existsSync(keyPath)) {
    const pk8 = unb64(readFileSync(keyPath, "utf8").trim());
    const privateKey = await subtle.importKey("pkcs8", pk8, { name: "Ed25519" }, true, ["sign"]);
    const jwk = await subtle.exportKey("jwk", privateKey);
    const raw = unb64(jwk.x.replace(/-/g, "+").replace(/_/g, "/"));
    return { privateKey, raw, fingerprint: await fingerprint(raw) };
  }
  if (!create) throw new Error(`antidote: no signer key at ${keyPath}`);
  const pair = await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pk8 = new Uint8Array(await subtle.exportKey("pkcs8", pair.privateKey));
  mkdirSync(path.dirname(keyPath), { recursive: true });
  writeFileSync(keyPath, b64(pk8) + "\n", { mode: 0o600 });
  const raw = new Uint8Array(await subtle.exportKey("raw", pair.publicKey));
  return { privateKey: pair.privateKey, raw, fingerprint: await fingerprint(raw), created: true };
}

// ---- tiny shared readers (the zero-dep way) ---------------------------------------------------------------
export function readJson(p, fallback) { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback; }
export function scalar(yml, key) { const m = yml.match(new RegExp(`^${key}:\\s*(.*)$`, "m")); return m ? m[1].replace(/\s+#.*$/, "").trim().replace(/^"(.*)"$/, "$1") : ""; }
