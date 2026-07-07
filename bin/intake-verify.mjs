// bin/intake-verify.mjs — THE INTAKE DOOR, first half (verify + judge; bin/punch is the second half).
// Reads one intake bundle — the presumed PR's payload (civic-node #91, "flush = a presumed PR") — and
// resolves every arrival into exactly one fate, written as intake.json for bin/punch to consume:
//
//   admit   — signature verifies (mesh class) or the commitment is well-formed (sealed class), deduped
//             by content-id, and the gateway admits its governing constitution against the server's
//             declaration.
//   queue   — a constitution the lattice doesn't know: the arrival waits, human-paced, in
//             _data/constitution-queue.json. Nothing about it is archived yet.
//   refuse  — a bad signature, a malformed record, or a lattice-refused / absent constitution
//             (no constitution, no catalog — unless the charter stamps a default).
//
// TWO BUNDLE KINDS, one door:
//
//   loose mail — { from?, constitution?, ballots?:[...], sealed?:[...] } or a bare [ ...ballots ]:
//             hand-carried scraps. The governing constitution resolves worn > bundle > stamped >
//             refuse, and the source is kept on the fate so a stamped record can never later pass
//             as a worn one.
//   teleport — antidote.teleport/v1 (bin/egress's output; docs/teleport.md): one pile's yield leaving
//             together. THE COMMON CONSTITUTION governs every record in the bundle (source: common) —
//             the Venn-diagram overlap of what all the captured answers allow. A record's own deeper
//             constitution is recorded on the fate as deeper_constitution, SUBORDINATE: it can matter
//             later only inside whatever secondary-use carve-out the COMMON CONSTITUTION makes, and
//             it never touches admission. The bundle's chained digest is re-derived and must verify
//             (a tampered teleport is refused whole); records outside the commitments are rejected.
//
// PROVENANCE CLASS COMES FROM THE BYTES (guard #3), never from a label:
//   mesh   — a plaintext anecdote.ballot/v1, ed25519-signed, verify-from-anyone. Public-in-transit by
//            construction; its plaque keeps the readable envelope.
//   sealed — { id, env, pile, poll, ... }: an age envelope with the content-id OUTSIDE it
//            (sign-then-encrypt, commitment outside — guard #5). We can verify shape, never contents;
//            its plaque is commitment-only, and the opening lives on the ice.
//
// THE ENVELOPE IS THE FRAME. Ballot properties keep changing and growing esoteric corners; the plaque
// stores the WHOLE envelope with the damaged content punched out, so the punch is a DENYLIST, never a
// whitelist: everything on the envelope rides through verbatim except exactly the fields the class
// punches (mesh: the respondent's credential; sealed: the ciphertext). The fate carries the
// already-punched envelope — intake.json is public, so nothing punched ever sits in it.
//
//   bin/intake-verify        # read the inbox, judge, write intake.json (+ grow the constitution queue)
// Env (ANTIDOTE_* overrides, the code-vs-data split — see .github/actions/intake):
//   ANTIDOTE_INTAKE_IN   the inbox: loose mail or a teleport bundle    (default _data/intake-inbox.json)
//   ANTIDOTE_INTAKE_OUT  the fate manifest                             (default intake.json)
//   ANTIDOTE_QUEUE       the human-paced constitution queue            (default _data/constitution-queue.json)
//   ANTIDOTE_SELF / ANTIDOTE_LATTICE   as bin/judge-constitution

import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { contentId, verifyAttested, readJson } from "./attest.mjs";
import { judgeConstitution, readCharter, readLattice } from "./judge-constitution.mjs";

const BALLOT_SCHEMA = "anecdote.ballot/v1";
export function isBallot(b) {
  return !!b && b.schema === BALLOT_SCHEMA && typeof b.pile === "string" && typeof b.poll === "string" &&
    typeof b.answer === "string" && !!b.ts && !!b.sig;
}
export function isSealed(s) {
  return !!s && typeof s.id === "string" && /^sha256:[0-9a-f]{64}$/.test(s.id) &&
    typeof s.env === "string" && s.env.length > 0 && typeof s.pile === "string" && typeof s.poll === "string";
}

// what each class punches out of its envelope — the denylist, and the whole of the damage.
export const PUNCH = { mesh: ["sig"], sealed: ["env"] };
export function punchEnvelope(record, cls) {
  const drop = new Set(PUNCH[cls] || []);
  const envelope = {};
  for (const [k, v] of Object.entries(record)) if (!drop.has(k) && v !== undefined) envelope[k] = v;
  return { envelope, punched: [...drop].filter((k) => k in record).sort() };
}

// ---- the driver: verify -> dedup -> judge -> fates --------------------------------------------------------
export async function runIntake(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const inboxPath = opts.inbox || p("ANTIDOTE_INTAKE_IN", "_data/intake-inbox.json");
  const outPath = opts.out || p("ANTIDOTE_INTAKE_OUT", "intake.json");
  const queuePath = opts.queue || p("ANTIDOTE_QUEUE", "_data/constitution-queue.json");

  const charter = readCharter(root);
  const lattice = readLattice(root);
  const inbox = readJson(inboxPath, []);
  const bundle = Array.isArray(inbox) ? { ballots: inbox } : inbox;
  const teleport = bundle.schema === "antidote.teleport/v1";
  const from = bundle.from || "carrier";

  // a teleport must verify whole before any record is considered: re-derive the chained digest.
  let allowed = null; // commitments a teleport admits records against
  if (teleport) {
    const expect = await contentId({ seq: bundle.seq, prev_digest: bundle.prev_digest ?? null, commitments: bundle.commitments || [] });
    if (expect !== bundle.digest) throw new Error(`intake: teleport digest does not verify (${inboxPath}) — refusing the bundle whole`);
    allowed = new Set(bundle.commitments || []);
  }

  // the constitution that GOVERNS admission. Loose mail: worn > bundle > stamped > (absent).
  // A teleport: the COMMON CONSTITUTION, full stop; a worn one is recorded deeper, subordinate.
  const governs = (rec) => {
    if (teleport) return { constitution: bundle.common_constitution || null, constitution_source: "common",
      ...(rec.constitution ? { deeper_constitution: rec.constitution } : {}) };
    if (rec.constitution) return { constitution: rec.constitution, constitution_source: "worn" };
    if (bundle.constitution) return { constitution: bundle.constitution, constitution_source: "bundle" };
    if (charter.stamp) return { constitution: charter.stamp, constitution_source: "stamped" };
    return { constitution: null, constitution_source: "absent" };
  };

  // one stream of arrivals; the bytes decide the class. A teleport carries both kinds in `records`.
  const arrivals = teleport ? (bundle.records || []) : [...(bundle.ballots || []), ...(bundle.sealed || [])];
  let received = 0, rejected = 0;
  const seen = new Map(); // id -> fate (arrival-behavior dedup, as the Atlas's drop door)
  for (const rec of arrivals) {
    received++;
    let cls = null, id = null;
    if (isBallot(rec) && (await verifyAttested(rec)).ok) { cls = "mesh"; id = await contentId(rec); }
    else if (isSealed(rec)) { cls = "sealed"; id = rec.id; } // the commitment is outside; contents are not ours to open here
    if (!cls || (allowed && !allowed.has(id))) { rejected++; continue; } // a record outside its teleport's commitments is nobody's
    if (seen.has(id)) continue;
    const { envelope, punched } = punchEnvelope(rec, cls);
    seen.set(id, { id, class: cls, pile: rec.pile, poll: rec.poll, scope: rec.scope || null,
      ...governs(rec), punched, envelope });
  }

  const admit = [], queue = [], refuse = [];
  for (const fate of seen.values()) {
    const verdict = judgeConstitution({ answer: fate.constitution, server: charter.constitution, lattice });
    const { envelope, punched, ...brief } = fate; // only ADMITTED fates keep their envelope (bin/punch files it)
    if (verdict === "admit") admit.push(fate);
    else if (verdict === "queue") queue.push(brief);
    else refuse.push({ ...brief, reason: fate.constitution ? "lattice refuses" : "no constitution, no catalog" });
  }

  // queued arrivals wait where a human will see them; the advisory judge may annotate, never admit.
  if (queue.length) {
    const held = readJson(queuePath, { schema: "antidote.constitution-queue/v1", waiting: [] });
    const already = new Set(held.waiting.map((w) => w.id));
    for (const f of queue) if (!already.has(f.id))
      held.waiting.push({ id: f.id, constitution: f.constitution, from, at, opinion: null });
    writeFileSync(queuePath, JSON.stringify(held, null, 2) + "\n");
  }

  const manifest = {
    schema: "antidote.intake/v1", self: charter.id, constitution: charter.constitution, from, at,
    ...(teleport ? { teleport: { pile: bundle.pile, seq: bundle.seq, digest: bundle.digest } } : {}),
    received, rejected, kept: seen.size,
    fates: { admit, queue, refuse },
  };
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  return { manifest, outPath };
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const { manifest } = await runIntake(root);
  const f = manifest.fates;
  console.error(`intake (${manifest.self}): ${manifest.kept} kept / ${manifest.rejected} rejected — ` +
    `${f.admit.length} admit, ${f.queue.length} queue, ${f.refuse.length} refuse`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
