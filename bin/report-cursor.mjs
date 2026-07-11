#!/usr/bin/env node
// antidote/bin/report-cursor.mjs — REPORT CURSORS (docs/multitenancy.md, brick 4; the async aggregation
// tier). A research account gets its own advancing read-position over a live source (a pile's feed branch)
// and produces SIGNED, INCREMENTAL aggregate reports. The three rules the doc pins, made mechanical:
//
//   1. Attest to the source hash. Every report is signed over {source, ref, at: <commit>, ...} — "computed
//      over source at X." Anyone re-runs at X and verifies; no report is authoritative over another.
//   2. Fast-forward only. A feed is append-only, so the cursor only advances along one lineage (X -> Y);
//      `to` must be a descendant of `from` and `from`'s entries a prefix of `to`'s, or the advance refuses.
//      Rebase never enters the picture.
//   3. Reader, not writer. The cursor reads a pinned revision and folds the delta X..Y into its own running
//      aggregate; it never writes back to the source. So the slowest backend blocks nothing.
//
// The aggregate function is the backend's personality (fold below is a reference: block + record counts
// over the CLEAR manifest metadata — no decryption). Real git today; git-enough is the on-device swap.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { attest, loadOrCreateSigner, readJson } from "./attest.mjs";

const git = (dir, a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", maxBuffer: 1 << 28 }).trim();
const manifestAt = (dir, hash, ref) => { try { return JSON.parse(git(dir, ["show", `${hash}:inbox/manifest.json`])).entries || []; } catch { return []; } };
const isAncestor = (dir, a, b) => { try { execFileSync("git", ["-C", dir, "merge-base", "--is-ancestor", a, b]); return true; } catch { return false; } };

// ---- the aggregate: pure, incremental. fold(agg, delta) must equal fold(INIT, allEntries) — associativity
// is what lets a slow backend catch up in pieces. Swap this for a real backend's algorithm. ------------
export const INIT = { blocks: 0, records: 0 };
export function foldAggregate(agg, deltaEntries) {
  let { blocks, records } = agg;
  for (const e of deltaEntries) { blocks += 1; records += (e.vouch && e.vouch.count) || 0; }
  return { blocks, records };
}

// ---- advance the cursor from its current position to `to` (default: the ref's tip). ------------------
// Returns { report (attested, cites the source hash), cursor (the new position + folded aggregate) }.
export async function advance({ dir, ref, source, cursor, to, identity, fold = foldAggregate, init = INIT }) {
  const from = cursor && cursor.at ? cursor.at : null;
  const toHash = to || git(dir, ["rev-parse", ref]);
  if (from) {
    if (!isAncestor(dir, from, toHash)) throw new Error("report-cursor: not a fast-forward (source is append-only; no rebase)");
  }
  const fromEntries = from ? manifestAt(dir, from) : [];
  const toEntries = manifestAt(dir, toHash);
  // append-only integrity: from's entries must be a prefix of to's (same this_hash), else the feed diverged.
  for (let i = 0; i < fromEntries.length; i++)
    if (toEntries[i] && fromEntries[i].this_hash !== toEntries[i].this_hash)
      throw new Error(`report-cursor: source rewrote history at seq ${i} — refusing (append-only only)`);
  const delta = toEntries.slice(fromEntries.length);
  const aggregate = fold(cursor && cursor.aggregate ? cursor.aggregate : init, delta);
  const report = await attest({
    schema: "antidote.report/v1",
    source: source || ref, ref, from, at: toHash,
    delta_seqs: delta.map((e) => e.seq), aggregate,
  }, identity);
  return { report, cursor: { source: source || ref, ref, at: toHash, aggregate } };
}

// ---- CLI ---------------------------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(3);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const dir = opt("--dir", "."), ref = opt("--ref"), cursorFile = opt("--cursor"), keyPath = opt("--key");
  const source = opt("--source"), to = opt("--to");
  if (process.argv[2] !== "advance" || !ref || !cursorFile || !keyPath) {
    process.stderr.write("usage: bin/report-cursor.mjs advance --dir SRC --ref REF --cursor FILE --key KEYFILE [--to HASH] [--source NAME]\n");
    process.exit(1);
  }
  const identity = await loadOrCreateSigner(keyPath, { create: true });
  const cursor = readJson(cursorFile, null);
  const { report, cursor: next } = await advance({ dir, ref, source, cursor, to, identity });
  writeFileSync(cursorFile, JSON.stringify(next, null, 2) + "\n");
  process.stderr.write(`antidote: report over ${next.source} @ ${next.at.slice(0, 12)} — +${report.delta_seqs.length} block(s), aggregate blocks=${next.aggregate.blocks} records=${next.aggregate.records}\n`);
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}
