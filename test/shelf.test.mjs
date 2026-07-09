// Unit: shelf/shelf.mjs — the shelf's browse model (docs/faces.md face 3). Pure reading of the
// server's published lattice + coverage into causes / silt / label-board / estimates, with the
// empty archive as a first-class state. Run: node test/shelf.test.mjs
import { buildShelf, loadShelf } from "../shelf/shelf.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const H = (ch) => "sha256:" + ch.repeat(64);
const A = H("a"), B = H("b"), S = H("5");

// 1. The empty archive is a first-class state — a fresh server shelves nothing and says so, never throws.
{
  const shelf = buildShelf();
  ok(shelf.empty === true, "no data -> empty shelf");
  ok(shelf.causes.length === 0 && shelf.board.length === 0 && shelf.silt.length === 0, "every section empty");
  ok(buildShelf({ coverage: null, lattice: null }).empty === true, "null inputs tolerated -> still empty");
}

// 2. Common causes: each `permits` pair is a discovered meet the assay found miscible.
{
  const lattice = { permits: { [A]: [S], [B]: [S] }, refuses: {},
    shapes: { [A]: { shape: "limiting", questions: ["Cut or keep?"] } } };
  const shelf = buildShelf({ lattice });
  ok(!shelf.empty && shelf.causes.length === 2, "two permits -> two common causes on the shelf");
  const ca = shelf.causes.find((c) => c.constitution === A);
  ok(ca.admits === S && ca.shape === "limiting" && ca.questions[0] === "Cut or keep?", "a cause carries its meet + fill/limit shape + closed list");
  const cb = shelf.causes.find((c) => c.constitution === B);
  ok(cb.shape === "unread", "an unannotated cause reads as unread — no shape claimed we don't have");
}

// 3. Malformed hashes are never shelved as fake causes.
{
  const shelf = buildShelf({ lattice: { permits: { "sha256:short": [S], [A]: ["not-a-hash"] } } });
  ok(shelf.causes.length === 0, "a malformed constitution or admits-scope shelves no cause");
}

// 4. The label board: every constitution the server names, with shape + standing, de-duplicated.
{
  const lattice = { permits: { [A]: [S] }, refuses: { [B]: [S] },
    shapes: { [A]: { shape: "open", questions: [] } } };
  const coverage = { held: [{ shape: "colorado", placements: "10s", constitutions: [A], redundancy: 1 }] };
  const shelf = buildShelf({ coverage, lattice });
  const seen = shelf.board.map((b) => b.constitution);
  ok(seen.includes(A) && seen.includes(B) && new Set(seen).size === seen.length, "board names A and B once each, from permits/refuses/held");
  const ba = shelf.board.find((b) => b.constitution === A);
  ok(ba.shape === "open" && ba.permits === 1 && ba.refuses === 0, "a board entry carries its shape and its standing");
}

// 5. The silt = coverage holes = studies that could rise; estimates = held bands (coarse, never raw).
{
  const coverage = { at: "2026-07-09T00:00:00Z", unplaced: "10s",
    held: [{ shape: "colorado", placements: "100s", constitutions: [A], redundancy: 1 }],
    holes: [{ shape: "cheyenne", placements: "10s", constitutions: [B] }] };
  const shelf = buildShelf({ coverage });
  ok(shelf.silt.length === 1 && shelf.silt[0].shape === "cheyenne" && /could rise/.test(shelf.silt[0].note), "a hole becomes a study that could rise");
  ok(shelf.estimates.length === 1 && shelf.estimates[0].placements === "100s", "held shows as a placement band, not a raw count");
  ok(shelf.unplaced === "10s" && shelf.at === "2026-07-09T00:00:00Z", "the boundary backlog band and the index date ride along");
}

// 6. loadShelf: a graceful reader — a missing file is an empty section, not a failure.
{
  const files = { "./coverage.json": { held: [{ shape: "x", placements: "10s", constitutions: [A] }], holes: [] } };
  const fetchFn = async (u) => (u in files ? { ok: true, json: async () => files[u] } : { ok: false });
  const shelf = await loadShelf(fetchFn, "./");
  ok(shelf.estimates.length === 1, "loadShelf reads coverage.json");
  ok(shelf.causes.length === 0, "a missing lattice.json is an empty section, never a throw");
  const dead = await loadShelf(async () => { throw new Error("offline"); }, "./");
  ok(dead.empty === true, "a total fetch failure yields an honest empty shelf, offline");
}

if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall shelf tests passed");
