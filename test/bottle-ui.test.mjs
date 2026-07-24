// test/bottle-ui.test.mjs — the bottle-maker (bottle.html, docs/faces.md face 2) driven in a REAL
// Chromium. Slice 4's claims ("Driven in real Chromium: page hash == node sha256, forced-exact
// bytes, no network before the click, a changed comma re-points the live frame") were verified by
// hand when the handoff landed; this suite COMMITS them, runnable by anyone:
//   1. the hash ceremony is live and exact — the page's sha256 equals Node's over the same bytes;
//   2. the handoff stays LOCKED until terms exist, and the constitution is FORCED into the link;
//   3. the page makes no network at all before the operator's preview click (WebCrypto only);
//   4. the deliberate click iframes vanilla Tell — the one network gesture, carrying the forced law;
//   5. a changed byte is a DIFFERENT bottle: the live frame re-points to the new hash;
//   6. weaving questions into the terms moves them inside the hash (the byte-lock, not UI state).
// The harness is anecdote.channel's probe-test (sibling checkout, like the constellation's other
// cross-repo test consumers). Skips cleanly without the checkout, a Chromium, or the 443 bind.
//
//   ANECDOTE_REPO=path/to/anecdote.channel  node test/bottle-ui.test.mjs
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const anecdote = process.env.ANECDOTE_REPO || join(root, "..", "anecdote.channel");
const harnessPath = join(anecdote, "probe-test", "harness.mjs");
if (!existsSync(harnessPath)) {
  console.log("skip: no anecdote.channel checkout with probe-test/ (set ANECDOTE_REPO)");
  process.exit(0);
}
const { findChromium, withPage } = await import(pathToFileURL(harnessPath));

const chromium = findChromium();
if (!chromium) {
  console.log("skip: no chromium in this environment (set CHROMIUM=/path/to/chromium to run)");
  process.exit(0);
}

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const sha256 = (s) => "sha256:" + createHash("sha256").update(s, "utf8").digest("hex");

const TERMS = "Answers governed by these terms may be aggregated into public counts.\nThey may never be sold.\n";

// bottle.html pins Tell by absolute https URL, so the run needs the tls transport; Tell itself only
// needs to EXIST here (a stub) — what Tell renders is Tell's own suite's business (its chain test).
const origins = {
  "antidote.example": { root },
  "tell.anecdote.channel": { tree: { "index.html": "<!doctype html><title>tell stub</title>" } },
};

const ran = await withPage({ chromium, tls: true, origins }, async (page, { server }) => {
  await page.goto("https://antidote.example/bottle.html");
  await page.waitFor("!!document.getElementById('terms')");

  // 2 (first half) — no terms, no handoff.
  ok(await page.eval("document.getElementById('handoff-live').hidden") === true,
     "the handoff is locked while no terms exist — there is no hash to force");

  // 1 — the live hash ceremony matches Node byte-for-byte.
  await page.eval(`{
    const t = document.getElementById('terms');
    t.value = ${JSON.stringify(TERMS)};
    t.dispatchEvent(new Event('input'));
  }`);
  const expect = sha256(TERMS);
  await page.waitFor(`document.getElementById('hash').textContent === ${JSON.stringify(expect)}`);
  ok(true, "the page's live sha256 equals Node's over the exact bytes — the name is the hash");
  ok(await page.eval("document.getElementById('nbytes').textContent") === String(Buffer.byteLength(TERMS)),
     "the byte count is honest (every one of them is law)");

  // 2 — the handoff unlocks with the constitution FORCED into the link.
  ok(await page.eval("document.getElementById('handoff-live').hidden") === false, "terms unlock the handoff");
  await page.eval(`
    document.getElementById('study').value = 'parks 2026';
    document.getElementById('study').dispatchEvent(new Event('input'));
    document.getElementById('hq').value = 'What should the north meadow become?';
    document.getElementById('hq').dispatchEvent(new Event('input'));
  `);
  const href = await page.waitFor("document.getElementById('open').href");
  ok(href.startsWith("https://tell.anecdote.channel/?pile=parks-2026&poll=q1"),
     "the handoff link is vanilla Tell with the display grammar (slug from the study name)");
  ok(href.endsWith("constitution=" + encodeURIComponent(expect).replace(/%3A/gi, "%3A")) || href.includes("constitution=sha256%3A"),
     "the constitution rides the link");
  ok(decodeURIComponent(href).includes("constitution=" + expect), "…and it is EXACTLY the live hash — forced, never editable");
  ok(!/[?&](tok|post|su)=/.test(href), "no credential rides — a preview mints nothing");

  // 3 — nothing has touched the network but the page's own load.
  const before = [...new Set(page.requests.filter((r) => /^https?:/.test(r.url)).map((r) => new URL(r.url).hostname))];
  ok(before.every((h) => h === "antidote.example"),
     "before the click, every request is the page's own origin: " + before.join(", "));

  // 4 — the operator's deliberate click is the one network gesture.
  await page.eval("document.getElementById('frame-btn').click()");
  await page.waitFor("!!document.querySelector('#frame-mount iframe') && document.querySelector('#frame-mount iframe').src.length > 0");
  const frameSrc = await page.eval("document.querySelector('#frame-mount iframe').src");
  ok(decodeURIComponent(frameSrc).includes("constitution=" + expect), "the preview frame carries the forced law");
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !server.served.some((s) => s.host === "tell.anecdote.channel")) {
    await new Promise((r) => setTimeout(r, 100));
  }
  ok(server.served.some((s) => s.host === "tell.anecdote.channel"), "the click — and only the click — reached Tell");

  // 5 — a changed byte is a different bottle, and the live frame follows it.
  const TERMS2 = TERMS + "Retention: one year.\n";
  await page.eval(`{
    const t = document.getElementById('terms');
    t.value = ${JSON.stringify(TERMS2)};
    t.dispatchEvent(new Event('input'));
  }`);
  const expect2 = sha256(TERMS2);
  await page.waitFor(`document.getElementById('hash').textContent === ${JSON.stringify(expect2)}`);
  await page.waitFor(`decodeURIComponent(document.querySelector('#frame-mount iframe').src).includes(${JSON.stringify("constitution=" + expect2)})`);
  ok(true, "a changed byte re-points the live frame to the NEW bottle's hash");

  // 6 — weaving the question list moves it INSIDE the bytes (the lock a judge can read).
  await page.eval(`
    document.querySelector('input[name=mode][value=weave]').click();
    document.getElementById('q').value = 'Which trees should line the path?';
    document.getElementById('add-q').click();
  `);
  await page.waitFor("!document.getElementById('weave').hidden");
  await page.eval("document.getElementById('weave').click()");
  const woven = await page.waitFor("document.getElementById('terms').value.includes('QUESTIONS') && document.getElementById('terms').value");
  ok(woven.includes("- Which trees should line the path?"), "the list became BYTES of the terms");
  await page.waitFor(`document.getElementById('hash').textContent === ${JSON.stringify(sha256(woven))}`);
  ok(sha256(woven) !== expect2, "…and the woven bottle is a different name — the lock is the hash");

  ok(server.foreign.length === 0, "no request escaped to any host the test did not stand up");
});

if (!ran) { console.log("skip: could not bind 443 for the tls transport (root/CAP_NET_BIND_SERVICE, or sysctl net.ipv4.ip_unprivileged_port_start=443)"); process.exit(0); }
if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall bottle-maker UI tests passed (the hash ceremony, the forced handoff, the one-click network)");
