// bin/punch.mjs — THE PUNCH (ARCHITECTURE.draft-0 "the three layers"). Consumes intake.json (the fates
// bin/intake-verify resolved) plus the same inbox, and performs the admission — three writes, one gesture:
//
//   the plaques — index/<scope|_>/<poll>/<bucket>/<id>.json, one cutout per content-id (the write IS the
//                 dedup — arrival behavior, as the Atlas's drop-archive). A cutout is the PUNCHED record:
//                 THE WHOLE ENVELOPE, verbatim — every changing, esoteric property rides through — with
//                 exactly the damaged fields punched out (the denylist bin/intake-verify applied: mesh
//                 loses the respondent's credential, sealed loses the ciphertext) and the punch itself
//                 named on the face (`punched: [...]` — ownership of the damage). Mesh-class cutouts
//                 keep their answer in plaintext (public-in-transit by construction — the readable
//                 envelope); sealed-class cutouts sit in the "_sealed" bucket, commitment-only (their
//                 bucketing happens on the ice, and surfaces only as heartbeat bands). Buckets are dirs
//                 named by the answer's hash prefix, with the value on a face.json — free text makes a
//                 bad dirname and a fine face.
//   the ledger  — ledger/manifest.json, the append log proper: one hash-linked entry per punch recording
//                 the CUSTODY TRANSFER (who flushed what, when), head attested by the ledger signer.
//                 The PR queue and the provenance chain are the same object. A teleport's IN entry
//                 carries the bundle's digest, binding it to the OUT entry on the sender's egress
//                 ledger (docs/teleport.md).
//   the ice     — admitted RAW records staged to ice-outbox.json for delivery to the ice pile. The ice is
//                 an ordinary data-pile (pile-new --keygen, no keeper deviations — guard #7), NOT this
//                 repo; this seam is where the two meet. Damage is a publication act, never a storage
//                 act (guard #1): the plaque is punched, the outbox is not.
//
//   bin/punch        # read intake.json + the inbox, write cutouts + ledger entry + ice outbox
// Env (ANTIDOTE_* overrides — see .github/actions/intake):
//   ANTIDOTE_INTAKE_IN / ANTIDOTE_INTAKE_OUT   as bin/intake-verify
//   ANTIDOTE_INDEX      the plaque index root                      (default index)
//   ANTIDOTE_LEDGER     the intake ledger                          (default ledger/manifest.json)
//   ANTIDOTE_ICE_OUT    the staged raw admissions                  (default ice-outbox.json)
//   ANTIDOTE_LEDGER_KEY the ledger signer's pkcs8                  (default keys/ledger-signer.pk8)

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { contentId, attest, loadOrCreateSigner, readJson } from "./attest.mjs";
import { isSealed } from "./intake-verify.mjs";

export const SEALED_BUCKET = "_sealed";
export async function bucketOf(fate) {
  if (fate.class !== "mesh") return SEALED_BUCKET;
  return (await contentId(fate.envelope.answer)).replace(/^sha256:/, "").slice(0, 16);
}

// one punched cutout — what the public face holds forever: the whole frame, holes named.
export function cutout(fate, at) {
  const { id, class: cls, constitution, constitution_source, deeper_constitution, punched, envelope } = fate;
  return { schema: "antidote.cutout/v1", id, class: cls, constitution, constitution_source,
    ...(deeper_constitution ? { deeper_constitution } : {}), punched, punched_at: at, envelope };
}

// ---- the driver: fates -> cutouts + ledger entry + ice outbox ---------------------------------------------
export async function runPunch(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const intakePath = opts.intake || p("ANTIDOTE_INTAKE_OUT", "intake.json");
  const inboxPath = opts.inbox || p("ANTIDOTE_INTAKE_IN", "_data/intake-inbox.json");
  const indexDir = opts.indexDir || p("ANTIDOTE_INDEX", "index");
  const ledgerPath = opts.ledger || p("ANTIDOTE_LEDGER", "ledger/manifest.json");
  const iceOutPath = opts.iceOut || p("ANTIDOTE_ICE_OUT", "ice-outbox.json");
  const keyPath = opts.keyPath || p("ANTIDOTE_LEDGER_KEY", "keys/ledger-signer.pk8");

  const manifest = readJson(intakePath, null);
  if (!manifest || manifest.schema !== "antidote.intake/v1") throw new Error(`punch: no intake manifest at ${intakePath} — run bin/intake-verify first`);
  const admit = manifest.fates?.admit || [];

  // the plaques: one cutout per admitted content-id, and a face.json naming each mesh bucket's value.
  const punched = [];
  for (const fate of admit) {
    const bucket = await bucketOf(fate);
    const dir = path.join(indexDir, fate.scope || "_", fate.poll, bucket);
    mkdirSync(dir, { recursive: true });
    if (fate.class === "mesh") {
      const facePath = path.join(dir, "face.json");
      if (!existsSync(facePath)) writeFileSync(facePath, JSON.stringify({ schema: "antidote.face/v1", answer: fate.envelope.answer }, null, 2) + "\n");
    }
    const file = path.join(dir, fate.id.replace(/^sha256:/, "") + ".json");
    if (!existsSync(file)) { // arrival behavior: the first write wins, a re-flush is a no-op
      writeFileSync(file, JSON.stringify(cutout(fate, at), null, 2) + "\n");
      punched.push(path.relative(root, file));
    }
  }

  // the ice: stage the admitted RAW records (unpunched) for delivery to the ice pile.
  const inbox = readJson(inboxPath, []);
  const bundle = Array.isArray(inbox) ? { ballots: inbox } : inbox;
  const arrivals = bundle.schema === "antidote.teleport/v1" ? (bundle.records || [])
    : [...(bundle.ballots || []), ...(bundle.sealed || [])];
  const admitted = new Set(admit.map((f) => f.id));
  const raw = [];
  for (const rec of arrivals) if (admitted.has(isSealed(rec) ? rec.id : await contentId(rec))) raw.push(rec);
  writeFileSync(iceOutPath, JSON.stringify({ schema: "antidote.ice-outbox/v1", at, from: manifest.from, records: raw }, null, 2) + "\n");

  // the ledger: one hash-linked custody entry, head attested by the ledger signer.
  const ledger = readJson(ledgerPath, { schema: "antidote.ledger/v1", entries: [], head: null });
  const prev = ledger.entries[ledger.entries.length - 1] || null;
  const entry = { seq: prev ? prev.seq + 1 : 0, at, from: manifest.from,
    ...(manifest.teleport ? { teleport: manifest.teleport } : {}),
    admitted: admit.map((f) => f.id).sort(), queued: manifest.fates.queue.length, refused: manifest.fates.refuse.length,
    prev_hash: prev ? prev.this_hash : null };
  entry.this_hash = await contentId(entry);
  ledger.entries.push(entry);
  const signer = await loadOrCreateSigner(keyPath, { create: true });
  ledger.head = await attest({ seq: entry.seq, digest: await contentId(ledger.entries) }, signer);
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  writeFileSync(path.join(path.dirname(keyPath), "ledger.fpr"), signer.fingerprint + "\n"); // the public half rides beside the key

  return { punched, entry, iceOutPath, signer };
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const { punched, entry } = await runPunch(root);
  console.error(`punch: ${punched.length} cutout(s) punched, ledger seq ${entry.seq} (${entry.admitted.length} admitted from ${entry.from})`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
