# The cascade tier — containment distillation, the placement ledger, the runoff tray

How Antidote aggregates: not one merge but a **cascade of servers distilling by shape
containment**. Register of civic-node #94 (the cascade tier), #88 (the place above),
#91 (deflate-to-archive). Shape, not settled spec — the durable in-repo home for the
rules #94 argues.

## Built (v1) — the decisions taken, in words, before the verbs run

The first cut of the machinery below is `bin/place`, `bin/vat`, and `bin/distill`, over a
declared catalog at `_data/shapes.json` and a downstream registry at `_data/downstream.yml`.
The v1 decisions, so nothing is re-derived:

- **The placement signal is the record's own carried `scope` name**, matched against catalog
  shape ids — best-known-finest at *name grain*. A record names no scope, or names one the
  catalog doesn't hold, and it **holds** (default-hold is the machine's literal default: the
  catalog ships empty, so at first everything holds). Point/polygon placement is a later
  refinement of the same join, not a different ledger.
- **The catalog is a declared, content-hash-versioned document** (`antidote.shape-catalog/v1`):
  the nesting spine is single-parent (`within:`), lateral overlap shapes carry `overlaps:` and
  no parent. Its version is `contentId` over the document — adopting a new catalog IS the
  boundary change; nothing in the ledger moves.
- **The refilter trigger is the catalog version**: `bin/place` re-runs the held backlog
  whenever the catalog it sees differs from the one the ledger last saw. A held record names
  what it waits for.
- **Vats never mix licenses in v1.** A vat groups its references **per original constitution**
  — the derivative-COMMON move (distilling into a looser COMMON via carve-out or
  `deeper_constitution` passport) stays behind the counsel gate, unbuilt, exactly as the open
  question below demands. So a v1 vat is the *view* half only: containment descent (plus the
  coarse full-overlap set for a lateral shape), thin references, log-band counts, marked
  derived/evictable.
- **`bin/distill` selects, `bin/egress` sends.** The down-hop composes an egress *yield* —
  records placed within the target shape whose constitution the lattice says the downstream's
  declared COMMON **admits** (`judgeConstitution`, the same gateway as intake). A `queue`
  verdict holds the record and says so — **"deeper overrides a restrictive arrival-COMMON"
  never auto-admits** — and a `refuse` stays home. Delivery remains the presumed PR, and the
  raw released only against receipts (the atlas `bin/retire` idiom, one rung up).

## Aggregation is Antidote's, by containment

The "place above" is a cascade: hyper-specific contract batches enter at the top (from
the Atlases), and each downward hop distills them by the shape hierarchy (city → county
→ state → …) into fewer datasets with new cross-cutting utility. **Only an Antidote
server can determine a COMMON CONSTITUTION** — the greatest-common-denominator
constitution a combined dataset is *allowed* to be — so aggregation lives here, never on
Atlas. Atlas is the live coarse gauge of its own scope and a public discovery + ballot
intake layer; it never rolls up across scopes (it can't — a Fort Collins atlas doesn't
hold the other Larimer cities' data).

**Containment is the distillation axis.** Rolling every city in a county up yields fewer
records *and* a county-wide pattern present in no single city. Two shape relationships:

- **Nesting** (city ⊂ county ⊂ state) — the administrative spine. Clean rollup. The
  strong containment step.
- **Overlap** (a district crossing counties, "mostly not even in our state but covering a
  few of us") — no clean rollup; distills by intersection, hangs laterally off the spine
  as its own shape referencing multiple tree nodes.

Topology: **a containment tree with lateral overlap-shapes attached.**

## The placement ledger — the seed corn

The sort is a **spatial join against a shape catalog**: each record is placed at its
**best-known-finest shape** (weak signal places coarse — "Colorado only"; strong signal
places fine). That placement is the sort key; bucket, count, roll up the tree.

The one invariant that makes boundary changes survivable:

> **Never bake shape-membership into the record. Commit the finest *placement* + the
> record's *original constitution*; join against shapes at query time.**

Two things kept thick and separate, never evicted:

- **The placement ledger** — `(content-id → best-known-finest-shape → original
  constitution)`, at whatever grain each answer permits. The **seed corn.**
- **The shape catalog** — the boundaries, **versioned**, held apart from the data.

Every rolled-up vat is then a **view** — a spatial join of the ledger against the current
catalog. The scaling fears dissolve:

- **Add a shape** → a query ("what constitutions have placements inside this polygon?"),
  materialized as a new vat.
- **A county splits** → the catalog gets a new *version*; stale vats re-join against it.
  Nothing in the base moved — membership was kept at the finest grain, not the county
  grain.
- **Evict vs. copy** → evict derived vats freely (reconstructable from the seed); never
  evict the placement ledger below the tier holding the raw it points to.

## The default-hold boundary — never evict into a hole

The safety valve, and the machine's **default state**: data is not flushed past a
boundary it cannot yet place.

- A record whose finest shape has **no instantiated parent** — a split not yet landed, or
  a shape we don't track — **holds at the boundary** (a backlog/quarantine) instead of
  falling to the bottom, because falling would make it unreconstructable.
- Data that already flowed down **unfiltered** (its shape didn't exist at the time) must
  be **refilterable**: a backlogging process re-runs placement when the catalog gains the
  missing shape.
- Because default-hold is the setup default, an unresolved boundary can be **isolated and
  worked on later** with nothing lost. Conservative bias: when in doubt, hold high where
  the raw still lives.

Pairs with the seed-corn rule: rearrangement capability is a property of your **upstream**
once you've evicted, so a lower vat that must re-distill **PRs upstream**. Downward
registration and upward PR are the same edge, opposite directions — registration creates
the upstream lifeline for free.

## The bottom index — non-lossy where it counts

No master Antidote holds it all. The bottom rung is a **thin index proving references
exist** — and because every reference carries its **original constitution stapled**, the
alignment of every constitution is recomputable bottom-up. "Holds it all" is an *index
claim, not a data claim*: seize it, you get a map, not the territory; anyone with the
pointers rebuilds the map. Reconstructable-from-above, or it's an operator. The
first-order query into any vat returns **the set of COMMON CONSTITUTIONs that compose
it** — followable references you travel up to unpack.

## Commissioned vs. automatic servers

- **Commissioned (marked for sale).** A buyer makes a contract; **their constituency
  shape is reported by them**; that shape *is* the charter of the server we stand up. It
  always filters into the bottom (Colorado). The antidote bottle, with a concrete
  provisioning trigger.
- **Automatic (anticipated).** The few universal ancestors we assemble because they ought
  to exist — **the state of Colorado**, which sits inside every slice and which no one
  else covers. Colorado holds a **non-lossy replica of what filters into it**, because
  recomputing shapes later may find no instantiated parent.

**Guard:** we do not scale into hosting every split and division. Automatic = the few
universal ancestors; everything finer is commissioned, or a view computed on demand.

## The runoff tray — knowing what you didn't ask

When a spontaneous Atlas produces data that **no commissioned constitution asked for**,
it isn't dropped — it sifts down to the **state tray as runoff**, held for future
distillment by a useful asker. So Antidote carries a large **runoff tray of undigested,
unasked-for records** — and that is a feature, the concrete form of an old promise:
**how to listen to what isn't being answered; how to know what you don't know.**

By retaining records, Antidote can answer **questions about what you missed** — and
every record a query can reach carries a constitution **expressly permitting that use**
(consentful by construction; no constitution, no catalog). The intended reader: a public
servant who wants to know *what was even being spoken about before they started paying
attention* — the endemic problem of arriving late to a conversation. Not a surveillance
index (the raw stays on ice, damage is a publication act); a **consented retrospective
search** over data whose authors licensed exactly this.

## Guards

- **Aggregation leaves Atlas.** Only an Antidote determines a COMMON CONSTITUTION.
- **The placement ledger is seed corn** — finest grain, original constitution stapled,
  never evicted below the raw it points to. Everything else is an evictable view.
- **Shapes are convention, not authority** — the shape catalog gets the
  constitution-lattice treatment: content-hash-versioned, lineage-tagged, forkable,
  multiple-may-exist. A boundary change is adopting a signed new catalog version, never
  Antidote redrawing a map.
- **Default-hold** — never evict a record into a boundary that can't place it.
- **The bottom stays reconstructable** — thin pointers + stapled constitutions, rebuildable
  from the tier above, or it's an operator.
- **The runoff is consented** — everything queryable carries a constitution permitting the
  query; the raw stays on ice.

## Open questions

- **The passport at scale — a counsel gate.** Distilling into a looser *derivative*
  COMMON means answers opt in individually via `deeper_constitution`. Build both routes
  (arrival-COMMON carve-out **or** deeper-passport), but "deeper overrides a restrictive
  arrival-COMMON" **queues for counsel, never auto-admits.**
- **Shape-catalog provenance** — who signs a boundary version; how a fork is expressed;
  the pin (locator) vs. the shape-intersect (full overlap set).
- **The Colorado replica's grain** — full raw, or placement-ledger-complete-but-report-thin.
- **The backlog cadence** — when refiltering runs; how a held record signals it's still
  waiting for its parent.
- **Runoff retention limits** — how long unasked-for runoff is held, and the coverage
  index that makes a never-asked constituency a *named* gap, not a silent one.

## See also

- civic-node **#94** (the cascade tier), **#88** (the place above; POSITION not operator),
  **#91** (deflate; flush = presumed PR — the top of this cascade).
- `ARCHITECTURE.draft-0.md` (the three layers; THE COMMON CONSTITUTION; `deeper_constitution`),
  `docs/teleport.md` (the wire shape a downward-registration flush rides),
  `docs/offline-origin.md` (the chronicle — the finest-grain first witness).
- `atlas.anecdote.channel/notes/boundary-canon.md` (structure is a position; shapes are
  conventions).
