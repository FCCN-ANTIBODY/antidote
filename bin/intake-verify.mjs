// bin/intake-verify.mjs — THE INTAKE DOOR, first half (verify + judge; bin/punch is the second half).
// Reads one intake bundle — the presumed PR's payload (civic-node #91, "flush = a presumed PR") — and
// resolves every arrival into exactly one fate, written as intake.json for bin/punch to consume:
//
//   admit   — signature verifies (mesh class) or the commitment is well-formed (sealed class), deduped
//             by content-id, and the gateway admits its constitution against the server's declaration.
//   queue   — a constitution the lattice doesn't know: the arrival waits, human-paced, in
//             _data/constitution-queue.json. Nothing about it is archived yet.
//   refuse  — a bad signature, a malformed record, or a lattice-refused / absent constitution
//             (no constitution, no catalog — unless the charter stamps a default).
//
// PROVENANCE CLASS COMES FROM THE BYTES (guard #3), never from a label:
//   mesh   — a plaintext anecdote.ballot/v1, ed25519-signed, verify-from-anyone. Public-in-transit by
//            construction; its plaque may carry the readable envelope.
//   sealed — { id, env, pile, poll, scope?, ts? }: an age envelope with the content-id OUTSIDE it
//            (sign-then-encrypt, commitment outside — guard #5). We can verify shape, never contents;
//            its plaque is commitment-only, and the opening lives on the ice.
//
// THE CONSTITUTION AN ANSWER WEARS resolves in order: worn (a `constitution` field inside the signed
// record) > bundle (the flushing Atlas asserts one for the whole flush) > stamped (the charter's
// stamp_default, recorded as such) > refuse. The source is kept on the fate so a stamped record can
// never later pass as a worn one.
//
//   bin/intake-verify        # read the inbox, judge, write intake.json (+ grow the constitution queue)
// Env (ANTIDOTE_* overrides, the code-vs-data split — see .github/actions/intake):
//   ANTIDOTE_INTAKE_IN   inbox JSON: { from?, constitution?, ballots?:[...], sealed?:[...] }
//                        or a bare [ ...ballots ]                       (default _data/intake-inbox.json)
//   ANTIDOTE_INTAKE_OUT  the fate manifest                              (default intake.json)
//   ANTIDOTE_QUEUE       the human-paced constitution queue             (default _data/constitution-queue.json)
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
  const from = bundle.from || "carrier";

  // resolve the constitution each arrival wears: worn > bundle > stamped > (absent).
  const wornBy = (rec) => {
    if (rec.constitution) return { constitution: rec.constitution, constitution_source: "worn" };
    if (bundle.constitution) return { constitution: bundle.constitution, constitution_source: "bundle" };
    if (charter.stamp) return { constitution: charter.stamp, constitution_source: "stamped" };
    return { constitution: null, constitution_source: "absent" };
  };

  let received = 0, rejected = 0;
  const seen = new Map(); // id -> fate candidate (arrival-behavior dedup, as the Atlas's drop door)
  for (const b of bundle.ballots || []) {
    received++;
    if (!isBallot(b) || !(await verifyAttested(b)).ok) { rejected++; continue; }
    const id = await contentId(b);
    if (!seen.has(id)) seen.set(id, { id, class: "mesh", pile: b.pile, poll: b.poll,
      scope: b.scope || null, ts: b.ts, answer: b.answer, ...wornBy(b) });
  }
  for (const s of bundle.sealed || []) {
    received++;
    if (!isSealed(s)) { rejected++; continue; } // the commitment is outside; contents are not ours to open here
    if (!seen.has(s.id)) seen.set(s.id, { id: s.id, class: "sealed", pile: s.pile, poll: s.poll,
      scope: s.scope || null, ts: s.ts || null, ...wornBy(s) });
  }

  const admit = [], queue = [], refuse = [];
  for (const fate of seen.values()) {
    const verdict = judgeConstitution({ answer: fate.constitution, server: charter.constitution, lattice });
    const { answer, ...brief } = fate; // only ADMITTED fates keep their answer (bin/punch buckets by it)
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
