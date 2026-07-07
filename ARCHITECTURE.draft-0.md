# Antidote architecture — the archive, the plaques, and the common constitution (draft 0)

> **Born 2026-07-07, made by FCCN-ANTIBODY.**
>
> **Status: draft zero — intentionally**, the same convention as `civic-node`'s
> `ANTIDOTE.draft-0.md` and `NONPROFIT.draft-0.md`. This serializes intent; shape, not
> settled spec. It is the register of civic-node **#88** (the place above; the public
> husk) and **#91** (the hearsay pile; deflate-to-archive; "flush = a presumed PR"),
> carried one tier down into the repo that will run it. Do not re-derive that context —
> extend it.
>
> Companion to `civic-node/ANTIDOTE.draft-0.md` (the name, the mission, the queue) and
> `NONPROFIT.draft-0.md` (the operator's constitution). The real version is a content
> hash.

## Position recap — the archivist

The Atlas forwards **dumb and fast**: accept lost mail, forward it, model nothing.
Antidote assembles — dedups by content-id, shards by respondent, models
best-known-jurisdiction (its black box, per #88). The two aggregations do not compete:

- **Atlas = the live view.** Standing while the poll lives, coarse tiers for its
  constituency, so the offline clients — who never aggregate for themselves — can see a
  poll breathe. Provisional by design; never quotable as an official count.
- **Antidote = the record of account.** The deduped union across every Atlas that saw the
  ballot, reconciled, attested, current. The canonical figure.

## The moat is freshness, not secrecy

These ballots passed through everyone's hands. Mesh-carried answers were visible,
plaintext-signed, to every carrier; some of those carriers hold pristine copies today, and
no design can un-ring that. So secrecy of individual content **was never the moat**, and
Antidote does not pretend otherwise. What Antidote sells is what only the key-holder with
the heartbeat can issue: the **assembled, deduped, licensed, attested-current whole**.
Scraps are individually gettable; the record of account is not.

This is also the precise claim the deliberate damage makes. The ruin does **not** prove
the content exists nowhere else — it proves **ownership of the redaction** (our signature
over the husk: we did this, on purpose, and no one can forge a fresh one) and **status**
(the dated heartbeat: this is the current, still-held record). The once-ness lives in the
entitlement — only Antidote can sign a fresh report — never in the ruin itself.

## The three layers of archive data

**1. The intake ledger — the append log proper.** A hash-linked, signed-head manifest in
`data-pile`'s `inbox/manifest.json` shape, where each entry records a **custody
transfer**, not content: *received these content-ids from Atlas X at time T, via PR #n.*
The PR queue and the provenance chain are the same object — the PR is the consent event,
the merge is the append.

**2. The plaque index — the public face, forever.** Per question, in plaintext (the
shadow question stays findable — re-publication is the point, per #91):

- the set of **unique answer values** — the buckets;
- the **cutouts** — one file per content-id, filename is the hash, so dedup is arrival
  behavior and concurrent PRs from many Atlases converge without conflict. Each cutout is
  a hole only the held original fits: verification is re-insertion (`bin/prove`). **The
  envelope is the frame**: ballot properties keep changing and growing esoteric corners,
  so a cutout keeps the *whole envelope* verbatim with exactly the damaged fields punched
  out and the holes named on its face (`punched: [...]` — ownership of the damage). The
  punch is a denylist, never a whitelist; a property nobody has invented yet archives
  correctly today;
- **committed bucketing** — a per-bucket commitment (Merkle root over that bucket's
  cutouts) plus a **coarse count band**, never the exact figure on the face. Exact
  membership is revealable on demand. Coarse standing on the plaque; correct-and-real
  underneath, provably;
- the **dated, re-signed receipt** — the heartbeat. Retiring data is **ceasing to
  attest**: stop re-signing, and the stale plaque announces "not current" on its face.
  The heartbeat is a lease, not a grant.

The plaques are the "pointless nothings" — worthless to steal, impossible to alter,
provably ours. The index alone is the report's skeleton: buckets × cutouts is the
log-time histogram, derivable with no key.

**3. The ice — the private hold.** The raw signed ballots, kept as an ordinary encrypted
pile: `pile-new --keygen`, age-wrapped, **no keeper deviations**. Taken off the ice only
to build reports and answer licensed reveals.

> **Invariant — damage is a publication act, never a storage act.** The ruin is inflicted
> on the public copy only. The ice stays pristine, or the reports die.

## The entity datasets — answers are one slice of several

Antidote is not one archive; it is a store that **slices by entity type.** If it holds
answers, it already holds a second sliceable dataset for free: the **questions** — public
polls are durable, sliceable things in their own right. The chronicle (`docs/offline-origin.md`)
already proved this personally with its `kind` namespace (`answer` / `poll` / `witness` /
`note`); the server inherits the same shape as multiple datasets over one grammar.

**A poll is an anecdote pointed at an object.** The object is usually text; text usually
carries multiple-choice options *and* allows custom input; a poll pointed at a non-text
object may carry no options but still offers custom input behind a filled-in guidance
field. The gradient runs from *answerable* (options, or genuine open-with-guidance) down
to **meme-tier** — an *option-less* poll, a statement wearing a question's clothes: you
are not meant to think anything in particular, you are meant to know what to think.

> **Retention guard — meme-tier is discretionary, never owed.** Neither Atlas nor an
> antidote server is **obliged** to archive option-less, meme-tier traffic — the most
> ephemeral kind. Its natural fate is the **share punch** (`docs/offline-origin.md`),
> person-to-person, content kept and collection-identity voided — not the record.
> Archiving it is permitted (it might find strange use); it is simply not owed.

**The punch has an inverse.** The plaque punch keeps the envelope and voids the content
(record-keeping); the **share punch** keeps the content and voids the collection identity
(hearsay) — the anti-replay credential-clip #88 parked, now homed in the offline app.
Together they are the honesty rule generalized: *whoever redistributes, damages, and names
the damage.* Full treatment in `docs/offline-origin.md`.

**A fourth kind — `report`, the public record.** An Atlas's own **free-form aggregation**
(label-based, discretionary, editorial — the ambiguous grouping Atlas was always going to
do, as distinct from the cascade's shape-governed distillation) emits **signed claims about
what it saw** — reports. Antidote can archive these as a `report`-kind dataset through the
same intake grammar: opt-in per charter, the archival twin of the runoff tray (the runoff
holds unasked-for *answers*; the report archive holds publicly-made *claims* — the record of
what was said, when, powering the diff/fracture-tracking of #95). **Archived as a claim,
never distilled as data** (Atlas reports are not license-governed distillate; they never
enter the cascade), and archiving is not publishing (publicity stays the Atlas's choice —
Antidote keeps the record so a fracture is *provable*, not to browse). The seam that keeps
the two aggregations apart is **claim vs. derivative**: Atlas groups-and-claims, Antidote
distills. See `docs/roles.md`.

## Provenance classes — the bytes decide

Two species of answer, and the plaque's face is **inherited from the artifact's own
form**, stamped at intake, never reclassified by policy:

- **Mesh-carried** (direct-drop, floodOnward): plaintext-signed, public-in-transit by
  construction. Plaque gets the readable envelope.
- **Sealed-channel**: encrypted on-device to the pile's committed `age` recipient before
  it touches any public intake (a GitHub issue carries ciphertext plus envelope, nothing
  more). Plaque gets **commitment-only**. The class is self-evident from the bytes —
  nobody can later argue sealed answers were "already public," because they never existed
  publicly.

**Sign-then-encrypt, commitment outside.** The content-id is computed over the canonical
*plaintext* ballot and travels outside the envelope. Hash the ciphertext instead and
dedup dies — the same answer sealed twice yields different bytes.

## Labels — content-blind discovery

The reducer already shapes free text privately on-device; the label is the part that
travels. Labels are **plaintext, coarse, and drawn from a bounded shared vocabulary**
(a freeform rare label in a small constituency deanonymizes as surely as the verbatim
would). Verbatims travel sealed.

Antidote buckets, discovers, and reports **by label, content-blind**. A verbatim surfaces
only as a **licensed reveal event** — receipted, signed, priced — and never alone below a
bucket-size threshold. "Verbatim text, anonymized" is not a thing this design claims;
**licensed selective disclosure** is. Labels are respondent-asserted and therefore
advisory — they route discovery; the constitution governs use. Mislabeling costs
discovery accuracy, never license safety.

Discovery is over buckets and plaques with licensed reveals — **never a person-level
search surface**, however friendly the interface.

## The common constitution — the spine

Every answer **wears its full constitution**: an affirmative attestation of what it may
be used for. Every Antidote server **wears one constitution and selects it at charter** —
declared, fixed, versioned by content hash. The server's constitution is the overlapping
scope its contents must all permit — but it is *chosen*, never computed:

> **The ratchet rule.** A common constitution derived from contents can only shrink —
> every admission narrows the intersection, silently stripping permitted uses from
> everything already held. So the server **declares** its constitution, and the gateway
> asks one question of each arrival: *does this answer's constitution permit at least
> this server's declared scope — yes or no.* Admission never mutates the license of what
> is held. The server wears a constitution; it never computes one.

**Constitution-first sharding.** A report is itself a *use*, so every report must be
licensed under some constitution anyway. Make the constitution the top-level shard and
license compliance becomes a **property of the shard**: any report built inside the
vertical is automatically clean, no per-row filtering, ever. Inside the vertical,
constituency and respondent are interior indexes (#91's shard-by-respondent lives here).
An answer permitting multiple scopes may live in multiple verticals; content-id dedup
makes double-holding harmless, and each holder heartbeats its own copy — positions, not
operators, as ever.

One object does four jobs: **the constitution hash is the shard key, the routing key, the
server's type, and the license.** This is `ANTIDOTE.draft-0.md`'s "the name is the
license," made architectural — a server is knowable by the constitution it wears.

**THE COMMON CONSTITUTION** (a proper noun, all caps wherever it appears): when a
question yields its answers out of the data pile that captured them, the yield travels
under the Venn-diagram overlap of what all those answers allow — the composite,
greatest-common-denominator constitution that governs them all. On a teleport
(`docs/teleport.md`) THE COMMON CONSTITUTION is what the bundle wears and what the
gateway judges, full stop. An answer's own **deeper constitution** rides along
*subordinate*: it is recorded on the fate and the cutout (`deeper_constitution`), and it
can matter later only inside whatever secondary-use carve-out THE COMMON CONSTITUTION
makes — within the limits its author originally wrote, never beyond either. It never
touches admission. Loose mail (scraps, not a pile's yield) keeps the
worn > bundle > stamped ladder.

**The lattice and the queue.** Constitution comparison is not machine-decidable in
general, and a wrong "compatible" verdict is a license violation baked into the archive.
Two existing shapes absorb this:

- converge on a **small lattice of named, hash-addressed standard constitutions** (the
  Creative Commons move), so the gateway judge is usually an identity or known-lattice
  lookup;
- for novel constitutions, the **queue** (`ANTIDOTE.draft-0.md`): nothing proceeds until
  seen and consented to, human-paced. The judge automates the known lattice; the queue
  absorbs everything else. A fuzzy judgment is never the sole gate.

**Where the lattice comes from — the licensing model** (`docs/roles.md`). The originator or
buyer **writes the license they want to name** (free or paid — the gate is *licensed*, not
*paid*); Antidote curates and lists the ones it will broker (Atlas carries them as want-ads,
a market of intent); the recurring ones crystallize into the standard lattice, bottom-up.
The answering client **forces the solicited license only on solicited polls** — everywhere
else you keep a wildcard, including the honest *"not usable for anything"* refusal — so
consent is *provably named at the source* exactly where it must be. And a buyer may
**subscribe, never own**: all-rights-reserved is *incoherent* (you can't reserve rights the
authors never granted), which is both the anti-enclosure line and the foundation of the
per-use entitlement. **The license separates research from surveillance** — the same
amorphous query is spying unlicensed and science licensed — which is what lets the research
surface widen safely, *provided* the individual-disclosure discipline still masks the person
(licensed is not un-redacted).

## The antidote bottle — the demand side

The same architecture runs in reverse as a commissioning instrument. A buyer — a
government, say — has us **prepare an antidote bottle**: a server chartered with the
terms they want, whose common constitution declares a **category** of information. Then
polls can spring up about anything in that category, anywhere in the mesh, and the bottle
fills. Demand states its terms up front and in public; supply arrives by consent, already
licensed for exactly that use.

- **Categories speak label.** The bottle's constitution declares its category in the same
  bounded vocabulary the labels use, so the matcher can route label-tagged answers toward
  bottles, and polls composed in that category are born knowing where their aggregate is
  wanted.
- **The Atlas gains one final discovery function:** reveal **what common constitutions
  are on offer, in what category** — a registry of open bottles, lease-dated like
  everything the Atlas lists. The Atlas still holds no archive; it advertises where
  archives are wanted.

## The offline origin — the chronicle

Everything above is a server some operator runs — the **enterprise path**, where a key is
seated as a workflow secret. The same grammar runs the other way (`docs/offline-origin.md`):
the **offline-origin path**, where the canonical domain delivers a service-worker app and
each visitor's instance is their own — *the user is their own secret vault*, minting a
non-extractable device identity with WebCrypto and keeping a **chronicle**: one person's
signed, hash-chained historical log of answers, polls, and witnessed things, merged into a
single timeline. Sign-then-self-archive makes the chronicle a ballot's *first witness*
("logged right here, right then" — the chain position proves when-ish, beyond what the key
proves); content-id equality makes the walk-up gesture work — offer your records as loose
mail and the intake door tells you which were new. The witness entry is the same shape at
every altitude: a person chronicling what they saw, or an Atlas teeing everything it
handles to its registered archivists.

## Registration and the check-in — work rides with the initiator

Both directions were pitched — Atlas pushes flushes to Antidote; Antidote crawls Atlases
and suggests sheds. The thread closes on the **check-in method**, because it keeps the
work on the party trying to initiate something:

1. **An Atlas registers with an Antidote server** — a signed PR, the same gesture as
   peer-Atlas registration, renewed on the lease idiom. Registration beats one-off PRs in
   either direction: it is the standing relationship the bottle-discovery function
   advertises.
2. **The flush is Atlas-initiated** — the presumed PR of #91, carrying the sendable
   bundle (`data-pile/docs/transfer.md` §C): self-verifying, sealed to Antidote's
   recipient, commitments outside. Specced as `antidote.teleport/v1` — the wire shape,
   the two custody ledgers it binds, and THE COMMON CONSTITUTION it travels under are
   `docs/teleport.md`.
3. **Antidote's shed offer is a response, never a solicitation.** After merge + signed
   receipt, Antidote may open the companion PR back against the Atlas, replacing the
   archived files with a tombstone pointer: *held by Antidote as of T, receipt signed.*
   The Atlas merges or doesn't — no obligation, neighbors not a graph. Dedup makes
   double-holding harmless; the shed is an offered option to stop growing forever, not a
   yank.

Antidote never reaches out first. It is checked in with.

## Wire interference — the two numbers, reconciled in public

Each Atlas counts what it saw; Antidote counts the deduped union. Same poll, different
totals — by design, and the design says so out loud. The vocabulary for the slush of our
data not staying put is **wire interference**, and it is **part of the report**: publish
the **collapse factor** per bucket (sightings per unique ballot). It reconciles the
Atlas-local figures against the canon in public, and it doubles as mesh telemetry — how
far a question traveled is itself something a buyer of civic data wants to know.

## Revocation — the plaque erodes, and the cascade carries it

Answers wear constitutions; nonces are revocable; people change their minds. Antidote
**consumes a revocation feed** — signed claims-about-a-subject, check-fetched, the same
shape as the breach-notice feed — and the heartbeat supplies the mechanism: **cease to
attest that cutout** in the next re-signing. The plaque erodes rather than vanishes.
Reports carry the date-stamp discipline: a sold report was licensed **as of its
signature date**; later revocations shape later reports, never sold ones.

**Revocation is revoke-once, cascade-down — the data-broker asymmetry inverted.** Today you
chase every holder; even a willing void has to travel the gravel. Here the **nonce-holder
signs one revocation** against the content-id and hands it to Antidote *once*; the
**cascade propagates it downward on the heartbeat windows** — each vat carrying the
content-id ceases to attest it on its next re-sign. Not deletion (copies can't be forced
gone — honest); cease-to-attest, and **verifiable** because the revocation is signed by the
same key that signed the original. It is the *same content-id operation* as the verification
API below, run for the opposite reason.

## Antidote as a verification API — the present receipt

By **content-id search**, a constituent can prove *their answer went public, and where* —
the affirmative twin of the enforcement substrate (`ANTIDOTE.draft-0.md`: a *missing*
receipt is the tell of stolen consent; this is the *present* receipt). Because the
constituent holds their own content-ids in their chronicle (`docs/offline-origin.md`), the
query needs no one tracked down. And **the entitlement ledger mirrors it exactly**: every
place a content-id surfaces in a used/sold report is a place its author is owed a share —
verify-where and paid-for-where are one index viewed twice. Antidote holds **entitlements,
not custody**: earmarked claims / vouchers (stuff that, if picked up, is worth something),
never the payor's funds; fingerprint-gated pickup; it tracks who is owed what and transmits
nothing (the #88 payout model — safe in the product because it is a ledger, not a bank).
The full loop of parties this serves is `docs/roles.md`.

## The long-term waiting room — pay me for what you use

Two more things flow in under the same gates:

- **Preemptive offers**: data put out on purpose — *here's my birthday; pay me for what
  you use it for, you tell me.*
- **Matcher orphans**: answers no poll could home, catalogued for the stone to skip
  again, however long that takes.

Downstream use cannot be metered; disclosure can be receipted. So the model is
**pay-per-reveal, priced by the buyer's own signed use-declaration** — and that
declaration is an attestation the buyer now wears. A false or missing declaration is
precisely *the missing receipt that is the tell of stolen consent* — the enforcement case
Antidote exists to pursue. The honor system is not a weakness; it is the trap that makes
the mission self-funding.

> **Invariant — no constitution, no catalog.** Unlicensed data aging in the archive is a
> liability wearing an asset costume. Stamp a default minimal constitution at intake, or
> refuse.

## Guards — the named invariants

1. **Damage is a publication act, never a storage act.** The ice stays pristine.
2. **The ratchet rule.** A server's constitution is declared at charter, hash-versioned,
   never derived from contents; admission never mutates the license of what is held.
3. **Provenance class comes from the bytes.** Plaintext-signed = mesh-carried; sealed =
   sealed. No policy reclassification, ever.
4. **No constitution, no catalog.**
5. **Sign-then-encrypt, commitment outside** — content-id over canonical plaintext, or
   dedup dies.
6. **Labels bounded and coarse; discovery never person-level.** Verbatims move only as
   licensed, receipted reveals, never alone below the bucket threshold.
7. **No keeper deviations on the ice** (#91's line, held).
8. **Atlas standing is never the official count.** Coarse, provisional, live — the
   reconciled canon is Antidote's, and the collapse factor shows the difference in
   public.
9. **The judge is never the sole gate for a novel constitution** — the lattice automates,
   the queue consents.
10. **Antidote never reaches out first.** Registration, flush, reveal, commission — the
    initiator carries the work.
11. **Claim vs. derivative.** Antidote *distills* license-governed answers into datasets;
    it only *archives* Atlas's free-form reports as signed claims. Reports never enter the
    cascade as data.
12. **Entitlement, not custody.** Antidote holds owed-share vouchers, never the payor's
    funds; it tracks and transmits nothing.
13. **Antidote is not for the public watchers.** It serves the constituent (verify + get
    paid), the seeker, and the operator; public looking-in is Atlas's role (`docs/roles.md`).
14. **Licensed, not paid.** The gate is the constitution; payment is orthogonal. A commission
    may be free; the license is authored by the originator/buyer, forced only on solicited
    polls, wildcard otherwise.
15. **Subscribe, never own.** A buyer acquires only the licensed use the authors granted;
    all-rights-reserved is incoherent. And **licensed is not un-redacted** — the license
    grants the purpose; coarse standing and the reveal threshold still mask the individual.

## The cascade tier — aggregation is Antidote's

Everything above archives *one* server's intake. Aggregation *across* servers is a
**cascade of Antidote servers distilling by shape containment** (city → county → state →
…), specced in [`docs/cascade.md`](docs/cascade.md) and civic-node **#94**. The load-bearing
claims, in brief:

- **Aggregation leaves Atlas.** Only an Antidote can determine a COMMON CONSTITUTION (what
  a combined dataset is *allowed* to be), so rollup lives here; Atlas is the live coarse
  gauge, a public discovery layer, and a ballot intake — never a cross-scope aggregator.
- **The placement ledger is the seed corn** — `(content-id → best-known-finest-shape →
  original constitution)`, joined against a *versioned shape catalog* at query time, never
  evicted below the raw it points to. Every rolled-up vat is a reconstructable view;
  boundary changes are re-joins, not migrations.
- **Default-hold** — a record whose shape has no instantiated parent holds at the
  boundary and backlogs rather than evict into a hole.
- **The runoff tray** — unasked-for data is retained (consented, on ice) so a late-arriving
  asker can query *what was being spoken about before they paid attention*: how to know
  what you didn't ask.

## Open questions

- The **plaque's minimum face** — question + commitments + receipt is the floor; what
  else, per provenance class, earns a place in plaintext (timestamps? scope?).
- **The cascade's counsel gate** — the `deeper_constitution` passport at scale
  (`docs/cascade.md`): "deeper overrides a restrictive arrival-COMMON" must queue for
  counsel, never auto-admit; plus shape-catalog provenance and the runoff's retention limits.
- **Sightings as a dataset** — the mesh-ambassador encounter record (content-id + time, no
  full content — a reconstruction log of what circulated, not someone else's antidote): its
  name (`antidote.sighting/v1`? a crunch of `witness`?) and whether it's ever archival or
  stays personal (`docs/offline-origin.md`).
- **The two punches, in code** — `voidPunch` (share: keep content, clip the credential,
  retain the pre-clip `ballotId`) and `crunch` (self-distill: bodies → commitments, spine
  intact) are specced in `docs/offline-origin.md` but not built.
- **Revocation-cascade timing + the verification API shape** — the heartbeat-window cadence
  a revocation rides down the cascade; the content-id search interface (and its access
  gating — a constituent proving nonce-holdership to query their own reach); how the
  entitlement ledger is derived from and stays consistent with revocations
  (`docs/roles.md`).
- **The `report` kind** — the exact shape of an archived Atlas free-form report, and the
  charter flag that opts a server into the public-record role.
- **Opportunistic self-verification — the metadata-authenticity escape hatch.** We deferred
  judging metadata authenticity at every layer (Atlas shovels it downstream unexamined; here
  at the archive we must decide). A background idea (`docs/offline-origin.md`): the
  privileged gesture occasionally *rolls* a verify-attempt on a record; most miss, but a
  **forgery** caught is someone impersonating you (the "identity-theft lottery"), and a
  **real** hit is fresh corroborating secondary metadata — being asked to sign your own
  thing is a reward, not a punishment. Antidote could hand Atlases a list of line-items it
  wants corroborated, disembodied from context. Opportunistic, never a mandatory checkpoint —
  its shape, and how corroboration feeds the metadata-confidence Antidote otherwise treats
  fast-and-loose, are open.
- The **standard-constitution lattice** — the starter set of named, hash-addressed
  constitutions, and where the canonical texts live (`.github`, per the draft-0
  promotion convention?).
- **Bottle commissioning terms** — who may commission, at what price, and the
  anti-capture check: a bottle is a vertical, not an operator; chartering one buys terms
  on offer, never reach into the mesh.
- The **coarse-band schedule** for plaque counts, and the reveal threshold k.
- **Lifecycle interplay with #91** — the Atlas-side inactivity window vs Antidote-side
  intake cadence; whether a registered Atlas flushes on quiet, on schedule, or both.
- The **engine layout** — how this repo becomes `.antidote-engine/` in a civic node, and
  which `bin/` verbs land first (`intake-verify`, `punch`, `attest-heartbeat`,
  `judge-constitution`, `reveal`).
- The **revocation feed's** concrete shape and fetch cadence.

## See also

- civic-node **#88** (the place above; the public husk — commit-and-reveal + freshness
  lease; Antidote-as-archivist), **#91** (the hearsay pile; deflate; flush = a presumed
  PR; sharding by respondent), **#86/#87** (the ballot door; fronted polls), **#94** (the
  cascade tier — containment distillation; `docs/cascade.md` is its in-repo home).
- `civic-node/ANTIDOTE.draft-0.md` (the name is the license; the queue; sheltering, not
  harvesting; the money layer / entitlement model), `NONPROFIT.draft-0.md` (anti-capture as
  architecture), `docs/roles.md` (the full loop — who Antidote serves, and who it doesn't).
- `data-pile/CONTRACT.md` (the encrypted append log; ratchet; `bin/prove`),
  `docs/transfer.md` (the sendable bundle; clear-a-space; librarian layering),
  `docs/lifecycle.md` (Live → Sealed → Disclosed).
- `atlas.anecdote.channel` `bin/drop.mjs` / `bin/custody.mjs` (the drop-archive this
  offloads; content-id as arrival-behavior dedup), `bin/atlas-index.mjs` (the lease
  idiom), `notes/boundary-canon.md` (structure is a position).
- `anecdote.channel` reducer (the labels), `composer/met.mjs` (the receipts that back
  reveals and use-declarations), the CONSTITUTION (no data monitoring — insights come
  from data *entrusted*, never data *passing through*).
