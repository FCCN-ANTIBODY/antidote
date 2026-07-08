// bin/coverage.mjs — NO SILENT GAPS (docs/cascade.md guards; civic-node #94). The coverage a
// slicing claims must be VISIBLE: which shapes hold placements, who claims them (a registered
// downstream rung whose containment reaches them, or a materialized vat), and — the point — the
// shapes NOBODY claims. A constituency no slice asked for is a NAMED hole, not a silent one: that
// is the runoff tray made legible ("how to know what you don't know"), and the concrete promise to
// the reader who arrives late — what was being spoken about before anyone started paying attention.
//
// Pure reading, judges nothing, moves nothing:
//   held      — every shape with placements (counts as log bands — coarse standing, never raw),
//               each with the constitutions stapled to what sits there.
//   claimed   — who covers it: rungs (their containment set reaches the shape) and vats
//               (materialized views naming it). Redundancy = how many claims, visible.
//   holes     — held but claimed by NO rung and NO vat: the runoff, named shape by shape.
//   unplaced  — the default-hold backlog count rides along (held at the boundary is also a fact
//               the index must show, not hide).
//
//   bin/coverage        # read ledger x catalog x downstream x vats -> coverage.json
// Env (ANTIDOTE_* overrides): ANTIDOTE_PLACEMENTS, ANTIDOTE_SHAPES, ANTIDOTE_DOWNSTREAM,
// ANTIDOTE_VATS, ANTIDOTE_COVERAGE (default coverage.json).

import { writeFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { readJson } from "./attest.mjs";
import { band } from "./attest-heartbeat.mjs";
import { readCatalog } from "./place.mjs";
import { containmentSet } from "./vat.mjs";

export async function runCoverage(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const ledger = readJson(opts.ledger || p("ANTIDOTE_PLACEMENTS", "place/ledger.json"), { entries: [], held: [] });
  const downstream = readJson(opts.downstream || p("ANTIDOTE_DOWNSTREAM", "_data/downstream.json"), { rungs: [] });
  const vatsDir = opts.vatsDir || p("ANTIDOTE_VATS", "vats");
  const outPath = opts.out || p("ANTIDOTE_COVERAGE", "coverage.json");
  const { catalog, version } = await readCatalog(root, opts.catalog);

  // what is held, shape by shape, constitutions stapled.
  const heldBy = new Map(); // shape -> { n, constitutions: Set }
  for (const e of ledger.entries || []) {
    if (!heldBy.has(e.shape)) heldBy.set(e.shape, { n: 0, constitutions: new Set() });
    const h = heldBy.get(e.shape);
    h.n++; h.constitutions.add(e.constitution);
  }

  // who claims what: a rung claims every shape its containment reaches; a vat claims what it names.
  const claims = new Map(); // shape -> [claims]
  const claim = (shape, c) => { if (!claims.has(shape)) claims.set(shape, []); claims.get(shape).push(c); };
  for (const rung of downstream.rungs || []) {
    if (!rung.id || !rung.shape) continue;
    const c = containmentSet(catalog, rung.shape);
    if (!c) continue; // a rung chartered for a shape this catalog doesn't name covers nothing here
    for (const s of c.set) claim(s, { kind: "rung", id: rung.id, shape: rung.shape });
  }
  if (existsSync(vatsDir)) {
    for (const f of readdirSync(vatsDir).filter((f) => f.endsWith(".json")).sort()) {
      try {
        const vat = JSON.parse(readFileSync(path.join(vatsDir, f), "utf8"));
        if (vat?.schema !== "antidote.vat/v1") continue;
        const c = containmentSet(catalog, vat.shape);
        for (const s of c ? c.set : [vat.shape]) claim(s, { kind: "vat", shape: vat.shape });
      } catch { /* an unreadable vat claims nothing */ }
    }
  }

  const held = [...heldBy.entries()].sort().map(([shape, h]) => ({
    shape, placements: band(h.n), constitutions: [...h.constitutions].sort(),
    claimed_by: (claims.get(shape) || []), redundancy: (claims.get(shape) || []).length,
  }));
  const holes = held.filter((h) => h.redundancy === 0).map(({ shape, placements, constitutions }) => ({ shape, placements, constitutions,
    note: "held, asked for by no rung and no vat — the runoff, named" }));

  const out = { schema: "antidote.coverage/v1", at, catalog_version: version,
    held, holes, unplaced: band((ledger.held || []).length),
    note: "counts are log bands; a hole is a NAMED gap, never a silent one (no silent gaps — #94)" };
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  return out;
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const r = await runCoverage(root);
  console.error(`coverage: ${r.held.length} shape(s) held, ${r.holes.length} NAMED hole(s), ${r.unplaced} held at the boundary -> coverage.json`);
  for (const h of r.holes) console.error(`coverage: HOLE — ${h.shape} holds ${h.placements} placement(s) nobody asked for`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
