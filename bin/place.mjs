// bin/place.mjs — THE PLACEMENT LEDGER (docs/cascade.md "the seed corn"; civic-node #94). After the
// door admits and the punch files a cutout, this walks the plaque index and commits, for every
// content-id, the one pair that makes every rollup reconstructable and every boundary change
// survivable: (content-id -> best-known-finest-shape -> original constitution). Membership is NEVER
// baked into the record — vats join this ledger against the current catalog at query time.
//
// The v1 placement signal is the record's own carried SCOPE NAME (the index path segment the punch
// filed it under), matched against the catalog's shape ids — best-known-finest at name grain. A
// record naming no scope, or naming one the catalog doesn't hold, HOLDS: default-hold is the
// machine's literal default (the catalog ships empty, so at first everything holds), because
// falling past a boundary that can't place you is how data becomes unreconstructable.
//
// The refilter is this same verb, re-run: held records are re-tried every run, so the backlog
// drains the moment an adopted catalog version gains the missing shape. Placed entries are never
// rewritten and never removed (seed corn; a boundary change re-derives VATS, not placements).
//
//   bin/place        # walk the index, extend place/ledger.json, re-try the held backlog
// Env (ANTIDOTE_* overrides): ANTIDOTE_INDEX (default index), ANTIDOTE_SHAPES (default
// _data/shapes.json), ANTIDOTE_PLACEMENTS (default place/ledger.json).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { contentId, readJson } from "./attest.mjs";

// the declared catalog + its content-hash version (adopting a new document IS the boundary change).
export async function readCatalog(root, catalogPath) {
  const p = catalogPath || process.env.ANTIDOTE_SHAPES || path.join(root, "_data/shapes.json");
  const catalog = readJson(p, { schema: "antidote.shape-catalog/v1", lineage: "", shapes: [] });
  return { catalog, version: await contentId(catalog) };
}

// walk the plaque index -> every cutout with the scope segment it was filed under.
export function walkCutouts(indexDir) {
  const out = [];
  if (!existsSync(indexDir)) return out;
  const dirs = (p) => readdirSync(p).filter((d) => statSync(path.join(p, d)).isDirectory()).sort();
  for (const scope of dirs(indexDir)) for (const poll of dirs(path.join(indexDir, scope)))
    for (const bucket of dirs(path.join(indexDir, scope, poll))) {
      const dir = path.join(indexDir, scope, poll, bucket);
      for (const f of readdirSync(dir).filter((f) => /^[0-9a-f]{64}\.json$/.test(f)).sort()) {
        const c = readJson(path.join(dir, f), null);
        if (c?.schema === "antidote.cutout/v1") out.push({ scope: scope === "_" ? null : scope, poll, cutout: c });
      }
    }
  return out;
}

export async function runPlace(root, opts = {}) {
  const at = opts.now || new Date().toISOString();
  const p = (env, rel) => process.env[env] || path.join(root, rel);
  const indexDir = opts.indexDir || p("ANTIDOTE_INDEX", "index");
  const ledgerPath = opts.ledger || p("ANTIDOTE_PLACEMENTS", "place/ledger.json");
  const { catalog, version } = await readCatalog(root, opts.catalog);
  const shapeIds = new Set((catalog.shapes || []).map((s) => s.id).filter(Boolean));

  const ledger = readJson(ledgerPath, { schema: "antidote.placement-ledger/v1", catalog_version: null, entries: [], held: [] });
  const placed = new Set(ledger.entries.map((e) => e.id));
  const heldSince = new Map(ledger.held.map((h) => [h.id, h.since])); // a held record remembers how long it has waited

  let newlyPlaced = 0;
  const held = [];
  for (const { scope, cutout: c } of walkCutouts(indexDir)) {
    if (placed.has(c.id)) continue; // seed corn: a placement is never rewritten
    if (scope && shapeIds.has(scope)) {
      ledger.entries.push({ id: c.id, shape: scope, constitution: c.constitution, placed_at: at, catalog_version: version });
      placed.add(c.id);
      newlyPlaced++;
    } else {
      // default-hold: no scope, or a scope the adopted catalog doesn't hold — waits, named, loses nothing.
      held.push({ id: c.id, waiting_for: scope || null, constitution: c.constitution, since: heldSince.get(c.id) || at });
    }
  }
  ledger.held = held; // rebuilt each run — the re-try IS the refilter; the drain trigger is a catalog that gained the shape
  ledger.catalog_version = version;
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
  return { placed: newlyPlaced, total: ledger.entries.length, held: held.length, catalog_version: version, ledgerPath };
}

// ---- CLI -------------------------------------------------------------------------------------------------
async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const r = await runPlace(root);
  console.error(`place: ${r.placed} newly placed (${r.total} total), ${r.held} held at the boundary — catalog ${r.catalog_version.slice(0, 23)}…`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
