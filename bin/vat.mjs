// bin/vat.mjs — ROLLUP AS A VIEW (docs/cascade.md; civic-node #94). A vat is never a second copy of
// the data: it is a spatial join of the placement ledger against the CURRENT catalog, materialized —
// thin references, log-band counts, freely evictable, reconstructable from the seed. A boundary
// change (a new adopted catalog version) makes vats stale, never the ledger: re-run this and the
// same seed re-joins against the new shapes.
//
// Containment is the distillation axis: a spine shape's vat gathers every placement at itself or at
// any shape whose within-chain reaches it (city -> county -> state). A LATERAL shape (overlaps, no
// within) gets the coarse full-overlap set — every referenced shape and its descendants — marked
// grain: overlap-coarse, because name-grain placements cannot cut finer than the named shapes.
//
// V1 VATS NEVER MIX LICENSES: references are grouped PER ORIGINAL CONSTITUTION, and the first-order
// query into the vat is exactly the set of constitutions that compose it — followable references you
// travel up to unpack. Distilling into a looser derivative COMMON (carve-out or deeper_constitution
// passport) stays behind the counsel gate, unbuilt on purpose (the open question in docs/cascade.md).
//
//   bin/vat <shape-id>       # materialize vats/<shape-id>.json from the ledger x the catalog
// Env (ANTIDOTE_* overrides): ANTIDOTE_SHAPES, ANTIDOTE_PLACEMENTS, ANTIDOTE_VATS (default vats/).

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { readJson } from "./attest.mjs";
import { band } from "./attest-heartbeat.mjs";
import { readCatalog } from "./place.mjs";

// every shape id whose placements belong in <shapeId>'s vat, under the current catalog.
export function containmentSet(catalog, shapeId) {
  const shapes = catalog.shapes || [];
  const byId = new Map(shapes.map((s) => [s.id, s]));
  if (!byId.has(shapeId)) return null; // not a shape this catalog names — a vat needs an adopted boundary
  const descendants = (rootId) => {
    const set = new Set([rootId]);
    let grew = true;
    while (grew) { // the spine: children name their parent via within
      grew = false;
      for (const s of shapes) if (s.within && set.has(s.within) && !set.has(s.id)) { set.add(s.id); grew = true; }
    }
    return set;
  };
  const shape = byId.get(shapeId);
  if (Array.isArray(shape.overlaps) && shape.overlaps.length) {
    // lateral: the coarse full-overlap set — everything possibly inside, named as such.
    const set = new Set([shapeId]);
    for (const o of shape.overlaps) if (byId.has(o)) for (const id of descendants(o)) set.add(id);
    return { set, grain: "overlap-coarse" };
  }
  return { set: descendants(shapeId), grain: "containment" };
}

export async function runVat(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const shapeId = opts.shape;
  if (!shapeId) throw new Error("vat: a shape id is required");
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const ledgerPath = opts.ledger || p("ANTIDOTE_PLACEMENTS", "place/ledger.json");
  const vatsDir = opts.vatsDir || p("ANTIDOTE_VATS", "vats");
  const { catalog, version } = await readCatalog(root, opts.catalog);

  const c = containmentSet(catalog, shapeId);
  if (!c) throw new Error(`vat: the adopted catalog names no shape '${shapeId}' — a boundary change is adopting a version that does, never drawing one here`);

  const ledger = readJson(ledgerPath, { entries: [] });
  const byConstitution = new Map();
  for (const e of ledger.entries || []) {
    if (!c.set.has(e.shape)) continue;
    if (!byConstitution.has(e.constitution)) byConstitution.set(e.constitution, []);
    byConstitution.get(e.constitution).push(e.id);
  }
  const composed_of = [...byConstitution.entries()].sort()
    .map(([constitution, ids]) => ({ constitution, records: band(ids.length), refs: ids.sort() }));

  const vat = { schema: "antidote.vat/v1", shape: shapeId, grain: c.grain, catalog_version: version, at,
    composed_of, derived: true,
    note: "a VIEW of the placement ledger x this catalog version — evict freely, reconstructable from the seed; references group per ORIGINAL constitution (no derivative COMMON without the counsel gate); counts are log bands" };
  mkdirSync(vatsDir, { recursive: true });
  const outPath = path.join(vatsDir, `${shapeId}.json`);
  writeFileSync(outPath, JSON.stringify(vat, null, 2) + "\n");
  return { vat, outPath };
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const shape = process.argv[2];
  if (!shape) { console.error("usage: bin/vat <shape-id>"); process.exit(2); }
  const { vat, outPath } = await runVat(root, { shape });
  const n = vat.composed_of.reduce((a, g) => a + g.refs.length, 0);
  console.error(`vat: ${vat.shape} (${vat.grain}) — ${n} reference(s) across ${vat.composed_of.length} constitution(s) -> ${path.relative(root, outPath)}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
