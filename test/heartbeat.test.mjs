// Unit: the heartbeat + the re-insertion check — bin/attest-heartbeat.mjs (committed bucketing, log
// bands, the dated signed receipt) and bin/reveal.mjs (a cutout is a hole only the held original fits).
// Run: node test/heartbeat.test.mjs
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { attest, generateIdentity, contentId, verifyAttested } from "../bin/attest.mjs";
import { runIntake } from "../bin/intake-verify.mjs";
import { runPunch } from "../bin/punch.mjs";
import { runHeartbeat, band } from "../bin/attest-heartbeat.mjs";
import { findCutout } from "../bin/reveal.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const NOW = "2026-07-07T12:00:00.000Z";
const S = "sha256:" + "5".repeat(64);

const me = await generateIdentity();
const ballot = (over = {}) => attest({ schema: "anecdote.ballot/v1", pile: "cd04-q1", poll: "budget",
  answer: "Keep", ts: "2026-07-04T18:00:00Z", scope: "colorado", ...over }, me);

function scratch(inbox) {
  const dir = mkdtempSync(path.join(tmpdir(), "antidote-heartbeat-"));
  mkdirSync(path.join(dir, "_data"), { recursive: true });
  writeFileSync(path.join(dir, "antidote.yml"), `id: scratch\nconstitution: "${S}"\nstamp_default: ""\n`);
  writeFileSync(path.join(dir, "_data/lattice.json"), JSON.stringify({ schema: "antidote.lattice/v1", permits: {}, refuses: {} }));
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify(inbox));
  return dir;
}

// 1. bands: exact counts never sit on the face.
{
  ok(band(0) === "0" && band(1) === "1-9" && band(9) === "1-9", "0 / 1-9");
  ok(band(10) === "10-99" && band(99) === "10-99" && band(100) === "100-999", "log-ten bands upward");
}

// 2. the receipt: buckets committed (root over sorted ids), banded, dated, signed — and it verifies.
{
  const keep1 = await ballot();
  const keep2 = await ballot({ ts: "2026-07-05T09:00:00Z" }); // a second genuine "Keep" — two data points, not one
  const cut = await ballot({ answer: "Cut" });
  const dir = scratch({ from: "colorado", constitution: S, ballots: [keep1, keep2, cut] });
  await runIntake(dir, { now: NOW });
  await runPunch(dir, { now: NOW });
  const { heartbeat } = await runHeartbeat(dir, { now: NOW });
  ok((await verifyAttested(heartbeat)).ok, "the heartbeat verifies — a dated signature nobody else can refresh");
  ok(heartbeat.at === NOW && heartbeat.constitution === S, "the receipt is dated and wears the server's constitution");
  const keepBucket = heartbeat.buckets.find((b) => b.face === "Keep");
  ok(!!keepBucket && keepBucket.band === "1-9", "coarse standing on the face, never the exact figure");
  const ids = [await contentId(keep1), await contentId(keep2)].sort();
  ok(keepBucket.root === (await contentId(ids)), "the bucket's root commits to exactly its cutouts");
  ok(heartbeat.buckets.length === 2, "two buckets: two distinct answers, distinct respondents uncollapsed");
  const ledger = JSON.parse((await import("node:fs")).readFileSync(path.join(dir, "ledger/manifest.json"), "utf8"));
  ok(heartbeat.ledger_head === ledger.head.digest, "the receipt binds the plaques to the custody chain");
}

// 3. re-insertion: the held original fits its hole; a tampered record fits nothing.
{
  const b = await ballot();
  const dir = scratch({ from: "colorado", constitution: S, ballots: [b] });
  await runIntake(dir, { now: NOW });
  await runPunch(dir, { now: NOW });
  const hit = await findCutout(path.join(dir, "index"), b);
  ok(!!hit && hit.poll === "budget" && hit.face === "Keep", "the original re-inserts: verification is putting the piece back");
  ok((await findCutout(path.join(dir, "index"), { ...b, answer: "Keep " })) === null, "a tampered record fits no hole");
}

if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall heartbeat tests passed");
