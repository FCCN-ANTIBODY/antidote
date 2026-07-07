// vault/chronicle.mjs — THE CHRONICLE: an individual's historical log (docs/offline-origin.md).
// One person, one instance, one append-only chain — no sharding, no redundancy, no fancy
// infrastructure. We are expecting to hold it all.
//
// Every entry is BOTH signed and chained, and that pairing is the artifact: the signature proves
// WHO, the chain position proves WHEN-ISH — an entry hash-linked between yesterday's and
// tomorrow's is very hard to backdate, so the moment you put your signing gesture through, the
// chronicle entry is the first witness your ballot ever had: "logged right here, right then,"
// beyond what the key alone can say. (The Atlas's tee is the same shape at another altitude — a
// witness names a content-id and a moment, signed by whoever witnessed.)
//
// The entry grammar is the constellation's ledger grammar, personalized:
//
//   { schema: "antidote.chronicle-entry/v1", seq, prev, at, kind, body, sig }
//
//   seq   — 0-based position; prev — the ENTRY ID (contentId of the previous SIGNED entry — the
//           same hash a ballotId is) or null at genesis; at — the holder's clock, ISO8601;
//   kind  — the open entity-type namespace. Named conventions (nothing rejects an unknown kind —
//           the index doesn't need to be immediately browsable, and the UI merges the timeline):
//             "answer"   body = the SIGNED ballot you just cast (sign-then-self-archive, one gesture)
//             "poll"     body = a poll/question you made
//             "witness"  body = { id, note?, thing? } — something external you saw, named by
//                        content-id; keep the thing itself if you choose (your vault, your call)
//             "note"     body = { text } — a plain diary mark
//   body  — the thing itself, kept whole. Damage is a publication act; a chronicle is storage.
//
// The head is the personal twin of the server ledger's attested head — re-attestable, datable,
// and exactly what you'd show to prove your log's spine without showing its contents.

import { attest, verifyAttestation, contentId } from "./sign.mjs";

export const ENTRY_SCHEMA = "antidote.chronicle-entry/v1";
export const HEAD_SCHEMA = "antidote.chronicle-head/v1";
export const LOG_KEY = "chronicle:log";

export async function entryId(signedEntry) { return contentId(signedEntry); }

async function readLog(store) { return (await store.get(LOG_KEY)) || []; }

// Append one entry: chain it onto the last, sign it, keep it. Returns { entry, id, seq }.
export async function append(store, identity, { kind, body, at } = {}, opts = {}) {
  if (!kind || typeof kind !== "string") throw new Error("chronicle: an entry needs a kind");
  if (body === undefined) throw new Error("chronicle: an entry needs a body");
  const log = await readLog(store);
  const last = log[log.length - 1] || null;
  const entry = await attest({
    schema: ENTRY_SCHEMA,
    seq: last ? last.seq + 1 : 0,
    prev: last ? await entryId(last) : null,
    at: at || new Date().toISOString(),
    kind, body,
  }, identity, opts);
  log.push(entry);
  await store.set(LOG_KEY, log);
  return { entry, id: await entryId(entry), seq: entry.seq };
}

export async function entries(store) { return readLog(store); }

// Verify the whole spine: every signature, every link, every seq. Returns { ok, length, errors }.
export async function verifyChronicle(log, opts = {}) {
  const errors = [];
  let prevId = null;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.schema !== ENTRY_SCHEMA) errors.push(`#${i}: not a chronicle entry`);
    if (e.seq !== i) errors.push(`#${i}: seq ${e.seq} != ${i}`);
    if ((e.prev ?? null) !== prevId) errors.push(`#${i}: prev does not link`);
    const v = await verifyAttestation(e, opts);
    if (!v.ok) errors.push(`#${i}: ${v.errors.join("; ")}`);
    prevId = await entryId(e);
  }
  return { ok: errors.length === 0, length: log.length, errors };
}

// The re-attestable head: the spine's current tip, signed and dated. digest covers the ordered
// entry ids, so it commits to the whole history without carrying it.
export async function attestHead(store, identity, opts = {}) {
  const log = await readLog(store);
  const ids = [];
  for (const e of log) ids.push(await entryId(e));
  return attest({
    schema: HEAD_SCHEMA,
    self: identity.fingerprint,
    seq: log.length ? log[log.length - 1].seq : null,
    digest: await contentId(ids),
    at: opts.at || new Date().toISOString(),
  }, identity, opts);
}

// A witness body: name an external thing by content-id; keep the thing itself if asked. The same
// witness shape whoever the witness is — a person here, an Atlas teeing what it handled there.
export async function witness(thing, { note, keep = true } = {}) {
  const body = { id: await contentId(thing) };
  if (note) body.note = note;
  if (keep) body.thing = thing;
  return body;
}

// The merged timeline: every kind shuffled together, newest first, ties broken by chain order.
// Storage stays chain-ordered; presentation is the UI's business — this is that seam.
export function timeline(log, { kinds } = {}) {
  const keep = kinds && kinds.length ? new Set(kinds) : null;
  return log
    .filter((e) => !keep || keep.has(e.kind))
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : b.seq - a.seq));
}

// The walk-up bundle: every signed ballot in the chronicle, as the LOOSE MAIL shape an antidote
// server's intake door already accepts — so any individual can walk up and offer their records,
// and the door's fate manifest tells them which ones were new.
export function exportLooseMail(log, self) {
  const ballots = log.filter((e) => e.kind === "answer" && e.body && e.body.sig).map((e) => e.body);
  return { from: self || "carrier", ballots };
}
