// Unit: the intake door — bin/judge-constitution.mjs (the lattice and the queue), bin/intake-verify.mjs
// (verify + dedup + judge -> fates), bin/punch.mjs (cutouts + ledger + ice outbox). The heartbeat and the
// re-insertion check live in test/heartbeat.test.mjs. Run: node test/intake.test.mjs
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { attest, generateIdentity, contentId, verifyAttested } from "../bin/attest.mjs";
import { judgeConstitution } from "../bin/judge-constitution.mjs";
import { runIntake } from "../bin/intake-verify.mjs";
import { runPunch, SEALED_BUCKET, bucketOf } from "../bin/punch.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const NOW = "2026-07-07T12:00:00.000Z";
const S = "sha256:" + "5".repeat(64); // the constitution this scratch server wears
const OTHER = "sha256:" + "0".repeat(64);
const HOSTILE = "sha256:" + "f".repeat(64);

const me = await generateIdentity();
const ballot = (over = {}) => attest({ schema: "anecdote.ballot/v1", pile: "cd04-q1", poll: "budget",
  answer: "Keep", ts: "2026-07-04T18:00:00Z", scope: "colorado", ...over }, me);
const sealed = (over = {}) => ({ id: "sha256:" + "a".repeat(64), env: "YWdlLWNpcGhlcnRleHQ=",
  pile: "cd04-q1", poll: "budget", scope: "colorado", ...over });

function scratch({ inbox = {}, stamp = "", lattice } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "antidote-intake-"));
  mkdirSync(path.join(dir, "_data"), { recursive: true });
  writeFileSync(path.join(dir, "antidote.yml"), `id: scratch\ncategory: ""\nconstitution: "${S}"\nstamp_default: "${stamp}"\n`);
  writeFileSync(path.join(dir, "_data/lattice.json"), JSON.stringify(lattice ?? { schema: "antidote.lattice/v1", permits: {}, refuses: {} }));
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify(inbox));
  return dir;
}

// 1. the pure gateway: admit / refuse / queue, exactly as the lattice says — and no further.
{
  const lattice = { permits: { [OTHER]: [S] }, refuses: { [HOSTILE]: [S] } };
  ok(judgeConstitution({ answer: S, server: S }) === "admit", "identical hashes admit");
  ok(judgeConstitution({ answer: OTHER, server: S, lattice }) === "admit", "the lattice's permits admit");
  ok(judgeConstitution({ answer: HOSTILE, server: S, lattice }) === "refuse", "the lattice's refuses refuse (explicit, never inferred)");
  ok(judgeConstitution({ answer: "sha256:" + "9".repeat(64), server: S, lattice }) === "queue", "a novel constitution queues — the judge is never the sole gate");
  ok(judgeConstitution({ answer: null, server: S }) === "refuse", "no constitution, no catalog");
  ok(judgeConstitution({ answer: S, server: "" }) === "refuse", "an unchartered server admits nothing");
}

// 2. verify-from-anyone + dedup: a tampered ballot is rejected; the same ballot twice keeps once.
{
  const good = await ballot();
  const bad = { ...(await ballot({ answer: "Cut" })), answer: "Cutx" }; // mutate after signing -> sig fails
  const dir = scratch({ inbox: { from: "colorado", constitution: S, ballots: [good, { ...good }, bad] } });
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.received === 3 && manifest.rejected === 1 && manifest.kept === 1, "tampered rejected, duplicate collapsed (arrival behavior)");
  ok(manifest.fates.admit.length === 1 && manifest.fates.admit[0].class === "mesh", "the survivor admits as mesh class — plaintext-signed bytes decide");
}

// 3. sealed arrivals: a well-formed commitment admits as sealed; a malformed one is rejected.
{
  const dir = scratch({ inbox: { from: "colorado", constitution: S, sealed: [sealed(), sealed({ id: "not-a-hash" })] } });
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.kept === 1 && manifest.fates.admit[0].class === "sealed", "sealed class from the bytes: commitment outside, contents not ours to open");
  ok(manifest.rejected === 1, "a malformed commitment is rejected");
  ok(!("answer" in manifest.fates.admit[0]) || manifest.fates.admit[0].answer === undefined, "a sealed fate carries no answer");
}

// 4. the constitution resolves worn > bundle > stamped > refuse, and the source is kept honest.
{
  const worn = await ballot({ constitution: OTHER, answer: "Worn" });
  const bare = await ballot({ answer: "Bare" });
  const lattice = { permits: { [OTHER]: [S] }, refuses: {} };
  const dir = scratch({ inbox: { from: "colorado", constitution: S, ballots: [worn, bare] }, lattice });
  const { manifest } = await runIntake(dir, { now: NOW });
  const src = Object.fromEntries(manifest.fates.admit.map((f) => [f.envelope.answer, [f.constitution, f.constitution_source]]));
  ok(src.Worn?.[0] === OTHER && src.Worn?.[1] === "worn", "a worn constitution outranks the bundle's");
  ok(src.Bare?.[0] === S && src.Bare?.[1] === "bundle", "a bare record wears the bundle's assertion");
}
{
  const dir = scratch({ inbox: { from: "carrier", ballots: [await ballot()] } }); // no bundle constitution, no stamp
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.fates.refuse.length === 1 && manifest.fates.refuse[0].reason === "no constitution, no catalog", "bare + no stamp -> refused, with the guard named");
}
{
  const dir = scratch({ inbox: { from: "carrier", ballots: [await ballot()] }, stamp: S });
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.fates.admit[0]?.constitution_source === "stamped", "the charter's stamp admits a bare record — recorded as stamped, never passable as worn");
}

// 5. a novel constitution queues, waits in the queue file, and is NOT archived by punch.
{
  const novel = "sha256:" + "9".repeat(64);
  const dir = scratch({ inbox: { from: "colorado", constitution: novel, ballots: [await ballot()] } });
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.fates.queue.length === 1, "novel constitution -> queue fate");
  const q = JSON.parse(readFileSync(path.join(dir, "_data/constitution-queue.json"), "utf8"));
  ok(q.waiting.length === 1 && q.waiting[0].constitution === novel && q.waiting[0].opinion === null, "the arrival waits, human-paced, opinion empty");
  const { punched } = await runPunch(dir, { now: NOW });
  ok(punched.length === 0, "nothing queued is punched");
}

// 5b. fill/limit advisory (slice 5): when the lattice ANNOTATES the server constitution as limiting,
//     a queued arrival carries the advisory — the closed list in front of the human — but the VERDICT
//     is unchanged (still a queue: the reading is never the gate).
{
  const novel = "sha256:" + "9".repeat(64);
  const lattice = { schema: "antidote.lattice/v1", permits: {}, refuses: {},
    shapes: { [S]: { shape: "limiting", questions: ["Cut or keep the dog park?", "Fund the pool?"] } } };
  const dir = scratch({ inbox: { from: "colorado", constitution: novel, ballots: [await ballot()] }, lattice });
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.fates.queue.length === 1, "still queues — the advisory changed no verdict");
  const q = JSON.parse(readFileSync(path.join(dir, "_data/constitution-queue.json"), "utf8"));
  ok(q.waiting[0].opinion && /limits to a closed set of 2 questions/.test(q.waiting[0].opinion.advisory),
    "the queued entry now carries the limiting advisory");
  ok(JSON.stringify(q.waiting[0].opinion.questions) === JSON.stringify(["Cut or keep the dog park?", "Fund the pool?"]),
    "the closed list rides to the human on the queue entry");
}

// 6. punch: cutouts land content-addressed per bucket; the cutout is THE WHOLE ENVELOPE, holes named.
{
  const keep = await ballot({ hue: "cerulean" }); // an esoteric envelope property — the frame keeps growing
  const cut = await ballot({ answer: "Cut" });
  const dir = scratch({ inbox: { from: "colorado", constitution: S, ballots: [keep, cut], sealed: [sealed()] } });
  await runIntake(dir, { now: NOW });
  const { punched, entry } = await runPunch(dir, { now: NOW });
  ok(punched.length === 3, "three cutouts punched");
  const keepBucket = await bucketOf({ class: "mesh", envelope: { answer: "Keep" } });
  const keepPath = path.join(dir, "index/colorado/budget", keepBucket, (await contentId(keep)).replace(/^sha256:/, "") + ".json");
  ok(existsSync(keepPath), "a mesh cutout lands at index/<scope>/<poll>/<bucket>/<id>.json");
  const c = JSON.parse(readFileSync(keepPath, "utf8"));
  ok(!c.envelope.sig && c.envelope.answer === "Keep" && c.class === "mesh", "the cutout keeps the readable envelope and NOTHING of the respondent");
  ok(c.envelope.hue === "cerulean", "an esoteric envelope property rides through verbatim — the punch is a denylist, never a whitelist");
  ok(JSON.stringify(c.punched) === JSON.stringify(["sig"]), "the damage is named on the face — ownership of the redaction");
  const face = JSON.parse(readFileSync(path.join(dir, "index/colorado/budget", keepBucket, "face.json"), "utf8"));
  ok(face.answer === "Keep", "the bucket's face names its value");
  const sealedCut = JSON.parse(readFileSync(path.join(dir, "index/colorado/budget", SEALED_BUCKET, "a".repeat(64) + ".json"), "utf8"));
  ok(!sealedCut.envelope.env && JSON.stringify(sealedCut.punched) === JSON.stringify(["env"]), "a sealed cutout sits commitment-only in _sealed: ciphertext punched, envelope kept");
  ok(entry.admitted.length === 3 && entry.prev_hash === null, "the first ledger entry roots the chain");
}

// 7. the ledger chains and its head verifies; the ice outbox stages the RAW records, unpunched.
{
  const b = await ballot();
  const dir = scratch({ inbox: { from: "colorado", constitution: S, ballots: [b] } });
  await runIntake(dir, { now: NOW });
  const first = await runPunch(dir, { now: NOW });
  const again = await runPunch(dir, { now: NOW }); // a re-flush: no new cutouts, but custody is re-recorded
  ok(again.punched.length === 0, "re-punching the same intake is a no-op on the plaques (the write IS the dedup)");
  const ledger = JSON.parse(readFileSync(path.join(dir, "ledger/manifest.json"), "utf8"));
  ok(ledger.entries.length === 2 && ledger.entries[1].prev_hash === ledger.entries[0].this_hash, "ledger entries hash-link");
  ok((await verifyAttested(ledger.head)).ok && ledger.head.sig.by === first.signer.fingerprint, "the head is attested by the ledger signer");
  ok((await contentId(ledger.entries)) === ledger.head.digest, "the head's digest covers the whole chain");
  const ice = JSON.parse(readFileSync(path.join(dir, "ice-outbox.json"), "utf8"));
  ok(ice.records.length === 1 && !!ice.records[0].sig, "the ice outbox stages the raw record, signature intact — damage is a publication act, never a storage act");
}

if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall intake tests passed");
