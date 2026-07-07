// bin/attest-heartbeat.mjs — THE HEARTBEAT (ARCHITECTURE.draft-0 "the plaque index"; civic-node #88,
// "the husk is a heartbeat, not a grant"). Walks the plaque index and re-signs the dated receipt:
// "we hold what opens these, checked as of T, by us." Retiring data is CEASING TO ATTEST — stop
// re-signing and the stale face announces "not current" on its own; revocation erodes a cutout out of
// the next receipt, it never rewrites the past (the same lease idiom as atlas-index's `renewed`).
//
// The face is COARSE on purpose (committed bucketing): per bucket, a commitment over the sorted cutout
// ids (the root — a flat commitment for now; a true Merkle path structure is a later slice, noted in
// the open questions) plus a LOG-BAND count, never the exact figure. Exact membership is revealable on
// demand (bin/reveal). Mesh buckets carry their face value; the _sealed bucket bands blind.
//
//   bin/attest-heartbeat        # walk index/, compose + sign + write heartbeat.json
//   bin/attest-heartbeat fpr    # print the ledger signer's public fingerprint
// Env (ANTIDOTE_* overrides — see .github/actions/heartbeat):
//   ANTIDOTE_INDEX / ANTIDOTE_LEDGER / ANTIDOTE_LEDGER_KEY   as bin/punch
//   ANTIDOTE_HEARTBEAT   the signed receipt                        (default heartbeat.json)

import { readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { contentId, attest, loadOrCreateSigner, readJson } from "./attest.mjs";
import { readCharter } from "./judge-constitution.mjs";

// exact counts never sit on the face: 0, then log-ten bands. The band is the coarse standing.
export function band(n) {
  if (n <= 0) return "0";
  const lo = 10 ** Math.floor(Math.log10(n));
  return lo === 1 ? "1-9" : `${lo}-${lo * 10 - 1}`;
}

export function walkBuckets(indexDir) { // -> [{ scope, poll, bucket, face, ids: [sorted] }]
  const out = [];
  if (!existsSync(indexDir)) return out;
  const dirs = (p) => readdirSync(p).filter((d) => statSync(path.join(p, d)).isDirectory()).sort();
  for (const scope of dirs(indexDir)) for (const poll of dirs(path.join(indexDir, scope)))
    for (const bucket of dirs(path.join(indexDir, scope, poll))) {
      const dir = path.join(indexDir, scope, poll, bucket);
      const ids = readdirSync(dir).filter((f) => /^[0-9a-f]{64}\.json$/.test(f)).map((f) => "sha256:" + f.replace(/\.json$/, "")).sort();
      const face = readJson(path.join(dir, "face.json"), null);
      out.push({ scope, poll, bucket, face: face?.answer ?? null, ids });
    }
  return out;
}

// ---- the driver: walk -> commit -> band -> sign ------------------------------------------------------------
export async function runHeartbeat(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const indexDir = opts.indexDir || p("ANTIDOTE_INDEX", "index");
  const ledgerPath = opts.ledger || p("ANTIDOTE_LEDGER", "ledger/manifest.json");
  const outPath = opts.out || p("ANTIDOTE_HEARTBEAT", "heartbeat.json");
  const keyPath = opts.keyPath || p("ANTIDOTE_LEDGER_KEY", "keys/ledger-signer.pk8");

  const charter = readCharter(root);
  const signer = await loadOrCreateSigner(keyPath, { create: true });
  const buckets = [];
  for (const b of walkBuckets(indexDir)) buckets.push({ scope: b.scope, poll: b.poll, bucket: b.bucket,
    face: b.face, root: await contentId(b.ids), band: band(b.ids.length) });

  const ledger = readJson(ledgerPath, null);
  const heartbeat = await attest({
    schema: "antidote.heartbeat/v1", self: charter.id, constitution: charter.constitution, at,
    buckets, ledger_head: ledger?.head?.digest ?? null,
  }, signer);
  writeFileSync(outPath, JSON.stringify(heartbeat, null, 2) + "\n");
  writeFileSync(path.join(path.dirname(keyPath), "ledger.fpr"), signer.fingerprint + "\n"); // the public half rides beside the key
  return { heartbeat, outPath, signer };
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (process.argv[2] === "fpr") {
    const keyPath = process.env.ANTIDOTE_LEDGER_KEY || path.join(root, "keys/ledger-signer.pk8");
    console.log((await loadOrCreateSigner(keyPath, { create: true })).fingerprint);
    return;
  }
  const { heartbeat, signer } = await runHeartbeat(root);
  console.error(`heartbeat (${heartbeat.self}): ${heartbeat.buckets.length} bucket(s) attested as of ${heartbeat.at}`);
  console.error(`signer: ${signer.fingerprint}  (published at keys/ledger.fpr) -> heartbeat.json`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
