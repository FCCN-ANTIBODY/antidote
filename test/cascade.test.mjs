// The cascade tier (bin/place + bin/vat + bin/distill; docs/cascade.md, civic-node #94), exercised
// through the REAL front door: intake -> punch -> place -> vat -> distill -> egress. Default-hold is
// the literal default (empty catalog holds everything); placements are seed corn (never rewritten);
// vats are per-constitution views (no derivative COMMON without counsel); the down-hop is gated by
// the same judgeConstitution as the door, and what can't ride is named, never silently dropped.
// Run: node test/cascade.test.mjs
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { attest, generateIdentity, contentId } from "../bin/attest.mjs";
import { runIntake } from "../bin/intake-verify.mjs";
import { runPunch } from "../bin/punch.mjs";
import { runPlace, readCatalog } from "../bin/place.mjs";
import { runVat, containmentSet } from "../bin/vat.mjs";
import { runDistill } from "../bin/distill.mjs";
import { runEgress } from "../bin/egress.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const NOW = "2026-07-08T00:00:00.000Z";
const C1 = "sha256:" + "1".repeat(64); // the charter this server wears
const C2 = "sha256:" + "2".repeat(64); // admitted via the lattice; unknown to the rung (queues)
const C3 = "sha256:" + "3".repeat(64); // admitted via the lattice; the rung refuses it
const CR = "sha256:" + "e".repeat(64); // the downstream rung's declared COMMON offer

const SPINE = [
  { id: "fort-collins", level: "city", within: "larimer" },
  { id: "loveland", level: "city", within: "larimer" },
  { id: "larimer", level: "county", within: "colorado" },
  { id: "cheyenne-city", level: "city", within: "laramie-wy" },
  { id: "laramie-wy", level: "county", within: "wyoming" },
  { id: "wyoming", level: "state" },
  { id: "colorado", level: "state" },
  { id: "cd04", level: "district", overlaps: ["larimer", "wyoming"] },
];

const voter = await generateIdentity();
const ballot = (over = {}) => attest({ schema: "anecdote.ballot/v1", pile: "orphan", poll: "budget",
  answer: "Keep", ts: "2026-07-01T00:00:00Z", constitution: C1, ...over }, voter);

// a chartered scratch server whose lattice admits C1 (identical), C2 and C3 (permitted).
async function server(ballots) {
  const dir = mkdtempSync(path.join(tmpdir(), "antidote-cascade-"));
  mkdirSync(path.join(dir, "_data"), { recursive: true });
  writeFileSync(path.join(dir, "antidote.yml"), `id: still\nconstitution: "${C1}"\nstamp_default: ""\n`);
  writeFileSync(path.join(dir, "_data/lattice.json"), JSON.stringify({ schema: "antidote.lattice/v1",
    permits: { [C2]: [C1, CR].slice(0, 1), [C3]: [C1] }, refuses: { [C3]: [CR] } }));
  writeFileSync(path.join(dir, "_data/shapes.json"), JSON.stringify({ schema: "antidote.shape-catalog/v1", lineage: "", shapes: [] }));
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify({ from: "colorado-atlas", ballots }));
  await runIntake(dir, { now: NOW });
  await runPunch(dir, { now: NOW });
  return dir;
}
const setCatalog = (dir, shapes) => writeFileSync(path.join(dir, "_data/shapes.json"),
  JSON.stringify({ schema: "antidote.shape-catalog/v1", lineage: "", shapes }));
const ledgerOf = (dir) => JSON.parse(readFileSync(path.join(dir, "place/ledger.json"), "utf8"));

const ballots = [
  await ballot({ scope: "fort-collins", answer: "A" }),
  await ballot({ scope: "fort-collins", answer: "B", constitution: C2 }),
  await ballot({ scope: "loveland", answer: "C" }),
  await ballot({ scope: "cheyenne-city", answer: "D", constitution: C3 }),
  await ballot({ scope: "atlantis", answer: "E" }),   // a scope no catalog names
  await ballot({ answer: "F" }),                       // no scope at all
];
const idOf = async (b) => contentId(b);

// 1. default-hold is the machine's literal default: an empty catalog holds EVERYTHING, named.
const dir = await server(ballots);
{
  const r = await runPlace(dir, { now: NOW });
  ok(r.placed === 0 && r.held === 6, "empty catalog -> nothing places, all six hold at the boundary");
  const l = ledgerOf(dir);
  ok(l.held.every((h) => h.constitution) && l.held.some((h) => h.waiting_for === "atlantis") && l.held.some((h) => h.waiting_for === null),
    "each held record names what it waits for (or that it carried no scope), constitution stapled");
}

// 2. adopting a catalog that names the shapes drains the backlog — the refilter is a re-run.
{
  setCatalog(dir, SPINE);
  const r = await runPlace(dir, { now: NOW });
  ok(r.placed === 4 && r.held === 2, "the four named scopes place; atlantis + the scopeless one keep holding");
  const l = ledgerOf(dir);
  ok(l.entries.every((e) => e.constitution && e.catalog_version === r.catalog_version),
    "placements carry the original constitution + the catalog version that placed them");
  const again = await runPlace(dir, { now: NOW });
  ok(again.placed === 0 && again.total === 4, "a re-run rewrites nothing — placements are seed corn");
}

// 3. the vat is a containment view: larimer gathers its cities, excludes the other spine.
{
  const { vat } = await runVat(dir, { shape: "larimer", now: NOW });
  const refs = vat.composed_of.flatMap((g) => g.refs);
  ok(vat.grain === "containment" && refs.length === 3, "larimer's vat = fort-collins + loveland + larimer placements (3)");
  ok(!refs.includes(await idOf(ballots[3])), "the cheyenne (wyoming spine) record stays out");
  ok(vat.composed_of.length === 2 && vat.composed_of.every((g) => /^(0|1-9)$/.test(g.records)),
    "references group PER ORIGINAL constitution (C1 + C2), counts as log bands only");
  ok(vat.derived === true && /counsel/.test(vat.note), "the vat says what it is: a derived view, no COMMON without counsel");
}

// 4. a lateral overlap shape gets the coarse full-overlap set, marked as such.
{
  const { vat } = await runVat(dir, { shape: "cd04", now: NOW });
  const refs = vat.composed_of.flatMap((g) => g.refs);
  ok(vat.grain === "overlap-coarse" && refs.length === 4,
    "cd04 (overlaps larimer + wyoming) coarsely gathers both spines' placements (4)");
}

// 5. a shape the adopted catalog does not name is refused — boundaries are adopted, never drawn here.
{
  let threw = false;
  try { await runVat(dir, { shape: "narnia", now: NOW }); } catch { threw = true; }
  ok(threw, "a vat for an un-adopted shape is refused");
}

// 6. a boundary change is a new catalog version: the ledger holds still; the vat re-derives.
{
  const before = (await readCatalog(dir)).version;
  setCatalog(dir, SPINE.map((s) => (s.id === "loveland" ? { ...s, within: "colorado" } : s))); // loveland "splits" out of larimer
  const after = (await readCatalog(dir)).version;
  ok(before !== after, "the catalog version is the content hash — adoption IS the boundary change");
  const totalBefore = ledgerOf(dir).entries.length;
  await runPlace(dir, { now: NOW });
  ok(ledgerOf(dir).entries.length === totalBefore, "nothing in the base moved");
  const { vat } = await runVat(dir, { shape: "larimer", now: NOW });
  ok(vat.composed_of.flatMap((g) => g.refs).length === 2 && vat.catalog_version === after,
    "the same seed re-joins against the new catalog: larimer's vat re-derives to 2");
  setCatalog(dir, SPINE); await runPlace(dir, { now: NOW }); // restore
}

// 7. the down-hop: distill selects by containment, gates by the SAME judge, names every non-rider.
{
  writeFileSync(path.join(dir, "_data/downstream.json"), JSON.stringify({ schema: "antidote.downstream/v1",
    rungs: [{ id: "colorado-state", repo: "acme/antidote.colorado", shape: "colorado", constitution: CR, signer: "key:sha256:" + "f".repeat(64) }] }));
  // the lattice knows: C1 -> CR admit; C2 -> CR unknown (queue); C3 -> CR refused.
  writeFileSync(path.join(dir, "_data/lattice.json"), JSON.stringify({ schema: "antidote.lattice/v1",
    permits: { [C1]: [CR], [C2]: [C1], [C3]: [C1] }, refuses: { [C3]: [CR] } }));
  // raw in hand: the two C1 colorado records; the loveland raw stays on ice.
  writeFileSync(path.join(dir, "_data/distill-records.json"), JSON.stringify([ballots[0]]));
  const r = await runDistill(dir, { to: "colorado-state", now: NOW });
  ok(r.admitted.length === 1 && r.admitted[0] === await idOf(ballots[0]), "an admitted record with raw in hand rides");
  ok(r.queued.length === 1 && r.queued[0].constitution === C2 && /never auto-admitted/.test(r.queued[0].why),
    "an unknown pair queues for counsel — deeper never overrides a restrictive arrival by itself");
  ok(r.refused.length === 0, "the refused pair (C3) is not even in colorado's containment — nothing to refuse here");
  ok(r.missingRaw.length === 1 && r.missingRaw[0] === await idOf(ballots[2]),
    "a selected record whose raw is on ice is NAMED as missing, never silently dropped");
  // and the yield is exactly what bin/egress composes a teleport from.
  const { bundle } = await runEgress(dir, { now: NOW });
  ok(bundle.schema === "antidote.teleport/v1" && bundle.common_constitution === CR &&
     bundle.commitments.length === 1 && bundle.commitments[0] === await idOf(ballots[0]),
    "bin/egress turns the yield into the digest-bound teleport for the rung — the whole hop composes");
}

// 8. a rung must exist, charter a shape, and offer a COMMON — or nothing flows.
{
  let threw = "";
  try { await runDistill(dir, { to: "nowhere", now: NOW }); } catch (e) { threw = e.message; }
  ok(/no rung/.test(threw), "an unregistered rung is refused (registration-down comes first)");
  writeFileSync(path.join(dir, "_data/downstream.json"), JSON.stringify({ rungs: [{ id: "bare", shape: "colorado" }] }));
  threw = ""; try { await runDistill(dir, { to: "bare", now: NOW }); } catch (e) { threw = e.message; }
  ok(/no COMMON/.test(threw), "a rung offering no constitution receives nothing — no constitution, no catalog");
}

rmSync(dir, { recursive: true, force: true });
if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall cascade tests passed");
