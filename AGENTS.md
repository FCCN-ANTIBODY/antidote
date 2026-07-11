# Orientation

This repository is **Antidote: the archivist** — the "place above," occupied as a *position, not
an apex*. Where an Atlas forwards ballots dumb and fast, Antidote is the record of account: it
assembles piles, dedups by content-id, models best-known-jurisdiction, judges each arrival against
a **declared constitution** (the ratchet rule), and issues attested reports. Its product is
*freshness, not secrecy* — the dated heartbeat over signed plaques only the key-holder can issue.
It ships deliberately **unchartered** (`antidote.yml` declares no constitution), so the door
admits nothing by honest default. Intent is serialized in prose first
(`ARCHITECTURE.draft-0.md`, `docs/`); each named verb then exists as a vendorless node-stdlib seam
under `bin/`, importable by its own test.

## Where the truth is, in reading order

1. **Demos before docs.** The constellation's capability index is the demo shelf in
   [`anecdote.channel`](https://github.com/FCCN-ANTIBODY/anecdote.channel) (`composer/*-demo.html`,
   `viewer/`, `git-enough/`, `reducer/demo.mjs` — its `AGENTS.md` carries the table). This repo's
   own runnable surface: the three offline HTML faces open directly — `index.html` (the
   chronicle), `bottle.html` (the bottle-maker), `shelf.html` (the shelf) — and the `test/*.test.mjs`
   suites double as executable specs for every `bin/` verb.
2. **Open issues are urgent** — a live problem with the current implementation, ahead of the
   deferred backlog. Roadmapping does *not* live in issues; it lives in the documents
   (`ARCHITECTURE.draft-0.md`, `docs/`, civic-node `VISION.md`), and design writing is moving back
   into repo files, off the public issue surface.
3. **The deferred half lives in one place** — civic-node
   [`OPEN-QUESTIONS.md`](https://github.com/FCCN-ANTIBODY/civic-node/blob/main/OPEN-QUESTIONS.md)
   (the cascade is §C; the archive posture threads through §N). Record a deferral there.
4. **The shape, then the seams.** `ARCHITECTURE.draft-0.md` is the serialized intent; `docs/`
   holds the faces (`faces.md`), the market noun (`common-cause.md`), the cascade tier
   (`cascade.md`), and the pile→archive wire (`teleport.md`). Draft-zero is on purpose — prose
   leads, code follows.

## The offline origin is the destination

Capability is migrating off GitHub and down to the operator's device — the anecdote.channel PWA,
where signing happens (the device is the second factor). Antidote already carries its own offline
face: the chronicle (`index.html` + `sw.js` + `vault/`), where each visitor's instance is their
own on-device signed, hash-chained log, and `vault/sign.mjs` byte-mirrors anecdote's
`composer/sign.mjs`. The workflows here (`intake.yml`, `heartbeat.yml`) are being **kept as a
declarative definition of the two production gestures** — a configuration input an operator or the
offline origin can read and mirror — not as the presumed runtime. Whether or not GitHub holds the
secrets to run a workflow, the offline origin does.

## Invariants — violate these and you're building the wrong system

1. **Neighbors, not a graph.** Antidote is a position an operator occupies; anyone can stand one
   up, and mirrors are fine. Never an enforced apex.
2. **Verify-from-anyone; trust decides *action*, not *admission*.** Verify every arrival's bytes;
   the declared constitution decides what the vat may become.
3. **Witness, not judge — at the door.** Intake never blocks; the ratchet rule governs what is
   *assembled*, and the raw stays held private, revealed on demand (`bin/reveal`, the pile's
   `bin/prove`).
4. **Sign ≠ decrypt.** The heartbeat signs plaques; the ice lives in a data-pile whose key
   Antidote's callers, not Antidote's readers, control. Keep the ledger key and the reading keys
   separate.
5. **Honest defaults fire nothing.** Unchartered ⇒ the door admits nothing. `_data/lattice.json`,
   `shapes.json`, `downstream.json` ship empty on purpose.
6. **Attest before you run.** The charter (`antidote.yml`) declares the constitution hash before
   any intake behaves differently.
7. **Content-id is the join key.** `vault/sign.mjs` byte-mirrors anecdote's envelope so dedup and
   commitments speak the constellation's one grammar.
8. **No new cryptography without cause.** WebCrypto Ed25519, `age`, `sha256`, hash-chained
   entries. Compose.

## Built here — reuse, don't rebuild

`bin/` verbs (each an executable shim over `X.mjs`, node stdlib only): `judge-constitution`,
`intake-verify`, `punch`, `attest-heartbeat`/`attest`, `reveal`, `egress`, plus the cascade and
multitenancy tools `place`, `decant`, `vat`, `coverage`, `constitution-shape`, `report-cursor`.
`vault/` is the offline chronicle's crypto core (`keep.mjs`, `sign.mjs`, `chronicle.mjs`).
Composite actions: `intake`, `heartbeat`, `egress` (not yet wired to a workflow — pile enumeration
is unspecced), `advance-engine` (the workspace pin-roller). A civic node mounts this repo at
`.antidote-engine/`.

House test style: vendorless, no install — `for t in test/*.test.mjs; do node "$t"; done` (CI:
`test.yml`, node 22). Verify locally; CI is the final gate.
