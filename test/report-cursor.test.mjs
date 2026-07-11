// Unit: report cursors — bin/report-cursor.mjs (docs/multitenancy.md brick 4). The async aggregation tier:
// a research account advances a read-cursor over a live feed branch, folding the delta incrementally and
// signing each report to the source commit. Proves the three rules — attest-to-hash, fast-forward-only,
// incremental==full — against a real git fixture. Run: node test/report-cursor.test.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advance, foldAggregate, INIT } from "../bin/report-cursor.mjs";
import { generateIdentity, verifyAttested } from "../bin/attest.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const git = (dir, ...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }).trim();

// Build a source repo with an append-only feed branch; return the commit hash after each delivered state.
const dir = mkdtempSync(join(tmpdir(), "cursor-"));
git(dir, "init", "-q", "-b", "main");
git(dir, "checkout", "-q", "--orphan", "feed/colorado/cd04-q1");
mkdirSync(join(dir, "inbox"), { recursive: true });
const hashes = [];
function deliver(entries) {
  writeFileSync(join(dir, "inbox", "manifest.json"), JSON.stringify({ entries }));
  git(dir, "add", "-A");
  execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "deliver"]);
  hashes.push(git(dir, "rev-parse", "HEAD"));
}
const E = (seq, count) => ({ seq, block: `${seq}.enc`, this_hash: `sha256:${seq}`, vouch: { count } });
deliver([E(0, 3)]);                              // X0: 1 block, 3 records
deliver([E(0, 3), E(1, 5)]);                     // X1: +1 block, +5 records
deliver([E(0, 3), E(1, 5), E(2, 2)]);            // X2: +1 block, +2 records
const ref = "refs/heads/feed/colorado/cd04-q1";
const id = await generateIdentity();

// 1. fold is pure and associative: full recompute == fold from INIT over all entries.
{
  const all = [E(0, 3), E(1, 5), E(2, 2)];
  ok(JSON.stringify(foldAggregate(INIT, all)) === JSON.stringify({ blocks: 3, records: 10 }), "foldAggregate sums blocks + records over the manifest");
}

// 2. first advance (fresh cursor -> X1): folds the delta, attests to the source hash.
let cur = null, rep;
{
  ({ report: rep, cursor: cur } = await advance({ dir, ref, source: "cd04-q1", cursor: cur, to: hashes[1], identity: id }));
  ok(rep.at === hashes[1] && rep.from === null, "the report cites the source commit it was computed over (at = X1, from = null)");
  ok(JSON.stringify(rep.delta_seqs) === "[0,1]", "the fresh advance folds every block up to X1");
  ok(rep.aggregate.blocks === 2 && rep.aggregate.records === 8, "aggregate at X1: 2 blocks, 8 records");
  ok((await verifyAttested(rep)).ok !== false && rep.sig, "the report is signed — verify-from-anyone");
}

// 3. advance X1 -> X2 folds ONLY the delta, and equals a full recompute at X2 (incremental == full).
{
  const { report: rep2, cursor: cur2 } = await advance({ dir, ref, source: "cd04-q1", cursor: cur, to: hashes[2], identity: id });
  ok(JSON.stringify(rep2.delta_seqs) === "[2]", "the second advance folds ONLY the new block (X1..X2 delta), not the whole feed");
  ok(rep2.at === hashes[2] && rep2.from === hashes[1], "it cites both endpoints (from X1, at X2)");
  const full = foldAggregate(INIT, [E(0, 3), E(1, 5), E(2, 2)]);
  ok(JSON.stringify(cur2.aggregate) === JSON.stringify(full), "incremental fold == full recompute at X2 (the async correctness property)");
  cur = cur2;
}

// 4. fast-forward only: advancing to an OLDER hash (not a descendant) is refused.
{
  let threw = false;
  try { await advance({ dir, ref, cursor: cur, to: hashes[0], identity: id }); } catch { threw = true; }
  ok(threw, "advancing to an earlier commit is refused (append-only; no rebase)");
}

// 5. a rewritten source (diverged history at a seq) is refused even if it's a descendant.
{
  git(dir, "checkout", "-q", ref);
  writeFileSync(join(dir, "inbox", "manifest.json"), JSON.stringify({ entries: [E(0, 3), E(1, 5), E(2, 2), { seq: 3, block: "3.enc", this_hash: "sha256:TAMPERED-earlier", vouch: { count: 1 } }] }));
  // (append is fine; now forge a branch where an EARLIER entry's this_hash changed)
  git(dir, "checkout", "-q", "--orphan", "feed/colorado/forged");
  writeFileSync(join(dir, "inbox", "manifest.json"), JSON.stringify({ entries: [{ ...E(0, 3), this_hash: "sha256:DIFFERENT" }, E(1, 5)] }));
  git(dir, "add", "-A");
  execFileSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "forged"]);
  const forged = git(dir, "rev-parse", "HEAD");
  let threw = false;
  try { await advance({ dir, ref: "refs/heads/feed/colorado/forged", cursor: { at: hashes[0], ref, aggregate: { blocks: 1, records: 3 } }, to: forged, identity: id }); } catch { threw = true; }
  ok(threw, "a source that rewrote an earlier entry's hash is refused (prefix-integrity)");
}

rmSync(dir, { recursive: true, force: true });
if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall report-cursor tests passed");
