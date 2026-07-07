// bin/reveal.mjs — THE RE-INSERTION CHECK (ARCHITECTURE.draft-0 "each cutout is a hole only the held
// original fits"). Given a candidate record, compute its content-id and find its cutout in the plaque
// index: if the hole exists, the record provably belongs to this archive — verification is putting the
// piece back in the puzzle. This is the PUBLIC half of reveal-on-demand (anyone can check a disclosed
// record against the plaques, no key, kin to data-pile bin/prove); the licensed, receipted disclosure
// flow that HANDS a buyer the record is a later slice (the open questions register).
//
//   bin/reveal <record.json>     # print the cutout's location; exit 0 if it fits, 1 if no hole matches
// Env: ANTIDOTE_INDEX  the plaque index root  (default index)

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { contentId } from "./attest.mjs";
import { walkBuckets } from "./attest-heartbeat.mjs";

export async function findCutout(indexDir, record) {
  const id = typeof record === "string" ? record : await contentId(record);
  for (const b of walkBuckets(indexDir)) if (b.ids.includes(id))
    return { id, scope: b.scope, poll: b.poll, bucket: b.bucket, face: b.face };
  return null;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const indexDir = process.env.ANTIDOTE_INDEX || path.join(root, "index");
  const arg = process.argv[2];
  if (!arg) { console.error("usage: bin/reveal <record.json | sha256:...>"); process.exit(2); }
  const record = /^sha256:[0-9a-f]{64}$/.test(arg) ? arg : JSON.parse(readFileSync(arg, "utf8"));
  const hit = await findCutout(indexDir, record);
  if (!hit) { console.error("reveal: no cutout fits this record"); process.exit(1); }
  console.log(JSON.stringify(hit, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
