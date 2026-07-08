# The three faces of Antidote — the storefront, the vocabulary, and the inverse of Tell

Serializes the operator's charter-session brief so a cold context can pick it up; **shape, not
settled spec** (the register of civic-node #95/#97). The durable plan for Antidote's public
surface: what the canonical page is, who lands on it, what each face lets them do, and the words
we use for what's inside. Couples: `docs/roles.md` (the seam with Atlas), `docs/cascade.md` (the
tiers this storefront sells from), `docs/offline-origin.md` (the chronicle this page already is),
civic-node **#98** (the need-ballot — the ask side), anecdote.channel **#93** (the Floor — the
iframe grammar this reuses).

## One product, three faces

The canonical domain serves ONE page-app (sw.js-managed, instanced per visitor, identity minted
on-device — the offline-origin posture everything here already has), wearing three faces:

1. **The chronicle** *(built — `index.html`)*: your singleton personal archive. One big append
   log of what you personally digested, turn-in-able at any time. If someone runs theirs with
   structure or redundancy behind it, that's their black box — the base case is one log, one
   person, one instance.
2. **The bottle-maker** *(this slice — `bottle.html`)*: the research entry. You come here to
   CARVE THE CAVITY: write the terms — the constitution — and in this system a bottle has a
   *propensity to attract the data you name*. You went to the potion shop and wrote down what
   you want; if such data exists (and people were willing), it comes down off the shelf.
3. **The shelf** *(later — needs the advertising surface #95 names)*: browse what exists —
   constitutions as the label board applied to law; studies public and semi-private; the silt
   around the named bottles (the runoff/coverage index, `bin/coverage`, whose NAMED holes are
   literally this face's "studies that could rise" suggestions); estimates of how much data a
   given set of terms would attract (archive back-catalog vs new-answers-only, date ranges,
   quotas). The professional designs their whole universe HERE, offline-capable, and only then
   contacts us for a company account — payment follows design, never gates it.

## The keystone rule — Antidote is the inverse of Tell

- **anecdote**: question optional, constitution optional — say anything, unsolicited.
- **Tell**: question REQUIRED, constitution optional — the poll builder.
- **Antidote**: constitution REQUIRED, questions optional — the universe builder.

"Questions optional" carries two distinct meanings the UI must keep visually separate:

- **Building to be filled** — the primary use: you are not asking anything yet; you are naming
  terms so existing and future data can flow to you. Questions you add here are *suggestions* —
  seeds for polls anyone may run under your constitution — and the space stays open.
- **Limiting the space** — the deliberate variant: weave the question list INTO the terms text
  itself, so it sits inside the hash. Then a judge comparing constitutions has a literal list to
  check against ("there's clearly a list of questions here — no, this one doesn't work"). The
  lock is bytes, not UI state.

And the other direction — *running a poll under it* — is not this page's job at all: it hands
off. **Antidote iframes Tell (forcing the constitution field), Tell iframes anecdote (identity +
signing)** — the exact inversion of the everyday chain, same probe-line/consent grammar, same
on-device identity, same product wearing a different front door. A sponsored poll is one
question at a time under the study's constitution: slow-roll five a week, change them freely —
it is all the same study, because the study IS the constitution.

## The vocabulary — one good word, the rest colloquial

Words oriented to the COMPOSITION of what's inside, so nobody is confused about what a container
holds:

- **extract** — the first tier: field-acquired records in their chaotic, structure-rich state,
  each still wearing its own constitution — the mix that will lose exactly that structure the
  first time it is synthesized. The bottle's terms carve the cavity; the extract is what flows
  in when it matches, seemingly by magic from the maker's point of view.
- **vat** — kept (it is already `antidote.vat/v1`): the industrial scale is true of our flow,
  but a vat is NOT homogeneous — **it separates at rest**. Its layers are the per-constitution
  groups the code already builds (`composed_of`): always separable, always inspectable. You can
  ask any vat what it contains and get the honest layering back.
- **settle** — the slow work between them, and the honest word for it: nothing is transformed,
  the parts just find their layers, given time. Two layers that settle *into one* were the same
  liquid all along — which is exactly what a lattice `permits` entry asserts: miscibility that
  was always true, discovered slowly, never manufactured. Settling stops precisely at the
  counsel gate — forcing two unlike layers to mix is an emulsion, and somebody has to
  deliberately shake the vat; that somebody is never the machine. Time is on our side — we
  inverted the real-time dogma everywhere else (limited frame rates, chosen staleness,
  stale-and-forwarded caches), and this is the same inversion: you categorically cannot rush
  settling; letting the vat sit IS the process. Operationally: the ONE batchable
  GitHub-workflow job (the enterprise half), never a hosted worker; honest default off.
- **decant** — the down-hop (`bin/decant`): pour a settled layer off into the next vessel
  *without disturbing the rest*. It selects the layers the rung's declared COMMON admits
  (`judgeConstitution`, the same gateway as the door), pours them toward it, and leaves
  everything else sitting — it never concentrates and never merges, which is why "distill"
  was the wrong word: nothing here transforms; it separates and pours.
- Colloquial, welcome, never schema: **bottle** (a commissioned charter — even a free one),
  **tincture**, **silt** (what piles up around the named bottles — formally the runoff, indexed
  by the coverage holes), **field-acquired vs synthesized** (the two ends of the flow).
- Retired from schema use: "distill"/"ferment". Distillation concentrates and fermenting
  produces something new — both promise a transformation the counsel gate exists to forbid.
  "Containment distillation" survives in the design record only as #94's historical register;
  the flow reads **extract → settle → decant**, end to end.

## The positioning — what the storefront must feel like

The professional landing here has been trained by the incumbent (the consultant toll-gate: pay
thousands to be told which questions to ask, design empty report templates, then beg for QR
scans while the vendor brokers respondent data in the back). This storefront inverts every beat,
and the copy should read like it knows that world:

- **You design the universe, not the questionnaire.** The closest thing to survey design here is
  writing the constitution — the shape of what you want. The questions can come later, one at a
  time, forever, and they're all the same study.
- **The data may already exist.** The archive holds answers whose terms permit reuse; naming
  compatible terms is buying off the shelf. Estimates and date ranges up front; commission
  new-answers-only if you already bought the back catalog; quotas if you want them. Turnkey, and
  you know what you'll spend before you talk to anyone.
- **Everyone inside gets paid.** Entitlement, not custody (civic-node #97/#88): royalties per
  reuse, rates set by what the market actually pays — never aspirational, never promised here.
  A respondent can know their own reach: which answers carried, which cohorts they sat in, what
  their government paid them for their input. If you're the one in charge of your data, now they
  pay you.
- **Indexable questions over time are real** (the one true thing the incumbent sells) — and they
  fall out of content-ids + constitutions-per-answer here, without making anyone ask borrowed
  questions.
- **Ecosystem-builders welcome.** Someone may write a constitution purely to carve a licensed
  discussion space — never running a poll themselves, or running plenty. Both are first-class:
  the constitution-to-poll attachment runs from the OUTSIDE (terms first, polls under them), and
  anyone else may start a poll under a published constitution too. What Antidote advertises —
  the bottles on offer, the standing of the studies — is the socialization surface #95 names;
  unbuilt, tracked there.

## The onboarding demo this must prove

A city employee who heard "polling tool" lands on the canonical domain, gets the offline app,
and has an EMPTY archive. From that position the page must make the two live moves obvious:
**make a bottle** (name terms; maybe seed questions) or **browse the shelf** (what studies
exist; what the silt suggests could exist). They design first — possibly entirely offline, off a
cached snapshot — see an estimate, and only then contact us for the company account. Payment is
the last step, and by then they already know exactly what they're buying.

## Execution slices

1. **This document + `bottle.html`** *(this PR)* — the hash ceremony page: terms in, exact-bytes
   `sha256:` live (the bottle's NAME), byte count, optional questions with the
   suggest-vs-weave-into-the-bytes toggle, the what-happens-next narration (constitutions/ file,
   charter vs commission, lattice, counsel queue), a download of the exact bytes. No network, no
   new identity machinery — WebCrypto digest only.
2. `index.html` grows the three-door strip (chronicle · bottle · shelf) — light touch.
3. The shelf: needs the advertising/socialization surface (#95) — seeds exist (coverage.json,
   the heartbeat, the plaque index); estimates need an archive query in bands.
4. The handoff: Antidote-iframes-Tell with the constitution field forced (couples the Floor,
   anecdote#93, and Tell's embed params).
5. The fill-vs-limit judge semantics: how a woven question list is annotated in the lattice so
   `judgeConstitution` comparisons can use it (couples the labeling commons, civic-node#80).
