# The teleport — what the append log looks like when data leaves a pile

How a yield of answers moves from an Atlas-managed data pile into an Antidote archive:
egress (`bin/egress`) on the sending side, integration (`bin/intake-verify` + `bin/punch`)
on the receiving side, one wire shape between them. Register of civic-node **#91**
("deflate/digest to the archive"; "flush = a presumed PR") and ARCHITECTURE.draft-0
("registration and the check-in"). Shape, not settled spec.

## One append log, two custodies

A teleport is not a copy gesture — it is a **custody transfer recorded twice in the same
grammar**:

- **Custody OUT** — `egress/ledger.json` on the sender: hash-linked entries
  (`seq`, `prev_hash`, `this_hash`), head attested by the egress signer. One entry per
  teleport, carrying the bundle's `digest`.
- **Custody IN** — `ledger/manifest.json` on the receiver: the intake ledger the punch
  already keeps. A teleport's entry carries the same `digest`.

The digest is where the two chains meet: `contentId({ seq, prev_digest, commitments })`,
chained so each teleport out of a ledger links to the last. Anyone holding both ledgers
can verify that what left is exactly what arrived — the append log doesn't pause while
the data is in the air. The PR that carries the bundle (the presumed PR, consent by
construction) is the third witness: queue, provenance chain, and consent event are one
object.

## The wire shape — `antidote.teleport/v1`

```json
{
  "schema": "antidote.teleport/v1",
  "from": "<the sending node's id>",
  "pile": "<the pile this yield leaves — one teleport, one pile>",
  "seq": 0,
  "prev_digest": null,
  "at": "<ISO8601>",
  "common_constitution": "<hash — THE COMMON CONSTITUTION governing every record>",
  "commitments": ["sha256:...", "..."],
  "digest": "sha256:...",
  "records": [ { "...": "raw mesh ballots and/or sealed envelopes" } ]
}
```

- `commitments` are the sorted content-ids of `records` — a sealed record carries its own
  (commitment outside, guard #5), a plaintext record's is computed over the canonical
  bytes everyone else computes it over.
- The receiver re-derives every commitment and the digest. A record outside its
  teleport's commitments is nobody's — rejected. A doctored digest refuses the bundle
  whole.
- The records are **raw**: damage is a publication act, never a storage act (guard #1).
  The receiver's punch inflicts the plaque damage; the wire and the ice never carry it.

## THE COMMON CONSTITUTION

Written as a proper noun, all caps, everywhere it appears. **THE COMMON CONSTITUTION is
the Venn-diagram overlap of what all the answers captured by one pile allow — the
composite, greatest-common-denominator constitution that governs them all.** Questions
yield their answers out of the data pile that captured them, and the yield travels under
that one constitution: it is what the teleport bundle wears, and it is what the receiving
gateway judges.

**Deeper constitutions are subordinate.** An answer may attach its own more sophisticated
constitution. THE COMMON CONSTITUTION matters first — always:

- If THE COMMON CONSTITUTION makes **no secondary-use carve-out**, a deeper constitution
  is inert. Recorded, never consulted.
- If it **carves out** that individual answers are available (or classifiable) for
  second-order reporting, a deeper constitution operates **within the limits its author
  originally set** — never beyond what THE COMMON CONSTITUTION opened, and never beyond
  what the author wrote.
- It may even provide that **every answer inside carries a secondary constitution** —
  the carve-out can be total. The precedence does not change.

At the door this is mechanical: a teleport's records are judged against
`common_constitution` (fate reads `constitution_source: "common"`); a worn per-record
constitution lands on the fate and the cutout as `deeper_constitution`, and **never
touches admission**. Enforcement of the carve-out's limits happens where second-order
use happens — report time — which is a later slice (the open questions register).

Loose mail (hand-carried scraps, not a pile's yield) keeps the existing ladder:
worn > bundle > stamped > refuse.

## The envelope is the frame

Ballot properties keep changing, and the esoteric ones have generally included anything
on the envelope. So the plaque stores **the whole envelope with the damaged content
punched out** — the punch is a **denylist, never a whitelist**: every property rides
through verbatim except exactly what the class punches (mesh: the respondent's
credential; sealed: the ciphertext), and the cutout names its own holes
(`punched: ["sig"]` — ownership of the damage, on the face). A property nobody has
invented yet archives correctly today.

## Which piles teleport — a hypothesis, not a spec

Enumeration of "the Atlas-managed data piles" has no spec yet. The working hypothesis,
recorded here so the egress action has something to be pointed at:

- **The #91 hearsay piles**: piles the Atlas owns outright (`pile-new --keygen`,
  Computer posture), stamped `provisioner` = self in `pile.yml` / the Atlas's
  `_data/piles.yml`. These are *transient by intent* — Live → quiet (~30d, no new
  answers) → deflate losslessly → teleport → tear down the mailbox.
- **Not** the fronted piles (#87, `--provisioner --recipient`): those have owners, and
  their yield is the owner's to teleport or not.
- The **interim `archived/` root** of #91 (the workspace-top archive gathering until a
  flush-elsewhere is verified) is the natural staging surface: the egress input is
  whatever the pile's own owner tooling (`bin/decrypt`, `bin/report`) yields there.
- The pile names its COMMON CONSTITUTION at provisioning (or the Atlas stamps its
  default at drop time). A pile with no COMMON CONSTITUTION cannot teleport —
  `bin/egress` refuses: no constitution, no catalog (guard #4).

When the enumeration spec lands (likely `_data/piles.yml` growing a `provisioner` /
`common_constitution` column on the Atlas side), the digest workflow reads it; until
then the egress action takes an explicit yield and the hypothesis stays a hypothesis.

## See also

- ARCHITECTURE.draft-0 — the three layers, the guards, the check-in method.
- civic-node **#91** (deflate; the presumed PR; the hearsay pile lifecycle), **#88**
  (the archivist; the public husk).
- `data-pile/docs/transfer.md` §C (the sendable bundle this wire shape descends from),
  `CONTRACT.md` (the manifest grammar both ledgers speak).
