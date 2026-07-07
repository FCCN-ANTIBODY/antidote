// vault/keep.mjs — THE KEPT IDENTITY (the offline-origin path; docs/offline-origin.md). The user is
// their own secret vault: the device mints its Ed25519 identity with WebCrypto and KEEPS it — a
// non-extractable CryptoKey structured-cloned into origin-scoped IndexedDB, never serialized, never
// leaving the origin. This fills the seam composer/sign.mjs documented ("in production the private
// key should be non-extractable and stored as a CryptoKey in domain-scoped IndexedDB") that every
// prior caller left ephemeral.
//
// This is the mirror image of the enterprise path's workflow secret (ANTIDOTE_LEDGER_KEY): same
// signature grammar, opposite custody. A server's key is seated by an operator; the vault's key is
// minted by its holder, and nobody else ever holds it. Losing the device IS losing the key —
// revocation-by-nonce and re-minting are the recovery story, not escrow (the anecdote posture).
//
//   keepIdentity(store)  — load the kept identity, or mint one and keep it. Idempotent.
//   heldIdentity(store)  — load only; null if none is kept (the "have I been here before" probe).
//   shred(store)         — forget the identity (the destruct gesture; the chronicle is spared —
//                          two storage concerns, two keys, the sw.js "two layers" rule).

import { generateIdentity, fingerprint } from "./sign.mjs";

const IDENTITY_KEY = "identity";

async function rehydrate(held) {
  if (!held || !held.privateKey || !held.publicKey || !held.raw) return null;
  const raw = new Uint8Array(held.raw);
  return { privateKey: held.privateKey, publicKey: held.publicKey, raw, fingerprint: await fingerprint(raw) };
}

export async function heldIdentity(store) {
  return rehydrate(await store.get(IDENTITY_KEY));
}

export async function keepIdentity(store, opts = {}) {
  const held = await heldIdentity(store);
  if (held) return { ...held, minted: false };
  const identity = await generateIdentity(opts); // non-extractable by default — vault/sign.mjs
  await store.set(IDENTITY_KEY, { privateKey: identity.privateKey, publicKey: identity.publicKey, raw: identity.raw });
  return { ...identity, minted: true };
}

export async function shred(store) {
  await store.delete(IDENTITY_KEY);
}
