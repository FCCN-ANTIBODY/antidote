// bin/judge-constitution.mjs — THE GATEWAY (ARCHITECTURE.draft-0 "the lattice and the queue"). Decides,
// for one answer's constitution against this server's declared constitution, exactly one of:
//
//   admit   — the answer's constitution permits at least this server's declared scope: identical hashes,
//             or the known lattice says A permits S.
//   refuse  — the known lattice says A and S are incompatible (an explicit refusal, never an inference).
//   queue   — anything the lattice doesn't know. Novel constitutions WAIT (the human-paced consent queue
//             of ANTIDOTE.draft-0): guard #9, the judge is never the sole gate. An advisory external
//             judge (ANTIDOTE_JUDGE_CMD, the ATLAS_MATCH_CMD seam) may attach an OPINION to the queued
//             entry for the human who will decide — it can never admit.
//
// THE RATCHET RULE lives upstream of this file: the server's constitution is DECLARED in antidote.yml
// (a content hash), never computed from holdings. This gateway only ever compares against that fixed
// declaration, so admission can never mutate the license of what is held (guard #2).
//
//   bin/judge-constitution <answer-constitution-hash>   # print the verdict, exit 0 admit / 3 queue / 4 refuse
// Env (ANTIDOTE_* overrides, the code-vs-data split):
//   ANTIDOTE_SELF      the server charter                     (default antidote.yml)
//   ANTIDOTE_LATTICE   the known-constitution lattice         (default _data/lattice.json)

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { readJson, scalar } from "./attest.mjs";

// The pure verdict. lattice: { permits: { "<A>": ["<S>", ...] }, refuses: { "<A>": ["<S>", ...] } } —
// permits/refuses are statements ABOUT answer-constitution A, listing server scopes it does/doesn't cover.
export function judgeConstitution({ answer, server, lattice = {} } = {}) {
  if (!answer) return "refuse"; // no constitution, no catalog (guard #4) — the stamp happens at intake, not here
  if (!server) return "refuse"; // an unchartered server admits nothing
  if (answer === server) return "admit";
  if ((lattice.refuses?.[answer] || []).includes(server)) return "refuse";
  if ((lattice.permits?.[answer] || []).includes(server)) return "admit";
  return "queue";
}

export function readCharter(root) {
  const p = process.env.ANTIDOTE_SELF || path.join(root, "antidote.yml");
  const yml = existsSync(p) ? readFileSync(p, "utf8") : "";
  return {
    id: scalar(yml, "id") || "antidote",
    constitution: scalar(yml, "constitution"),
    category: scalar(yml, "category"),
    stamp: scalar(yml, "stamp_default"), // a constitution hash to stamp onto bare arrivals, or empty = refuse them
  };
}

export function readLattice(root) {
  const p = process.env.ANTIDOTE_LATTICE || path.join(root, "_data/lattice.json");
  return readJson(p, { schema: "antidote.lattice/v1", permits: {}, refuses: {} });
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const answer = process.argv[2];
  if (!answer) { console.error("usage: bin/judge-constitution <answer-constitution-hash>"); process.exit(2); }
  const charter = readCharter(root);
  const verdict = judgeConstitution({ answer, server: charter.constitution, lattice: readLattice(root) });
  console.log(verdict);
  process.exit(verdict === "admit" ? 0 : verdict === "queue" ? 3 : 4);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
