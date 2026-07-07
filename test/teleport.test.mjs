// Unit: the teleport — bin/egress.mjs (custody OUT: the bundle + the chained egress ledger) meeting
// bin/intake-verify.mjs + bin/punch.mjs (custody IN: THE COMMON CONSTITUTION governs, deeper
// constitutions ride subordinate, the digest binds the two ledgers). Run: node test/teleport.test.mjs
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { attest, generateIdentity, contentId, verifyAttested } from "../bin/attest.mjs";
import { runEgress } from "../bin/egress.mjs";
import { runIntake } from "../bin/intake-verify.mjs";
import { runPunch } from "../bin/punch.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const NOW = "2026-07-07T12:00:00.000Z";
const COMMON = "sha256:" + "5".repeat(64); // the pile's COMMON CONSTITUTION == what the server wears
const DEEPER = "sha256:" + "d".repeat(64); // one answer's more sophisticated constitution

const me = await generateIdentity();
const ballot = (over = {}) => attest({ schema: "anecdote.ballot/v1", pile: "hearsay-7", poll: "crosswalk",
  answer: "Paint it", ts: "2026-07-01T18:00:00Z", scope: "colorado", ...over }, me);
const sealedRec = { id: "sha256:" + "b".repeat(64), env: "YWdlLWNpcGhlcnRleHQ=", pile: "hearsay-7", poll: "crosswalk", scope: "colorado" };

function node(yieldRecords) { // one scratch civic node wearing both hats
  const dir = mkdtempSync(path.join(tmpdir(), "antidote-teleport-"));
  mkdirSync(path.join(dir, "_data"), { recursive: true });
  writeFileSync(path.join(dir, "antidote.yml"), `id: node\nconstitution: "${COMMON}"\nstamp_default: ""\n`);
  writeFileSync(path.join(dir, "_data/lattice.json"), JSON.stringify({ schema: "antidote.lattice/v1", permits: {}, refuses: {} }));
  if (yieldRecords) writeFileSync(path.join(dir, "_data/egress-records.json"),
    JSON.stringify({ pile: "hearsay-7", common_constitution: COMMON, records: yieldRecords }));
  return dir;
}

// 1. egress: the bundle carries sorted commitments, a chained digest, and dedups at the door out.
{
  const b1 = await ballot();
  const dir = node([b1, { ...b1 }, sealedRec]);
  const { bundle } = await runEgress(dir, { now: NOW });
  ok(bundle.schema === "antidote.teleport/v1" && bundle.pile === "hearsay-7", "one teleport, one pile");
  ok(bundle.records.length === 2 && bundle.commitments.length === 2, "the duplicate collapsed at the door out");
  ok(JSON.stringify(bundle.commitments) === JSON.stringify([...bundle.commitments].sort()), "commitments are sorted");
  ok(bundle.digest === (await contentId({ seq: 0, prev_digest: null, commitments: bundle.commitments })), "the digest chains seq + prev + commitments");
  const ledger = JSON.parse(readFileSync(path.join(dir, "egress/ledger.json"), "utf8"));
  ok((await verifyAttested(ledger.head)).ok && ledger.entries[0].digest === bundle.digest, "custody OUT: the egress ledger's entry carries the same digest, head attested");
  const { bundle: second } = await runEgress(dir, { now: NOW });
  ok(second.seq === 1 && second.prev_digest === bundle.digest, "the next teleport chains onto the last — an append log leaving home");
}

// 2. egress refuses a yield with no COMMON CONSTITUTION: no constitution, no catalog.
{
  const dir = node(null);
  writeFileSync(path.join(dir, "_data/egress-records.json"), JSON.stringify({ pile: "hearsay-7", records: [await ballot()] }));
  let threw = false;
  try { await runEgress(dir, { now: NOW }); } catch { threw = true; }
  ok(threw, "no COMMON CONSTITUTION on the yield -> egress refuses to compose the teleport");
}

// 3. integration: the teleport lands whole; THE COMMON CONSTITUTION governs, deeper rides subordinate.
{
  const plain = await ballot();
  const opinionated = await ballot({ answer: "Raise it", constitution: DEEPER });
  const dir = node([plain, opinionated, sealedRec]);
  const { bundle } = await runEgress(dir, { now: NOW });
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify(bundle));
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.teleport?.digest === bundle.digest && manifest.teleport?.pile === "hearsay-7", "the manifest binds to the teleport it consumed");
  ok(manifest.fates.admit.length === 3, "the whole yield admits — the COMMON CONSTITUTION is what the server wears");
  ok(manifest.fates.admit.every((f) => f.constitution === COMMON && f.constitution_source === "common"), "every record is governed by the COMMON CONSTITUTION, source: common");
  const deep = manifest.fates.admit.find((f) => f.envelope.answer === "Raise it");
  ok(deep?.deeper_constitution === DEEPER, "a worn deeper constitution is recorded — subordinate, available only within the COMMON's carve-out");
  ok(!manifest.fates.admit.find((f) => f.constitution === DEEPER), "the deeper constitution never governs admission");
  const { entry } = await runPunch(dir, { now: NOW });
  ok(entry.teleport?.digest === bundle.digest, "custody IN: the intake ledger entry carries the digest that custody OUT signed — the two chains meet");
  const ice = JSON.parse(readFileSync(path.join(dir, "ice-outbox.json"), "utf8"));
  ok(ice.records.length === 3 && ice.records.some((r) => !!r.sig) && ice.records.some((r) => !!r.env), "the ice outbox stages the raw yield, both classes intact");
}

// 4. tampering: a record outside the commitments is nobody's; a doctored digest refuses the bundle whole.
{
  const dir = node([await ballot()]);
  const { bundle } = await runEgress(dir, { now: NOW });
  const smuggled = await ballot({ answer: "Smuggled" });
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify({ ...bundle, records: [...bundle.records, smuggled] }));
  const { manifest } = await runIntake(dir, { now: NOW });
  ok(manifest.rejected === 1 && manifest.fates.admit.length === 1, "a record outside its teleport's commitments is rejected");
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify({ ...bundle, digest: "sha256:" + "0".repeat(64) }));
  let threw = false;
  try { await runIntake(dir, { now: NOW }); } catch { threw = true; }
  ok(threw, "a teleport whose digest does not verify is refused whole");
}

if (fails) { console.error(`\n${fails} FAILED`); console.error("see above"); process.exit(1); }
console.log("\nall teleport tests passed");
