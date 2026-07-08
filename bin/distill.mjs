// bin/distill.mjs — THE DOWN-HOP SELECTOR (docs/cascade.md; civic-node #94). One rung of the cascade
// flushing to the next (Fort Collins -> Larimer -> Colorado) is the same teleport gesture the Atlases
// use into the top tier — and this verb is only its SELECTION half: which records may ride, judged by
// the same gateway that guards the front door. bin/egress (built) composes the teleport from what this
// selects; delivery stays the presumed PR; the raw releases only against receipts, one rung up's
// bin/retire idiom.
//
// The gate, per record: judgeConstitution({ answer: the record's ORIGINAL constitution, server: the
// downstream rung's DECLARED COMMON offer, lattice }) — the identical function intake runs.
//   admit  -> the record rides (if its raw is in hand).
//   queue  -> HELD, narrated. "Deeper overrides a restrictive arrival-COMMON" NEVER auto-admits —
//             the counsel gate (docs/cascade.md open questions) is a human, not this verb.
//   refuse -> stays home, listed.
// A record placed within the rung's shape whose RAW is not in hand (the ice holds it) is narrated as
// missing — no silent caps: what was dropped from a bundle is always named.
//
//   bin/distill --to RUNG [--records FILE]
//     RUNG     an id in _data/downstream.json (declares its shape + its COMMON offer)
//     FILE     the raw records in hand (a bare array, or {records:[...]}) — e.g. the ice yield,
//              decrypted by the ice pile's own owner tooling (default _data/distill-records.json)
//
// Output: the egress YIELD (default _data/egress-records.json — exactly what bin/egress reads), i.e.
// { pile, common_constitution: <the rung's offer>, records: [the admitted raw] }.
// Env (ANTIDOTE_* overrides): ANTIDOTE_DOWNSTREAM (default _data/downstream.json), ANTIDOTE_SHAPES,
// ANTIDOTE_PLACEMENTS, ANTIDOTE_DISTILL_IN (default _data/distill-records.json), ANTIDOTE_EGRESS_IN
// (the yield destination, bin/egress's input).

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { readJson } from "./attest.mjs";
import { judgeConstitution, readLattice } from "./judge-constitution.mjs";
import { readCatalog } from "./place.mjs";
import { containmentSet } from "./vat.mjs";
import { commitmentOf } from "./egress.mjs";

export async function runDistill(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const to = opts.to;
  if (!to) throw new Error("distill: --to RUNG is required");
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const downstreamPath = opts.downstream || p("ANTIDOTE_DOWNSTREAM", "_data/downstream.json");
  const ledgerPath = opts.ledger || p("ANTIDOTE_PLACEMENTS", "place/ledger.json");
  const recordsPath = opts.records || p("ANTIDOTE_DISTILL_IN", "_data/distill-records.json");
  const outPath = opts.out || p("ANTIDOTE_EGRESS_IN", "_data/egress-records.json");

  const rung = (readJson(downstreamPath, { rungs: [] }).rungs || []).find((r) => r.id === to);
  if (!rung) throw new Error(`distill: no rung '${to}' in _data/downstream.json — registration-down comes first (it creates the upstream lifeline)`);
  if (!rung.shape) throw new Error(`distill: rung '${to}' declares no shape — a rung's charter IS its shape`);
  if (!rung.constitution) throw new Error(`distill: rung '${to}' offers no COMMON CONSTITUTION — no constitution, no catalog; nothing flows`);

  const { catalog } = await readCatalog(root, opts.catalog);
  const c = containmentSet(catalog, rung.shape);
  if (!c) throw new Error(`distill: the adopted catalog names no shape '${rung.shape}' — adopt a version that does before flushing toward it`);

  // the raw in hand, keyed by commitment (a sealed record's id rides outside; a mesh record's is computed).
  const rawIn = readJson(recordsPath, []);
  const rawList = Array.isArray(rawIn) ? rawIn : rawIn.records || [];
  const inHand = new Map();
  for (const rec of rawList) inHand.set(await commitmentOf(rec), rec);

  const lattice = readLattice(root);
  const ledger = readJson(ledgerPath, { entries: [] });
  const records = [], admitted = [], queued = [], refused = [], missingRaw = [];
  for (const e of ledger.entries || []) {
    if (!c.set.has(e.shape)) continue;
    const verdict = judgeConstitution({ answer: e.constitution, server: rung.constitution, lattice });
    if (verdict === "queue") { queued.push({ id: e.id, constitution: e.constitution, why: "the lattice does not know this pair — waits for counsel, never auto-admitted" }); continue; }
    if (verdict === "refuse") { refused.push({ id: e.id, constitution: e.constitution }); continue; }
    const rec = inHand.get(e.id);
    if (!rec) { missingRaw.push(e.id); continue; } // the ice holds it; named, never silently skipped
    records.push(rec);
    admitted.push(e.id);
  }

  const yield_ = { pile: opts.pile || `cascade-${rung.shape}`, common_constitution: rung.constitution, records };
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(yield_, null, 2) + "\n");
  return { to, shape: rung.shape, at, admitted, queued, refused, missingRaw, outPath,
    next: "bin/egress composes the teleport from this yield; deliver it as the presumed PR onto the rung's repo; the raw releases only against its attested receipt" };
}

// ---- CLI -------------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const out = {}; const map = { "--to": "to", "--records": "records" };
  for (let i = 0; i < argv.length; i++) {
    const k = map[argv[i]];
    if (!k) throw new Error(`distill: unknown arg ${argv[i]}`);
    out[k] = argv[++i];
  }
  return out;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const r = await runDistill(root, parseArgs(process.argv.slice(2)));
  console.error(`distill (${r.to} / ${r.shape}): ${r.admitted.length} admitted into the yield, ` +
    `${r.queued.length} queued for counsel, ${r.refused.length} refused, ${r.missingRaw.length} raw-not-in-hand (the ice holds them)`);
  console.error(`distill: ${r.next}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
