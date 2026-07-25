// antidote/provision/ask.mjs — reserve an ASK anchor for a pile, offline-origin side. BYTE-MIRRORS
// data-pile bin/pile-ask.mjs (the constellation's mirror discipline — see provision/pile.mjs, which
// mirrors bin/pile-new.mjs, and vault/sign.mjs). Keep the two in sync by hand so an ask reserved here
// is byte-for-byte the one a data-pile checkout writes.
//
// An ask is the anchor a pile wears when it points at a thing WITHOUT prefab answers — "here is a
// thing; do you need this? citation required" (data-pile/docs/anchored-piles.md; data-pile
// CONTRACT.md "The ask anchor"). Where a poll is an anecdote WITH prefab answers (a solicitation,
// the bottle→Tell handoff), an ask carries an object reference and/or a statement and none. Its
// replies read as citations, not tallied answers. Where provision/pile.mjs MAKES the pile, this
// RESERVES the ask on it — the offline-origin twin of bin/pile-ask.
//
// Pure: no DOM, no network, no git, no fs.

// Build the SHOWN ask anchor. Mirrors bin/pile-ask.mjs field-for-field (order matters: the bytes are
// compared byte-for-byte). `pile` is the stood-up pile's id (provision/pile.mjs filled it); `ask` is a
// slug (a path segment). An ask must point at SOMETHING — a url (the object) or text (the statement).
export function buildAskAnchor({ pile, ask, url = "", kind = "", text = "", guidance = "", round = "1" } = {}) {
  if (!pile) throw new Error("ask: pile is required — stand the pile up first (provision/pile.mjs)");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(ask || "")) throw new Error("ask: ask must be a lowercase slug (it is a path segment)");
  // THE INVARIANT (inverse of the poll's): an ask points at a thing but never prescribes the answer.
  if (!url && !text)
    throw new Error("an ask must point at SOMETHING — give url (the object) or text (the statement). An ask with neither points at nothing.");

  const g = guidance || "Cite this, or add what you can — an open ask: anything abides, nothing is auto-rejected.";
  const to = url ? { kind: kind || "url", url } : null;
  const roundVal = /^[0-9]+$/.test(String(round)) ? Number(round) : round;
  return {
    schema: "data-pile.ask-anchor/v1", pile, ask, shown: true,
    intent: "ask", to, text, guidance: g,
    round: roundVal, qr: null,
    governed_by: `tell:_data/constitutions/${pile}/${ask}.json`,
  };
}

// The exact bytes bin/pile-ask writes as asks/<ask>.json (2-space JSON + trailing newline).
export function askAnchorBytes(anchor) {
  return JSON.stringify(anchor, null, 2) + "\n";
}
