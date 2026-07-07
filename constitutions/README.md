# constitutions/ — the lattice's canonical texts

The known lattice of standard constitutions (ARCHITECTURE.draft-0, "the lattice and the queue").
Each file here is the exact terms of one named constitution; **its identity is the content hash
over those exact bytes** (the draft-0 signed-hash convention), and that hash is what everything
else speaks: the charter's `constitution:` line, the `permits`/`refuses` maps in
`_data/lattice.json`, the `constitution` field a cutout wears, and the queue entries a human
resolves.

The starter set is deliberately empty. Constitutions are terms, and terms get written
deliberately, not scaffolded — the first entries land when the lattice work does (the open
questions register: "the standard-constitution lattice"). Until then every arrival that isn't an
exact hash match queues, human-paced, which is the correct posture for an unchartered server:
**the judge is never the sole gate; the lattice automates, the queue consents** (guard #9).

To add one: commit the text here, compute its hash (`sha256:` over the exact bytes), record what
it permits in `_data/lattice.json`, and — if this server should wear it — set it as
`constitution:` in `antidote.yml`.
