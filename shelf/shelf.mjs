// shelf/shelf.mjs — THE SHELF (docs/faces.md, face 3): browse what exists, offline. Pure reading —
// it judges nothing, moves nothing, holds no identity. It turns the server's own published data
// (the lattice + the coverage index) into the three things the storefront advertises:
//
//   causes     — the COMMON CAUSES on offer: every `permits` pair in the lattice is a meet the judge
//                already ASSAYED and found miscible (docs/common-cause.md) — two constitutions found
//                to share a floor. That discovered meet is a common cause; the shelf lists it.
//   silt       — the STUDIES THAT COULD RISE: the coverage holes (bin/coverage), data held that no
//                rung and no vat asked for — the runoff made legible ("what you didn't know to ask").
//   board      — the LABEL BOARD: every constitution the server knows, with its fill/limit shape
//                (slice 5) and its standing (how much it permits / refuses).
//   estimates  — how much a set of terms would ATTRACT: the held placement BANDS, coarse standing
//                only, never raw (the honest estimate is what the archive already holds).
//
// Everything ships empty (the constitutions/ starter set, the lattice, the coverage index all do),
// so `empty` is a first-class state: a fresh archive is the onboarding case, not an error. The page
// (shelf.html) fetches the same-origin JSON and hands it here; tests drive buildShelf directly.

const VALID = /^sha256:[0-9a-f]{64}$/;

// Pure: the whole browse model from the server's published data. Missing/blank inputs => empty
// sections, never a throw — a fresh server shelves nothing and says so.
export function buildShelf({ coverage, lattice } = {}) {
  coverage = coverage || {};
  lattice = lattice || {};
  const permits = lattice.permits || {};
  const refuses = lattice.refuses || {};
  const shapes = lattice.shapes || {};
  const held = Array.isArray(coverage.held) ? coverage.held : [];
  const holes = Array.isArray(coverage.holes) ? coverage.holes : [];

  const shapeOf = (c) => (shapes[c] && (shapes[c].shape === "limiting" || shapes[c].shape === "open")) ? shapes[c].shape : "unread";
  const qsOf = (c) => (shapes[c] && Array.isArray(shapes[c].questions)) ? shapes[c].questions : [];

  // The common causes: each (A permits S) is a discovered meet — the assay already found them
  // miscible. Skip malformed hashes rather than shelve a fake cause.
  const causes = [];
  for (const [a, servers] of Object.entries(permits)) {
    if (!VALID.test(a)) continue;
    for (const s of (Array.isArray(servers) ? servers : [])) {
      if (!VALID.test(s)) continue;
      causes.push({ constitution: a, admits: s, shape: shapeOf(a), questions: qsOf(a) });
    }
  }
  causes.sort((x, y) => (x.constitution + x.admits).localeCompare(y.constitution + y.admits));

  // The label board: every constitution named anywhere the server speaks of them.
  const known = new Set();
  for (const c of Object.keys(permits)) if (VALID.test(c)) known.add(c);
  for (const c of Object.keys(refuses)) if (VALID.test(c)) known.add(c);
  for (const c of Object.keys(shapes)) if (VALID.test(c)) known.add(c);
  for (const h of held) for (const c of (h.constitutions || [])) if (VALID.test(c)) known.add(c);
  const board = [...known].sort().map((c) => ({
    constitution: c, shape: shapeOf(c), questions: qsOf(c),
    permits: (permits[c] || []).length, refuses: (refuses[c] || []).length,
  }));

  // The silt: coverage holes, named shape by shape — studies that could rise.
  const silt = holes.map((h) => ({
    shape: h.shape, placements: h.placements || "0",
    constitutions: Array.isArray(h.constitutions) ? h.constitutions : [],
    note: "held, asked for by nobody — a study that could rise",
  }));

  // The estimates: what the archive already holds, in bands (coarse standing, never raw).
  const estimates = held.map((h) => ({
    shape: h.shape, placements: h.placements || "0",
    constitutions: Array.isArray(h.constitutions) ? h.constitutions : [],
    redundancy: typeof h.redundancy === "number" ? h.redundancy : (h.claimed_by || []).length,
  }));

  return {
    empty: !causes.length && !board.length && !silt.length && !estimates.length,
    causes, board, silt, estimates,
    unplaced: coverage.unplaced || "0",
    at: coverage.at || null,
  };
}

// Thin I/O for the page: fetch the same-origin published data, gracefully, and build the model.
// A missing file (a server that never ran bin/coverage, a bare lattice) is an empty section, not a
// failure — the offline origin reads what is there and says honestly what is not.
export async function loadShelf(fetchFn, base = "./") {
  const grab = async (rel, fallback) => {
    try {
      const res = await fetchFn(base + rel);
      if (!res || !res.ok) return fallback;
      return await res.json();
    } catch { return fallback; }
  };
  const [coverage, lattice] = await Promise.all([
    grab("coverage.json", {}),
    grab("_data/lattice.json", {}),
  ]);
  return buildShelf({ coverage, lattice });
}
