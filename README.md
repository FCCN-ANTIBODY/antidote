# Antidote

The archivist. Antidote is the service that occupies the "place above" named in
[`civic-node/ANTIDOTE.draft-0.md`](https://github.com/FCCN-ANTIBODY/civic-node/blob/main/ANTIDOTE.draft-0.md)
and recorded in civic-node [#88](https://github.com/FCCN-ANTIBODY/civic-node/issues/88):
a **position, not an operator**. The drop door scatters ballots everywhere; the archive is
where all of it funnels back and is reassembled.

An Atlas's job stays two verbs — accept lost mail, and forward it. Antidote picks up the
burden the Atlas deliberately leaves out: it assembles the piles, dedups by content-id,
shards by respondent, models best-known-jurisdiction, and issues the reports. The Atlas is
the live view; Antidote is the record of account.

**Status: skeleton.** The design is serialized in
[`ARCHITECTURE.draft-0.md`](ARCHITECTURE.draft-0.md) (the draft-zero convention: intent
fixed in writing before anything is built; the real version of any of it is a content
hash), and the verbs it named now exist as seams — node-stdlib-only, the vendorless way,
each importable by its tests:

- **`bin/judge-constitution`** — the gateway: admit / queue / refuse, against the
  constitution this server *declares* in [`antidote.yml`](antidote.yml) (the ratchet rule —
  declared, never computed). The lattice automates ([`_data/lattice.json`](_data/lattice.json)),
  the queue consents (`_data/constitution-queue.json`, human-paced).
- **`bin/intake-verify`** — the door, first half: verify from anyone, dedup by content-id,
  provenance class from the bytes (mesh vs sealed), judge every arrival → `intake.json`.
- **`bin/punch`** — the door, second half: cutouts onto the plaque index (`index/`), a
  hash-linked custody entry onto the ledger (`ledger/manifest.json`, head attested), the
  raw admissions staged to `ice-outbox.json` for the ice pile (an ordinary data-pile — not
  this repo).
- **`bin/attest-heartbeat`** — re-sign the dated receipt over the plaques
  (`heartbeat.json`): per-bucket commitments + coarse log-bands. Retiring is ceasing to
  attest.
- **`bin/reveal`** — the public re-insertion check: a cutout is a hole only the held
  original fits.
- **`bin/egress`** — the teleport's other half ([`docs/teleport.md`](docs/teleport.md)):
  compose one pile's yield into an `antidote.teleport/v1` bundle governed whole by its
  COMMON CONSTITUTION, and record custody OUT in the same append-log grammar the intake
  ledger keeps.

Tests: `for t in test/*.test.mjs; do node "$t"; done` (no install step).

## The engine paradigm

Antidote runs inside a civic node as an engine submodule, like `tell.anecdote.channel`,
`atlas.anecdote.channel`, and `journal.anecdote.channel` before it: the node mounts this
repo at **`.antidote-engine/`** and its workflows reuse the composite actions over the
node's *own* charter and data —

- `uses: ./.antidote-engine/.github/actions/intake` — run the intake door over an inbox
  (the presumed-PR payload), commit the manifest, plaques, ledger, and queue.
- `uses: ./.antidote-engine/.github/actions/heartbeat` — re-sign the receipt on the node's
  own schedule. **The schedule is the retention policy**: while it runs, the archive
  attests "still held, still checked"; stop it, and every copy anyone kept goes visibly
  stale.
- `uses: ./.antidote-engine/.github/actions/egress` — compose a teleport out of one
  Atlas-managed pile's yield. Deliberately unwired to any workflow until the pile
  enumeration is specced (the hypothesis lives in [`docs/teleport.md`](docs/teleport.md)).
- `uses: ./.antidote-engine/.github/actions/advance-engine` — the workspace pin-roller's
  job for this engine, gated on the test suites (the modules-upgrade pattern).

The workflows in this repo (`intake.yml`, `heartbeat.yml`) are the manual-dispatch forms
of the same two gestures, the way the Atlas's drop door started.

As shipped this server is **unchartered** (`antidote.yml` declares no constitution), so
the door admits nothing and honest defaults fire nothing — chartering it, and the first
lattice entries, are deliberate acts recorded in [`constitutions/`](constitutions/README.md).

## The offline origin

The other path ([`docs/offline-origin.md`](docs/offline-origin.md)): `index.html` +
`sw.js` + [`vault/`](vault/) are the **chronicle** — a service-worker offline app in the
anecdote style, where the canonical domain delivers the app and every visitor's instance
is their own. Identity is minted on-device and kept as a non-extractable CryptoKey in
origin-scoped IndexedDB (`vault/keep.mjs` — the user is their own secret vault; no
workflow keys on this path). Every entry is signed *and* hash-chained
(`antidote.chronicle-entry/v1`) so *when* is as provable as *who*; `kind` is an open
namespace (`answer`, `poll`, `witness`, `note`, …) merged into one timeline by the UI.
`vault/sign.mjs` byte-mirrors anecdote's `composer/sign.mjs`, so vault signatures and
content-ids are the constellation's — a chronicle's walk-up bundle admits through the
intake door above unchanged, and the door tells you which of your records were new.

## See also

- civic-node [#88](https://github.com/FCCN-ANTIBODY/civic-node/issues/88) — the aggregation
  "place above": a position, not an operator; the public husk (commit-and-reveal + freshness
  lease).
- civic-node [#91](https://github.com/FCCN-ANTIBODY/civic-node/issues/91) — the Atlas-owned
  hearsay pile; lifecycle Live → quiet → deflate → flush; "flush = a presumed PR."
- [`data-pile/CONTRACT.md`](https://github.com/FCCN-ANTIBODY/data-pile/blob/main/CONTRACT.md)
  — the append-only, hash-linked, encrypted-at-rest log Antidote holds its ice in.
- [`civic-node/NONPROFIT.draft-0.md`](https://github.com/FCCN-ANTIBODY/civic-node/blob/main/NONPROFIT.draft-0.md)
  — the operator's constitution; anti-capture as architecture.
