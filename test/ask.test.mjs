// Unit: provision/ask.mjs — reserve an ASK anchor, offline-origin side. buildAskAnchor byte-mirrors
// data-pile bin/pile-ask.mjs (the constellation's mirror discipline). Run: node test/ask.test.mjs
import { buildAskAnchor, askAnchorBytes } from "../provision/ask.mjs";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const threw = (fn) => { try { fn(); return false; } catch { return true; } };

// The exact bytes bin/pile-ask.mjs writes (captured from the merged data-pile lead) — the mirror target.
const GOLDEN_A = `{
  "schema": "data-pile.ask-anchor/v1",
  "pile": "cd04",
  "ask": "water-main",
  "shown": true,
  "intent": "ask",
  "to": {
    "kind": "url",
    "url": "https://city.example/agenda"
  },
  "text": "Third break on Elm.",
  "guidance": "Cite this, or add what you can — an open ask: anything abides, nothing is auto-rejected.",
  "round": 1,
  "qr": null,
  "governed_by": "tell:_data/constitutions/cd04/water-main.json"
}
`;
const GOLDEN_B = `{
  "schema": "data-pile.ask-anchor/v1",
  "pile": "cd04",
  "ask": "src",
  "shown": true,
  "intent": "ask",
  "to": null,
  "text": "A source claims retaliation.",
  "guidance": "Cite this, or add what you can — an open ask: anything abides, nothing is auto-rejected.",
  "round": 1,
  "qr": null,
  "governed_by": "tell:_data/constitutions/cd04/src.json"
}
`;

// 1. shape
const a = buildAskAnchor({ pile: "cd04", ask: "water-main", url: "https://city.example/agenda", text: "Third break on Elm." });
ok(a.schema === "data-pile.ask-anchor/v1", "schema is the ask-anchor");
ok(a.intent === "ask", "intent:ask (dispatches how replies read)");
ok(a.shown === true, "marked as the SHOWN copy");
ok(a.qr === null, "qr slot reserved (null until signing)");
ok(!("options" in a), "an ask carries NO prefab answers (no options key)");
ok(a.to && a.to.url === "https://city.example/agenda" && a.to.kind === "url", "object reference carried in to");
ok(a.governed_by === "tell:_data/constitutions/cd04/water-main.json", "governed_by points at the Tell-side OPEN constitution");
ok(a.round === 1, "numeric round coerced");
ok(/citation|abides/i.test(a.guidance), "default guidance is citation-required");

// 2. byte-mirror against the data-pile lead (embedded goldens)
ok(askAnchorBytes(a) === GOLDEN_A, "url+text bytes are byte-identical to bin/pile-ask.mjs");
const b = buildAskAnchor({ pile: "cd04", ask: "src", text: "A source claims retaliation." });
ok(b.to === null, "text-only ask has to:null");
ok(askAnchorBytes(b) === GOLDEN_B, "text-only (to:null) bytes are byte-identical to bin/pile-ask.mjs");

// 3. invariants (inverse of the poll's)
ok(threw(() => buildAskAnchor({ pile: "cd04", ask: "void" })), "refuses an ask that points at nothing");
ok(threw(() => buildAskAnchor({ pile: "cd04", ask: "UPPER", text: "x" })), "refuses a non-slug ask");
ok(threw(() => buildAskAnchor({ ask: "x", text: "y" })), "refuses a missing pile");

// 4. live parity: if a data-pile sibling checkout is present, the lead must agree byte-for-byte.
const lead = join("..", "data-pile", "bin", "pile-ask.mjs");
if (existsSync(lead)) {
  const d = mkdtempSync(join(tmpdir(), "ask-"));
  writeFileSync(join(d, "pile.yml"), 'id: "cd04"\n');
  const out = execFileSync("node", [lead, "--dir", d, "--ask", "water-main",
    "--url", "https://city.example/agenda", "--text", "Third break on Elm.", "--out", "-"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  ok(out === askAnchorBytes(a), "live parity: bin/pile-ask.mjs sibling agrees byte-for-byte");
} else {
  console.log("  (skip: no ../data-pile sibling — embedded golden is the mirror target)");
}

console.log(fails ? `\nFAILED (${fails})` : "\nok: ask — buildAskAnchor mirrors data-pile bin/pile-ask; invariant enforced");
process.exit(fails ? 1 : 0);
