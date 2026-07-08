// bin/constitution-shape.mjs — READING a constitution's shape, never DECIDING on it.
//
// The bottle-maker (docs/faces.md, face 2) offers "questions optional" in two meanings:
//   OPEN     — building to be filled: no closed question set; the space stays open.
//   LIMITING — limiting the space: the author WOVE a literal question list into the terms text,
//              so it sits inside the hash. bottle.html writes it under an exact marker line.
// Because "the lock is bytes, not UI state," the shape is recoverable by ANYONE from the exact
// bytes — this module is that reader. It is deliberately NOT the gateway: it emits no verdict,
// never "admit"/"refuse". Its output is an ADVISORY the human sees on a QUEUED entry
// (bin/judge-constitution keeps the hash-only verdict; guard #2 the ratchet, guard #9 the queue).
//
//   bin/constitution-shape <constitution-file>   # print { shape, questions, hash } for the exact bytes
//
// The marker MUST match bottle.html's woven block byte-for-byte, or a limiting bottle reads as open.

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defaultHash } from "./attest.mjs";

// The exact phrase bottle.html welds in when you "weave the list into the terms".
export const WOVEN_MARKER = "QUESTIONS — this constitution governs ONLY the following questions:";

// Pure: classify a constitution's TEXT. A limiting constitution carries the woven marker and a
// bulleted list right after it; everything else is open (no machine-readable closed set — which is
// NOT a claim of compatibility, only the honest absence of a list).
export function classifyConstitution(text) {
  const src = String(text || "");
  const at = src.indexOf(WOVEN_MARKER);
  if (at === -1) return { shape: "open", questions: [] };
  // Read consecutive "- item" lines immediately following the marker line; stop at the first
  // line that is not a list item (a blank line, prose, or EOF closes the list).
  const after = src.slice(at + WOVEN_MARKER.length).split("\n");
  const questions = [];
  for (const raw of after) {
    const line = raw.replace(/\r$/, "");
    if (line.trim() === "") { if (questions.length) break; else continue; } // skip the marker's own newline
    const m = line.match(/^-\s+(.+?)\s*$/);
    if (!m) break;
    questions.push(m[1]);
  }
  // A marker with no items is a malformed weave — honestly still "limiting" (the author declared a
  // closed intent), but with an empty list the human must read the bytes themselves.
  return { shape: "limiting", questions };
}

// Pure: the ADVISORY for a queued pair, read from lattice annotations. Returns null when nothing is
// known — the honest default that leaves `opinion: null` exactly as an un-annotated queue had it.
// NEVER a verdict: it only describes shapes the human then judges. lattice.shapes maps a constitution
// hash to its classifyConstitution() result, recorded at registration time.
export function shapeOpinion({ answer, server, lattice = {} } = {}) {
  const shapes = lattice.shapes || {};
  const parts = [];
  const say = (label, hash) => {
    const s = shapes[hash];
    if (!s) return; // unread — say nothing rather than imply a reading we don't have
    const n = (s.questions || []).length;
    if (s.shape === "limiting") parts.push(`${label} limits to a closed set of ${n} question${n === 1 ? "" : "s"}`);
    else if (s.shape === "open") parts.push(`${label} is open — no closed question set`);
  };
  say("this server's constitution", server);
  say("the arrival's constitution", answer);
  if (!parts.length) return null;
  // Surface the actual closed list the human must check against — the server's own if it limits,
  // else the arrival's if that is the limiting side. Bytes in front of the eyes, per faces.md.
  const limitingList =
    (shapes[server]?.shape === "limiting" && shapes[server].questions) ||
    (shapes[answer]?.shape === "limiting" && shapes[answer].questions) ||
    [];
  return { advisory: parts.join("; ") + ".", questions: limitingList };
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("usage: bin/constitution-shape <constitution-file>"); process.exit(2); }
  const bytes = readFileSync(file);
  const shape = classifyConstitution(bytes.toString("utf8"));
  const hash = await defaultHash(bytes); // the bottle's NAME — over the EXACT bytes, same as bottle.html
  console.log(JSON.stringify({ hash, ...shape }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
