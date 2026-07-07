// Unit: the offline origin — vault/sign.mjs (the vendored core), vault/keep.mjs (the kept,
// non-extractable identity), vault/chronicle.mjs (the personal append log), and the INTEROP that
// makes it all one system: a ballot signed in the vault verifies under bin/attest.mjs, content-ids
// agree, and the chronicle's walk-up bundle admits through the server's own intake door.
// Run: node test/chronicle.test.mjs
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateIdentity, attest as vaultAttest, verifyAttestation, contentId as vaultContentId } from "../vault/sign.mjs";
import { memoryStore } from "../vault/store.mjs";
import { keepIdentity, heldIdentity, shred } from "../vault/keep.mjs";
import { append, entries, verifyChronicle, attestHead, witness, timeline, exportLooseMail, entryId } from "../vault/chronicle.mjs";
import { verifyAttested as binVerify, contentId as binContentId } from "../bin/attest.mjs";
import { runIntake } from "../bin/intake-verify.mjs";
import { runPunch } from "../bin/punch.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };
const S = "sha256:" + "5".repeat(64);

// 1. the kept identity: minted once, held thereafter, non-extractable, shreddable.
{
  const store = memoryStore();
  ok((await heldIdentity(store)) === null, "a fresh vault holds no identity");
  const first = await keepIdentity(store);
  ok(first.minted === true && /^key:sha256:[0-9a-f]{64}$/.test(first.fingerprint), "first visit mints, fingerprint in the constellation format");
  ok(first.privateKey.extractable === false, "the private half is non-extractable — the documented posture, finally shipped");
  const second = await keepIdentity(store);
  ok(second.minted === false && second.fingerprint === first.fingerprint, "second visit holds — same identity, no re-mint");
  await shred(store);
  ok((await heldIdentity(store)) === null, "shred forgets the identity (the chronicle is a separate key, spared)");
}

// 2. sign-then-self-archive: one gesture — the ballot lands in the chronicle as its first witness.
{
  const store = memoryStore();
  const me = await keepIdentity(store);
  const ballot = await vaultAttest({ schema: "anecdote.ballot/v1", pile: "cd04-q1", poll: "budget",
    answer: "Keep", ts: "2026-07-07T18:00:00Z", scope: "colorado" }, me);
  const { entry, seq } = await append(store, me, { kind: "answer", body: ballot, at: "2026-07-07T18:00:01Z" });
  ok(seq === 0 && entry.prev === null && entry.kind === "answer", "genesis entry roots the chain");
  ok(entry.body.sig.by === me.fingerprint && entry.sig.by === me.fingerprint, "ballot and chronicle entry carry the same signer — one identity, two artifacts");
  await append(store, me, { kind: "note", body: { text: "voted at the library" }, at: "2026-07-07T18:05:00Z" });
  const log = await entries(store);
  ok(log[1].prev === (await entryId(log[0])) && log[1].seq === 1, "entries hash-link by entry id — the when-ish proof");
  const v = await verifyChronicle(log);
  ok(v.ok && v.length === 2, "the whole spine verifies: every signature, every link");
}

// 3. tampering breaks the spine loudly.
{
  const store = memoryStore();
  const me = await keepIdentity(store);
  await append(store, me, { kind: "note", body: { text: "one" }, at: "2026-07-07T10:00:00Z" });
  await append(store, me, { kind: "note", body: { text: "two" }, at: "2026-07-07T11:00:00Z" });
  const log = await entries(store);
  const doctored = [{ ...log[0], body: { text: "won" } }, log[1]];
  const v = await verifyChronicle(doctored);
  ok(!v.ok && v.errors.some((e) => e.includes("#0")) && v.errors.some((e) => e.includes("#1: prev")), "a doctored entry fails its own sig AND snaps the next link");
}

// 4. the head, witnesses, and the merged timeline.
{
  const store = memoryStore();
  const me = await keepIdentity(store);
  const seen = { schema: "atlas.drops/v1", self: "colorado", at: "2026-07-07T09:00:00Z" };
  await append(store, me, { kind: "witness", body: await witness(seen, { note: "their manifest, my copy" }), at: "2026-07-07T09:01:00Z" });
  await append(store, me, { kind: "poll", body: { schema: "anecdote.poll/v1", question: "paint the crosswalk?" }, at: "2026-07-07T12:00:00Z" });
  await append(store, me, { kind: "note", body: { text: "later thought" }, at: "2026-07-07T10:30:00Z" });
  const log = await entries(store);
  ok(log[0].body.id === (await vaultContentId(seen)) && log[0].body.thing.self === "colorado", "a witness names the thing by content-id and may keep it whole");
  const tl = timeline(log);
  ok(tl.map((e) => e.kind).join(",") === "poll,note,witness", "the timeline shuffles kinds together newest-first; storage stays chain-ordered");
  ok(timeline(log, { kinds: ["note"] }).length === 1, "the UI can slice by kind");
  const head = await attestHead(store, me, { at: "2026-07-07T13:00:00Z" });
  ok((await verifyAttestation(head)).ok && head.seq === 2 && head.self === me.fingerprint, "the head attests the spine's tip — the personal twin of the server ledger head");
}

// 5. INTEROP — the whole point: vault signatures ARE constellation signatures.
{
  const store = memoryStore();
  const me = await keepIdentity(store);
  const ballot = await vaultAttest({ schema: "anecdote.ballot/v1", pile: "hearsay-7", poll: "crosswalk",
    answer: "Paint it", ts: "2026-07-07T18:00:00Z", scope: "colorado" }, me);
  ok((await binVerify(ballot)).ok, "a vault-signed ballot verifies under bin/attest.mjs — one grammar, both paths");
  ok((await binContentId(ballot)) === (await vaultContentId(ballot)), "content-ids agree byte for byte — the commitment IS the id everyone has");
  await append(store, me, { kind: "answer", body: ballot, at: "2026-07-07T18:00:01Z" });

  // walk up to a server and offer the chronicle as loose mail; the door tells us what was new.
  const dir = mkdtempSync(path.join(tmpdir(), "antidote-walkup-"));
  mkdirSync(path.join(dir, "_data"), { recursive: true });
  writeFileSync(path.join(dir, "antidote.yml"), `id: server\nconstitution: "${S}"\nstamp_default: "${S}"\n`);
  writeFileSync(path.join(dir, "_data/lattice.json"), JSON.stringify({ schema: "antidote.lattice/v1", permits: {}, refuses: {} }));
  const mail = exportLooseMail(await entries(store), me.fingerprint);
  ok(mail.from === me.fingerprint && mail.ballots.length === 1, "the walk-up bundle is the loose-mail shape, from = the holder");
  writeFileSync(path.join(dir, "_data/intake-inbox.json"), JSON.stringify(mail));
  const { manifest } = await runIntake(dir, { now: "2026-07-07T19:00:00Z" });
  ok(manifest.fates.admit.length === 1 && manifest.from === me.fingerprint, "the door admits the offered record");
  const { punched } = await runPunch(dir, { now: "2026-07-07T19:00:00Z" });
  ok(punched.length === 1, "one cutout punched — the archive tells the walker exactly which records were new");
  const again = await runPunch(dir, { now: "2026-07-07T19:05:00Z" });
  ok(again.punched.length === 0, "offering the same chronicle twice: nothing was new, and the door says so");
}

if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall chronicle tests passed");
