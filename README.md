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

**Status: design record only.** No service runs from this repo yet. The shape is
serialized in [`ARCHITECTURE.draft-0.md`](ARCHITECTURE.draft-0.md), following the same
draft-zero convention as `civic-node`'s charter drafts: intent fixed in writing before
anything is built, so the position survives a context switch. The real version of any of
it is a content hash.

Antidote is intended to run inside a civic node as an engine submodule, like
`tell.anecdote.channel`, `atlas.anecdote.channel`, and `journal.anecdote.channel` before it.

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
