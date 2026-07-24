// test/provision-ui.test.mjs — ANTIDOTE MAKES A DATA-PILE, in a real browser, fully offline-origin:
// the researcher flow docs/faces.md and provision/pile.mjs exist for, driven end to end in Chromium.
// On one page (antidote's origin) the fixture:
//   1. MINTS the pile's age identity with real WebCrypto X25519 — anecdote.channel's age-mint,
//      imported cross-origin exactly as the glove would borrow it (no vendoring);
//   2. takes the data-pile TEMPLATE from a served checkout (the one-time-clone posture);
//   3. ASSEMBLES the pile's file-set with provision/pile.mjs (the empty wallet — byte-mirror of
//      data-pile bin/pile-new.mjs fillPile);
//   4. COMMITS it as a fresh root with git-enough (the King's Leap) — the pile repo exists on-device.
// Then Node asserts the result HOLDS THE DATA-PILE SHAPE (id/scope/recipient stamped, the
// provisioner attestation present) and that the CUSTODY LINE held: the private identity appears in
// NO assembled byte and NO committed object — the provisioner path never touches what opens the tank.
//
//   ANECDOTE_REPO=… DATA_PILE_REPO=… node test/provision-ui.test.mjs
//
// Skips cleanly without the sibling checkouts or a Chromium. (Plain-http transport — every module
// here is imported by URL, nothing is pinned to a production absolute URL.)
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const anecdote = process.env.ANECDOTE_REPO || join(root, "..", "anecdote.channel");
const dataPile = process.env.DATA_PILE_REPO || join(root, "..", "data-pile");
if (!existsSync(join(anecdote, "probe-test", "harness.mjs"))) {
  console.log("skip: no anecdote.channel checkout with probe-test/ (set ANECDOTE_REPO)");
  process.exit(0);
}
if (!existsSync(join(dataPile, "pile.yml"))) {
  console.log("skip: no data-pile checkout to take the template from (set DATA_PILE_REPO)");
  process.exit(0);
}
const { findChromium, withPage } = await import(pathToFileURL(join(anecdote, "probe-test", "harness.mjs")));

const chromium = findChromium();
if (!chromium) {
  console.log("skip: no chromium in this environment (set CHROMIUM=/path/to/chromium to run)");
  process.exit(0);
}

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

// The template subset the fixture pulls — pile.yml is the shape-carrier assemblePile requires; the
// rest ride through untouched (any data-pile checkout file would; these prove the pass-through).
const TEMPLATE_PATHS = ["pile.yml", "CONSTITUTION.md", "CONTRACT.md", "keys/custody.yml"];

const FIXTURE = `<!doctype html><meta charset=utf-8><title>provision ui fixture</title>
<script type="module">
import { mintAgeIdentity, parseRecipient } from "http://anecdote.channel:PORT/composer/age-mint.mjs";
import { repo } from "http://anecdote.channel:PORT/git-enough/repo.mjs";
import { assemblePile } from "/provision/pile.mjs";
window.R = { stage: "boot" };
try {
  // 1 — the identity mints ON the device; the secret never leaves this page's JS.
  window.R.stage = "mint";
  const minted = await mintAgeIdentity();
  parseRecipient(minted.recipient);   // throws if malformed — the mint is byte-honest

  // 2 — the template, from the one-time clone (served checkout).
  window.R.stage = "template";
  const template = [];
  for (const path of ${JSON.stringify(TEMPLATE_PATHS)}) {
    const res = await fetch("http://data-pile.example:PORT/" + path);
    if (!res.ok) throw new Error("template fetch failed: " + path);
    template.push({ path, content: await res.text() });
  }

  // 3 — the empty wallet fills: antidote assembles the pile's file-set.
  window.R.stage = "assemble";
  const files = assemblePile(template, {
    id: "parks-2026", scope: "riverbend", recipient: minted.recipient,
    owner: "riverbend-org", sourceUrl: "https://tell.anecdote.channel/piles/parks-2026/feed/",
    signer: "SHA256:AAAAtestsigner", provisioner: "antidote-ui-test",
  });

  // 4 — the King's Leap: the file-set becomes a real git repo, on-device.
  window.R.stage = "commit";
  const r = repo();
  const tip = await r.commitFiles(files, {
    root: true, message: "pile-new: parks-2026 (provisioned in-browser)\\n",
    author: { name: "antidote-ui-test", email: "test@local", epoch: 1750000000, tz: "+0000" },
  });

  // Sweep EVERY committed object's bytes for the custody check node-side.
  const dec = new TextDecoder();
  let objectBytes = "";
  for (const [, obj] of r.objects) {
    try { objectBytes += dec.decode(obj.content || obj); } catch {}
  }
  window.R = { stage: "done", recipient: minted.recipient, identityPrefix: minted.identity.slice(0, 14),
               identityInPage: minted.identity, files, tip, objectCount: r.objects.size, objectBytes };
} catch (e) {
  window.R = { stage: "error", error: String(e && e.message || e) };
}
</script>`;

// The fixture imports by absolute URL, and the http transport carries an ephemeral port — so the
// origin's tree is held BY REFERENCE and the port-stitched fixture is installed once it's known
// (lookup() reads the tree per request).
const antidoteTree = {};
const ran = await withPage({
  chromium,
  origins: {
    "antidote.example": { root, tree: antidoteTree },
    "anecdote.channel": { root: anecdote },
    "data-pile.example": { root: dataPile },
  },
}, async (page, { server }) => {
  antidoteTree["provision-ui.html"] = FIXTURE.replaceAll("PORT", String(server.port));

  await page.goto(server.urlFor("antidote.example", "/provision-ui.html"));
  const R = await page.waitFor("window.R && (window.R.stage === 'done' || window.R.stage === 'error') && window.R", { timeout: 30000 });
  if (R.stage === "error") { ok(false, "fixture failed at a stage: " + R.error); return; }

  // The mint is real: a well-formed age recipient from platform WebCrypto X25519.
  ok(/^age1[a-z0-9]{20,}$/.test(R.recipient), "a real age recipient minted in-browser: " + R.recipient.slice(0, 12) + "…");
  ok(R.identityPrefix === "AGE-SECRET-KEY", "…and the private identity exists only page-side");

  // The assembled file-set holds the data-pile shape.
  const byPath = Object.fromEntries(R.files.map((f) => [f.path, f.content]));
  ok(byPath["pile.yml"].includes('id: "parks-2026"'), "pile.yml carries the pile's id");
  ok(byPath["pile.yml"].includes('scope: "riverbend"'), "pile.yml carries the scope");
  ok(byPath["pile.yml"].includes('age_recipient: "' + R.recipient + '"'), "pile.yml pins the minted recipient");
  ok(byPath["pile.yml"].includes('url: "https://tell.anecdote.channel/piles/parks-2026/feed/"'),
     "the Tell source url is stamped — the pile knows where to pull");
  ok(byPath["pile.yml"].includes('provisioner: "antidote-ui-test"')
     && byPath["pile.yml"].includes('provisioner_spec: "data-pile/pile-new/v1"'),
     "the provisioner attestation is declared (CONTRACT.md, spec-or-attested)");
  ok(byPath["keys/pile.age.pub"] === R.recipient + "\n", "keys/pile.age.pub is exactly the public half");
  ok(byPath["CONSTITUTION.md"].length > 0 && byPath["keys/custody.yml"].length > 0,
     "the template's law and custody files ride through untouched");

  // The repo exists: a fresh root, all objects present.
  ok(/^[0-9a-f]{40}$/.test(R.tip), "the King's Leap committed a fresh root: " + R.tip.slice(0, 12) + "…");
  ok(R.objectCount >= R.files.length + 2, "blobs + trees + commit all landed in the object store");

  // THE CUSTODY LINE: the private identity is in no assembled byte and no committed object.
  const leakFiles = R.files.filter((f) => String(f.content).includes(R.identityInPage));
  ok(leakFiles.length === 0, "the private identity appears in NO assembled file");
  ok(!R.objectBytes.includes(R.identityInPage), "…and in NO committed git object — only the owner ever holds what opens the tank");

  ok(server.foreign.length === 0, "no request escaped to any host the test did not stand up");
});

if (!ran) { console.log("skip: harness could not start"); process.exit(0); }
if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall provision UI tests passed (mint → template → assemble → King's Leap, custody intact)");
