// bin/egress.mjs — THE TELEPORT, EGRESS HALF (docs/teleport.md; civic-node #91 "deflate/digest to the
// archive" + "flush = a presumed PR"). Takes one Atlas-managed pile's yield — the answers a question
// yielded out of the data pile that captured them, ALREADY DECRYPTED by the pile's own owner tooling
// (data-pile bin/decrypt; the ice stays the pile's business until the moment of the teleport) — and
// composes the sendable teleport bundle plus this side's custody record:
//
//   teleport.json    — antidote.teleport/v1: the raw records, their sorted content-id commitments, and
//                      a hash-chained digest (seq + prev_digest + commitments). This is the presumed
//                      PR's payload; the receiving server's bin/intake-verify re-derives every
//                      commitment and refuses records that aren't in the manifest.
//   egress ledger    — egress/ledger.json: the SAME append-log grammar as the intake ledger (hash-linked
//                      entries, head attested), recording custody OUT the way intake records custody IN.
//                      A teleport is one OUT entry here bound to one IN entry there by the same digest —
//                      that is what the append log looks like when data teleports away from a pile.
//
// THE COMMON CONSTITUTION rides the bundle: every record in one teleport is governed by the pile's
// COMMON CONSTITUTION (the Venn-diagram overlap of what all the captured answers allow — see
// docs/teleport.md). A record's own deeper constitution may ride along inside it; the receiving door
// records it SUBORDINATE, never governing.
//
//   bin/egress        # read the yield, write teleport.json + extend the egress ledger
// Env (ANTIDOTE_* overrides — see .github/actions/egress):
//   ANTIDOTE_EGRESS_IN    the pile yield: { pile, common_constitution, records:[...] }
//                         or a bare [ ...records ]                    (default _data/egress-records.json)
//   ANTIDOTE_TELEPORT_OUT the sendable bundle                         (default teleport.json)
//   ANTIDOTE_EGRESS_LEDGER the custody-out chain                      (default egress/ledger.json)
//   ANTIDOTE_EGRESS_KEY   the egress signer's pkcs8                   (default keys/egress-signer.pk8)
//   ANTIDOTE_PILE / ANTIDOTE_COMMON  pile id / COMMON CONSTITUTION hash when the yield is a bare array
//   ANTIDOTE_SELF         the charter (names `from`)                  (default antidote.yml)

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { contentId, attest, loadOrCreateSigner, readJson } from "./attest.mjs";
import { readCharter } from "./judge-constitution.mjs";

// a record's commitment: a sealed envelope already carries its id (commitment outside, guard #5);
// a plaintext record's id is computed here, over the canonical bytes everyone else will compute it over.
export async function commitmentOf(rec) {
  return typeof rec?.id === "string" && /^sha256:[0-9a-f]{64}$/.test(rec.id) && rec.env ? rec.id : contentId(rec);
}

// ---- the driver: yield -> commitments -> chained digest -> bundle + ledger --------------------------------
export async function runEgress(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const inPath = opts.records || p("ANTIDOTE_EGRESS_IN", "_data/egress-records.json");
  const outPath = opts.out || p("ANTIDOTE_TELEPORT_OUT", "teleport.json");
  const ledgerPath = opts.ledger || p("ANTIDOTE_EGRESS_LEDGER", "egress/ledger.json");
  const keyPath = opts.keyPath || p("ANTIDOTE_EGRESS_KEY", "keys/egress-signer.pk8");

  const charter = readCharter(root);
  const raw = readJson(inPath, []);
  const yield_ = Array.isArray(raw) ? { records: raw } : raw;
  const pile = opts.pile || yield_.pile || process.env.ANTIDOTE_PILE || null;
  const common = opts.common || yield_.common_constitution || process.env.ANTIDOTE_COMMON || null;
  if (!pile) throw new Error("egress: no pile named — a teleport leaves one pile at a time");
  if (!common) throw new Error("egress: no COMMON CONSTITUTION on the yield — no constitution, no catalog (guard #4)");

  // dedup by commitment at the door out, same arrival behavior as the door in.
  const seen = new Map();
  for (const rec of yield_.records || []) { const id = await commitmentOf(rec); if (!seen.has(id)) seen.set(id, rec); }
  const commitments = [...seen.keys()].sort();
  const records = commitments.map((id) => seen.get(id));

  // the chain: this teleport links to the last one out of this ledger, whatever pile it left.
  const ledger = readJson(ledgerPath, { schema: "antidote.egress-ledger/v1", entries: [], head: null });
  const prev = ledger.entries[ledger.entries.length - 1] || null;
  const seq = prev ? prev.seq + 1 : 0;
  const prevDigest = prev ? prev.digest : null;
  const digest = await contentId({ seq, prev_digest: prevDigest, commitments });

  const bundle = { schema: "antidote.teleport/v1", from: charter.id, pile, seq, prev_digest: prevDigest, at,
    common_constitution: common, commitments, digest, records };
  writeFileSync(outPath, JSON.stringify(bundle, null, 2) + "\n");

  const entry = { seq, at, pile, sent: commitments, digest, prev_hash: prev ? prev.this_hash : null };
  entry.this_hash = await contentId(entry);
  ledger.entries.push(entry);
  const signer = await loadOrCreateSigner(keyPath, { create: true });
  ledger.head = await attest({ seq, digest: await contentId(ledger.entries) }, signer);
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  writeFileSync(path.join(path.dirname(keyPath), "egress.fpr"), signer.fingerprint + "\n"); // the public half rides beside the key

  return { bundle, entry, outPath, signer };
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const { bundle } = await runEgress(root);
  console.error(`egress (${bundle.from}): teleport seq ${bundle.seq} — ${bundle.records.length} record(s) out of pile ${bundle.pile}, digest ${bundle.digest.slice(0, 23)}…`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
