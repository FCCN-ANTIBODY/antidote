# What Antidote is — the full loop of who it serves

The synthesis. Antidote has been given a lot of correct focus on the movement of data
toward **paying seekers**, but that is one of several parties it serves. This is the whole
loop — and, deliberately, who it is **not** for. Register of `ARCHITECTURE.draft-0.md`,
civic-node #88/#94/#95. Shape, not settled spec.

## Antidote is the private back-end; Atlas is the public front

The clean seam: **the public/private split maps exactly onto Atlas/Antidote.**

- **Atlas** is public, discoverable, wide-open — looking at an Atlas installs anecdote;
  anybody can walk up; its contents are first-order queryable, and its residents get the
  extended reach of querying farther away, for convenience. Atlas makes reports; their
  publicity is Atlas's own choice.
- **Antidote** is the back-end that serves the *interested parties* — the constituent, the
  seeker, the operator — with signed, governed, verifiable records. **Antidote is not for
  the public watchers.** That role is Atlas's, and it is already filled.

## The parties Antidote serves

### 1. The constituent — verify, and get paid

The heart. Antidote gives the person who answered **two things**:

- **Verify — a thoroughly signed log that truthfully says whether and where your answers
  are in use.** Antidote is a **verification API**: by content-id search you can prove
  *your answer went public, and where.* This is the affirmative twin of the enforcement
  substrate (`ANTIDOTE.draft-0.md`: a *missing* receipt is the tell of stolen consent) —
  the *present* receipt. Because you hold your own content-ids in your chronicle
  (`docs/offline-origin.md`), you can ask this without tracking anyone down.
- **Get paid — the entitlement ledger mirrors the verification data.** Every place your
  content-id surfaces in a used or sold report is a place you are owed a share. Verify-where
  and paid-for-where are one content-id index viewed twice. Antidote holds **entitlements,
  not custody** (#88's payout model): earmarked claims / **vouchers** — stuff that if picked
  up is worth something — never the payor's funds. Fingerprint-gated pickup; the money stays
  the payor's until redemption; Antidote tracks who is owed what and transmits nothing. That
  is why the payment layer lives in the Antidote product safely — it is a ledger of owed
  shares, not a bank.

### Revocation — the same primitive as verification, run backwards

The data-broker asymmetry is: to purge your answer you must chase every holder, and even a
willing holder's void has to travel the gravel. Antidote dissolves it. The **nonce-holder
signs one revocation** against the content-id, hands it to Antidote **once**, and the
**cascade propagates it downward on the heartbeat windows** — each vat that carried the
content-id **ceases to attest** it on its next re-sign, and the plaque erodes. Not deletion
(copies can never be forced gone — honest about that); **cease-to-attest**, so the answer
goes stale, later reports stop counting it, and the erosion is **verifiable** because the
revocation is signed by the same key that signed the original. Revoke once, at any node; the
cascade is already organized to carry it. Revocation and verification are the **same
content-id operation** — *stop attesting this* vs. *show me where this is attested.*

### 2. The seeker — the distillate

The paying buyer (a government, a commissioner) gets the reconciled, licensed, distilled
datasets the cascade produces (`docs/cascade.md`), governed whole by declared COMMON
CONSTITUTIONs, priced by their own signed use-declaration. The still.

### 3. The operator — we take your archive away

The infrastructure people who run multi-tenant systems and serve as mailboxes are served by
Antidote **taking their archive off their hands** (the #91 deflate/offload; the
community-Wi-Fi backing of #95): a careless or vanishing Atlas owner-operator is still
backed by regular procedure, *if anyone was subscribed* — that traffic was already flowing
to an Antidote. That is what Antidotes are **for**.

### 4. The public watcher — NOT Antidote's party

Explicitly excluded. The public looks in on **Atlas**, which is already public and makes
reports. Antidote keeps signed records for the interested parties; it is not a public
browsing surface.

## The licensing model — who names it, and what it can't be

Antidote is, concretely, **the repository of solicited licenses.** Atlas and the mesh
beneath it service something *public*; Antidote is the *private* side that is allowed to
use the public one's transit — and, because the private side pays, it **funds the public
side's continuation.** Not extraction: the buyer's money keeps alive the commons that
carries the buyer's request.

**The gate is *licensed*, not *paid*.** Admission turns on the constitution, never on
payment (there is no payment check in intake). So a poll can be **commissioned yet free** —
a public candidate vote wants full cross-constituency aggregation and no one paid for it,
but it aggregates the moment it carries a constitution it can pass into. Payment is
orthogonal to admission; it lives in the entitlement ledger, not the door.

**Who writes the license: the originator or the buyer — and the recurring ones become the
lattice.** We finally let the other party do the one thing that was always theirs to do:
**write the license they want to name.** An election's originator, a study's commissioner —
they name outright what the data is for. This resolves the standing question of where the
standard-constitution lattice comes from: **originators and buyers author licenses (free or
paid); Antidote curates and lists the ones it will broker; the public fulfills them; the
recurring ones crystallize into the standard lattice.** Bottom-up, consentful, un-decreed.

**Atlas lists the solicited licenses as want-ads — a market of *intent*, not of data.** This
is Atlas's final discovery function, made concrete and bidirectional: Antidote posts what
buyers want to study; the supply side browses the licenses it would like to *fulfill*. It
inverts surveillance — instead of harvesting everything and hoping, the buyer **publicly
declares the purpose**, and only those who consent to it supply. Antidote lists *according
to its own constitutions*, so a rapacious license never even reaches the square; we
broadcast only demand we are willing to help fulfill.

**Forced on solicited, wildcard everywhere else.** When an Atlas or a Tell makes an ordinary
poll, it does **not** set the constitution the answers must follow — you license your own
answers however you like, including the honest refusal *"not usable for anything, buzz
off"* (someone who answers to make data public but wants none of it aggregated or sold).
The **one** time the answering client forces a specific license is when you pick up a
**solicited** poll: give *that* license, or refrain. So the only compelled licensing is
exactly where it must be, and it guarantees honest licensing on solicited piles **no matter
what** — the rest of the public spaghetti keeps its signatures, but this is where consent
is *provably named at the source*, not merely signed.

**Subscribe, never own — and that is a structural fact, not a policy.** A buyer can only
ever acquire the rights the authors licensed, and the authors granted *use under their
constitution*, never ownership. A buyer demanding **all rights reserved** is trying to
reserve rights that were never on offer to anyone — so it is *incoherent*, not merely
refused: **it doesn't belong to you; you may subscribe.** This is also the foundation of the
payout: because use is subscribed, **every use is a fresh licensed event = a fresh
entitlement** accruing to the authors; ownership-stays-with-author is *why* pay-per-use
works. (The instrument is copyright *plus* contract — thin copyright on expressive
answers/compilations, the constitution-as-license as contract — and its precise
enforceability against relabel/resale is the deferred licensing-enforcement research; a
counsel gate, named so the posture doesn't assume a settled instrument.)

**The license is what separates research from surveillance.** The identical amorphous query
— *who was in this area at that time* — is **spying** with no license and **science** with
one. That single gate is what lets the research surface *widen* safely: a sleep study, a
mobility study, things impossible today because today everyone is treated as an honest agent
(dangerous at digital scale, as the record shows). Here the license makes an otherwise-creepy
query **tappable**, and revocation lets a participant walk out of the reporting they dislike.

> **Guard — licensed is not un-redacted.** The license authorizes the *purpose*; the
> individual-disclosure discipline (coarse standing, the reveal threshold *k*,
> aggregate-not-individual) still protects the *person*. A licensed amorphous query must
> never become the de-anonymizer — the purpose is granted, the individual is still masked.

## The two aggregations — claim vs. derivative

We moved *one* aggregation to Antidote and left *one* on Atlas, and the distinction is the
whole reason the split is clean:

- **Antidote's aggregation is containment distillation** — shape-based,
  COMMON-CONSTITUTION-governed, a **licensed derivative dataset** (`docs/cascade.md`). Only
  Antidote can do it, because only Antidote can determine a COMMON CONSTITUTION. The still.
- **Atlas's aggregation is the ambiguous, free-form one we always knew it would have to do**
  — label-based, shapeless (or shape-as-mask), discretionary, editorial. It produces not a
  licensed dataset but a **signed claim about what it saw** — a report. That is discovery,
  not distillation.

**Claim vs. derivative** is the seam. Atlas *groups-and-claims*; Antidote *distills*.

## Slotting the Atlas report artifacts

Should Antidote accept the report artifacts an Atlas emits? **Yes — as the fourth entity
kind, and firmly on the claim side.** An Atlas report is a signed artifact with a content-id
and a constitution, so it enters through the **same intake grammar** as anything else — no
new machinery, a **`report` kind**, not a subsystem. But it is a **distinct, opt-in,
public-record role**, the archival twin of the runoff tray:

- the runoff holds unasked-for **answers** for a future asker;
- the report archive holds publicly-made **claims** as the record of *what was said, when* —
  which is exactly what powers the **diff / fracture-tracking** #95 promised ("there are
  diffs for you to interpret… to see what fractures happened").

Two guards keep it honest:

- **Archived as a claim, never distilled as data.** Atlas reports are free-form and not
  license-governed distillate; they are held as the signed record of a claim, and **never
  fed into the cascade** as answer data. One rigor, one editorial — kept apart.
- **Not a public browsing surface.** Archiving the report does not make Antidote publish it;
  publicity stays the Atlas's own choice. Antidote keeps the signed record so a fracture is
  **provable** later. "Antidote is not for the public watchers" holds.

Whether a given server accepts reports at all is its **charter's** business — like whether
it is commissioned or automatic. The public-service archive is a role Antidote *can* fill,
not one it is owed.

## See also

- `ARCHITECTURE.draft-0.md` (the three layers; the entity datasets; revocation; the payout /
  entitlement model), `docs/cascade.md` (the distillate; the runoff tray),
  `docs/offline-origin.md` (the chronicle — where a constituent holds their own content-ids;
  the two punches).
- civic-node **#88** (the place above; the payout = entitlement-not-custody model),
  **#94** (the cascade tier), **#95** (Atlas, crystallized — the free-form aggregation and
  the reports that stay Atlas's), `ANTIDOTE.draft-0.md` (met-receipts; the missing-receipt
  enforcement this verification API is the affirmative twin of).
