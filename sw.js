// sw.js — the offline APP SHELL for the antidote chronicle, in the Floor's posture (the smallest
// job): precache the shell, serve cache-first, collapse navigations onto the page. Relative paths
// throughout so the shell serves from any mount (the canonical domain is undecided — a TLD or
// antidote.anecdote.channel — and the shell shouldn't care).
//
// Deliberately NOT pin-enforcing yet. anecdote's sw.js is the grown form — firmware.json +
// trust-on-first-contact signer pin ("lock the hatch on the way out") — and this shell should adopt
// it before the vault carries real weight, because this origin DOES hold keys: the kept identity
// lives in IndexedDB ("antidote"/"vault"), gesture-gating and the pin are the bind-the-queen
// answer. Until then the two-layers rule still holds: the Cache API holds shell CODE; IndexedDB
// holds YOUR DATA (identity + chronicle); this SW never touches your data.

const VERSION = "antidote-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./vault/sign.mjs", "./vault/store.mjs", "./vault/keep.mjs", "./vault/chronicle.mjs"];

self.addEventListener("install", (e) => e.waitUntil((async () => {
  const cache = await caches.open(VERSION);
  await Promise.all(SHELL.map(async (u) => { try { const r = await fetch(u, { cache: "reload" }); if (r.ok) await cache.put(u, r); } catch {} }));
  await self.skipWaiting();
})()));

self.addEventListener("activate", (e) => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith("antidote-shell-") && k !== VERSION).map((k) => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      if (req.mode === "navigate") return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
      return Response.error();
    }
  })());
});
