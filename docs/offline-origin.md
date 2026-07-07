# The offline origin — the chronicle, and the two paths

How Antidote runs when the operator is one person and the infrastructure is one device.
Register of the session that carved this out; shape, not settled spec. The code is
`index.html` + `sw.js` + `vault/*.mjs`; the proof it's one system is
`test/chronicle.test.mjs` §5.

## Two paths, one grammar

Every place this repo needs a key names which world it lives in:

- **The enterprise path** — a server chartered by an operator: workflow secrets
  (`ANTIDOTE_LEDGER_KEY`), composite actions, custody declared in a `custody.yml`, PRs as
  the consent queue. Someone seats the key.
- **The offline-origin path** — *the user is their own secret vault*: the identity is
  minted on-device with WebCrypto (`vault/keep.mjs`), kept as a **non-extractable
  CryptoKey in origin-scoped IndexedDB**, never serialized, never leaving. Nobody seats
  the key; nobody else ever holds it. Losing the device is losing the key — re-minting
  and nonce revocation are the recovery story, not escrow.

Same signature grammar, opposite custody. `vault/sign.mjs` byte-mirrors anecdote's
`composer/sign.mjs` (as `bin/attest.mjs` already does), so an identity minted here is the
same kind of thing as an identity minted in the anecdote app — same
`key:sha256:<hex>` fingerprint, same canonical bytes, same verify. **Identity is shared
by construction**; sharing a *specific* key across origins is a deliberate export
gesture (the met/meet idiom), never ambient. Note for the record: this vault is the
constellation's first *shipped* implementation of the non-extractable-key posture that
`composer/sign.mjs` documented and every prior caller left ephemeral.

## The canonical domain delivers the instance

There will be a canonical antidote website — its name is undecided (its own TLD, or
`antidote.anecdote.channel`), and the shell deliberately doesn't care: every path in
`sw.js` and `index.html` is relative, so the app serves from any mount. What the
canonical domain distributes is the *app*; what each visitor runs is *their own
instance* — the JavaScript delivery is the instance, one per person, data never
returning upstream. (This is also the seam where the brand question lives: the domain is
the occupant's; the app it hands you is the position's. Tell's `sealed-credential.md`
already walks this line — the cached canonical shell "holds no secrets, by the
dumb-shell/bind-the-queen rule.")

The shell ships in the Floor's posture (smallest job: precache, cache-first, collapse
navigations). Before the vault carries real weight it should adopt anecdote's grown form
— the firmware pin (`firmware.json`, trust-on-first-contact signer, same-key-only
upgrades) and gesture-gated key use — because this origin *does* hold a key.
Bind-the-queen is the named next step, not a solved one.

## The chronicle — one person's record of account

The personal archive is **an individual's historical log**: a single-instance database,
no sharding, no redundancy tiers, no fancy infrastructure. *We are expecting to hold it
all.*

- **Entries are signed AND chained** (`antidote.chronicle-entry/v1`): `seq` + `prev`
  (the content-id of the previous signed entry — the same hash a `ballotId` is) + `at` +
  `kind` + `body`, attested by the holder's key. The signature proves *who*; the chain
  position proves *when-ish* — an entry hash-linked between yesterday's and tomorrow's is
  very hard to backdate.
- **Sign-then-self-archive, one gesture.** The moment a ballot is signed, it lands in
  the chronicle as an `answer` entry — so your own archive is **the first witness the
  ballot ever had**: an artifact beyond the key that you really did log it right here,
  right then. If the ballot later travels the mesh, your chronicle predates every
  sighting.
- **`kind` is an open namespace.** Named conventions — `answer` (the signed ballot,
  whole), `poll` (a question you made), `witness` (an external thing you saw), `note` —
  but nothing rejects an unknown kind. The index doesn't need to be immediately
  browsable; new entity types just start appearing and the timeline carries them.
- **The timeline is the UI's business.** Storage stays chain-ordered (the order it was
  lived); presentation shuffles every kind together into one merged timeline
  (`timeline()` — newest first, ties broken by chain order). One person's answers, polls,
  and witnessed things read as a single chronological life.
- **Witness is one shape at every altitude.** A personal witness entry names an external
  thing by content-id (keeping the thing itself is the holder's choice — a vault is
  storage; damage is a publication act). An Atlas teeing everything it handles to its
  registered antidote servers would emit the *same* shape under its own signature — "I
  saw this content-id at time T, signed," whoever the I is. That tee is also where wire
  interference stops being inferred and becomes signed, first-class data.
- **The head is the personal ledger head** (`antidote.chronicle-head/v1`): the spine's
  tip — `self`, `seq`, a digest over the ordered entry ids — attested and dated.
  Re-attest it and it's a heartbeat; show it and you've proven your log's spine without
  showing its contents. Same grammar as every server ledger head in this repo.

## Walk up and offer

Because content-ids agree byte-for-byte across the vault and the servers, any individual
can walk up to an antidote server and offer their records — `exportLooseMail()` emits
exactly the loose-mail bundle shape the intake door already accepts — **and the door
tells them which ones were new**: existing cutouts punch as no-ops, fresh ones punch,
and the fate manifest + ledger entry are the walker's receipt, naming their
contribution. (`bin/reveal` is the polite pre-check: "do you already hold this?" — with
no obligation to hand anything over.) Nobody designed this feature; it fell out of
arrival-behavior dedup, which is how you know the grammar is right.

Whether a chronicle should also *teleport* wholesale (answers with their nonces, under
what COMMON CONSTITUTION a single person's mixed log even travels) is deliberately
unresolved — the namespace supports it (`docs/teleport.md`'s bundle carries any records;
a chronicle is records), and the carve-out is the point: the possibility is held open,
not specced.

## The chronicle answers metadata predicates — on-device, result-only

A solicited poll may require you to *prove* metadata to qualify (`docs/roles.md`, the
evidence gate) — and the chronicle is where those predicates are answered. Point-in-time
predicates bisect once; **temporal predicates backtrace the chain** — "resident 5+ years"
walks back through the placement entries, and because the log is hash-linked and
time-ordered, the when-ish is provable. It runs **on-device** — only the predicate *result*
leaves, never the entries — the same attestation-over-disclosure the whole vault keeps. The
honest bound: **you attest what the log supports** (a gap is a can't-attest, never a false
yes), and the log's completeness/corroboration is the attestation's strength. This is why
keeping a chronicle is *retroactively valuable*: it is your evidence for studies not yet
written. *(New capability; shape open — `ARCHITECTURE.draft-0.md`.)*

## The two punches — the server's and the sharer's

The punch has an inverse, and the offline app is where it lives. They are the same
gesture run in opposite directions, and each keeps exactly what the other drops:

- **The server punch** (`bin/punch`, the plaque) keeps the **envelope** and voids the
  **content** — the respondent's credential is removed, the frame is kept, damage is a
  publication act, the ice keeps the whole. *Prove it's real; hide what it said.* For
  record-keeping.
- **The share punch** (offline, person-to-person) keeps the **content** and voids the
  **collection identity** — you redistribute the words, but the circulating copy carries a
  **voided signature** (the valid one punched out and kept by you), so it can never be
  re-turned-in as a fresh ballot or re-aggregated as evidence. *Say the thing; disclaim it
  as evidence.* For hearsay.

The symmetry is the honesty rule generalized: **whoever redistributes, damages, and names
the damage.** The server names its redaction (`punched: [...]`); the sharer names its void.
Unsigned, un-punched redistribution is the dishonest path either way.

This **activates the anti-replay credential-clip parked on #88** (the husk comment: "punch
the sig/tok so a ballot can't be replayed live… a separate anti-replay tool for another
day; keep the pre-clip `ballotId` as the dedup key so duplicates still collapse"). #88
named two opposite punches — redact-content-keep-commitment (the husk) and
keep-content-void-credential (the clip) — and shelved the second; it is the share punch.
Its inherited rule stands: **keep the pre-clip `ballotId`** so a shared meme still collapses
against its origin if it ever meets one.

**Why this is the right home for meme-tier traffic.** A poll is an anecdote pointed at an
object; an *option-less* one is a statement wearing a question's clothes ("you're not
supposed to think anything in particular — you're supposed to know what to think"). It is
the most ephemeral traffic, and neither Atlas nor an antidote server is **obliged** to
archive it. Its natural fate is exactly this: **you**, on your own phone, do the damaging
step and share it as the cheapest hearsay — content kept, collection identity voided. The
evidence path (answerable polls) flows to the archive; the meme path flows person-to-person
through the share punch. (Nothing forbids archiving an option-less response — it might find
strange use — it simply isn't owed to the record.)

## Crunch to evidence — self-distillation on your own schedule

The offline antidote is the **historical log the user's own tools flush to**, and it
distills the same way the servers do — except **you** decide when. A **crunch** replaces
entry bodies with their commitments: the hash-chain and the head stay intact and
verifiable (the spine still proves the sequence and the when-ish), but the content is gone
— *a log, but no more content.* It is the personal twin of the archive-and-reset gesture,
and of "damage is a publication act": you keep proof you held it, you shed the weight, on
your own preference and cadence. What you crunch, you can still prove happened; you just
can't show what it said.

## Open questions

- **The name** — the canonical domain (TLD vs `antidote.anecdote.channel`), and the
  brand-vs-position note it feeds (`ANTIDOTE.draft-0.md`).
- **Bind the queen here** — adopt the firmware pin + gesture-gated signing
  (anecdote `gesture.mjs`) before the vault matters.
- **Chronicle teleport** — the COMMON CONSTITUTION of a personal log, if any; nonces on
  the wire; whether `answer` entries flush with their surrounding chain context or bare.
- **Storage growth** — the log rides one IDB key today (personal scale); per-entry rows
  and the archive-and-reset gesture when a chronicle gets long.
- **The destruct gesture** — anecdote's `destruct.html` spares the trove; the vault
  needs the same escape hatch with the same two-keys separation (shred the identity,
  spare the chronicle, or both).
- **Sightings — where do they belong?** *(the memo's open question, given a home here)*
  A mesh ambassador socializes things found on an Atlas. Do those belong in an antidote at
  all? The likely shape is **not** "someone else's antidote" but a thin **encounter record**
  — `witness`-kind, content-id + time, *no full content* — an after-the-fact
  **reconstruction log of sightings** you could turn in that way. It's the boundary case of
  "when does circulating become archival," and it wants a name (an `antidote.sighting/v1`?
  a crunch mode of `witness`?) before it's specced. Held open, with a home.
- **The share punch, in code** — `voidPunch` (keep content, clip the credential, retain the
  pre-clip `ballotId`) and `crunch` (bodies → commitments, spine intact) are named here but
  not yet built; the vault is their home when they land.
- **Opportunistic self-verification (the identity-theft lottery).** One of the things the
  privileged gesture *rolls* could be a **verify-attempt on a random record** — Antidote may
  even hand out a list of line-items it wants corroborated. Most rolls miss; but a **forgery**
  hit means someone is failing to impersonate you (a security signal you get for free by
  always trying to verify yourself), and a **real** hit is fresh corroborating metadata — and
  being asked to sign your own thing is a reward, not a punishment. It's the archive's escape
  hatch for the metadata-authenticity it otherwise treats fast-and-loose (`ARCHITECTURE.draft-0.md`
  open questions). Opportunistic, never a mandatory checkpoint; not the thing you come here to
  find out. Shape TBD.

## See also

- `ARCHITECTURE.draft-0.md` (the three layers; the guards), `docs/teleport.md` (the wire
  shape a chronicle could someday ride).
- anecdote `composer/sign.mjs` (the mirrored core), `composer/consent.mjs` (trove +
  revocable nonces), `docs/origin.md` (Elevated context vs powerless chamber),
  `docs/archive-browser.md` (the on-ice viewer this app will want for `witness` bodies).
- tell `docs/sealed-credential.md` (the cached canonical shell; possession + presence),
  `floor/` (the SW posture this shell starts in).
