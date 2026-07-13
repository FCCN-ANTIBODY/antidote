// antidote/provision/pile.mjs — the "empty wallet": stand a data-pile's FILE-SET up from the data-pile
// template and a label. Antidote helps a researcher (or the Atlas) MAKE a pile for any purpose; this is the
// composition core that turns the template into a specific pile's ready-to-commit files — the exact tree
// git-enough buildRepo({ files, root: true }) (the King's Leap) turns into the pile repo on the device.
//
// Obtaining the template is a one-time clone, cached; the eventual model is a single canonical artifact every
// pile is a clone of, packaged later. Nothing here reaches for it — the template file-set is passed in.
//
// Pure: no DOM, no network, no git, no fs. fillPile below BYTE-MIRRORS data-pile bin/pile-new.mjs (the
// constellation's mirror discipline — see vault/sign.mjs): keep the two in sync by hand so a pile assembled
// here is byte-for-byte the one a data-pile checkout fills.

// --- vendored: data-pile bin/pile-new.mjs `fillPile` (byte-mirror) ---------------------------------------
// The pure core of the pile's fill. recipient is REQUIRED (minting the age identity is the caller's job —
// async and secret-bearing — so this stays pure and sync). Idempotent: a second fill does not double-stamp.
export function fillPile(pileYaml, { id, scope, recipient, owner = "", name = "", sourceUrl = "", signer = "", provisioner = "" } = {}) {
  const nm = name || id;
  const repoSlug = (owner ? owner + "/" : "") + nm;
  let y = pileYaml;
  y = y.replace(/^id: .*$/m, `id: "${id}"`);
  y = y.replace(/^scope: .*$/m, `scope: "${scope}"`);
  y = y.replace(/^age_recipient: .*$/m, `age_recipient: "${recipient}"`);
  if (repoSlug && owner) y = y.replace(/^repo_url: .*$/m, `repo_url: "https://github.com/${repoSlug}"`);
  if (sourceUrl) y = y.replace(/^ {4}url: .*$/m, `    url: "${sourceUrl}"`);        // first occurrence
  if (signer) y = y.replace(/^ {4}signer: .*$/m, `    signer: "${signer}"`);         // first occurrence
  if (provisioner && !/^provisioner:/m.test(y)) {
    y += `\n# ATTESTATION (CONTRACT.md -> "The provisioner attestation", spec-or-attested): this pile was
# stood up by a provisioner, not hand-built by its owner. Anything talking to a managed pile can
# read who managed it and what they speak. The provisioner held the CREATE credential only --
# never the age identity.
provisioner: "${provisioner}"
provisioner_spec: "data-pile/pile-new/v1"
`;
  }
  return { pileYaml: y, keyPub: recipient + "\n" };
}

// Assemble a pile's ready-to-commit file-set from the data-pile TEMPLATE file-set and the pile's parameters.
// template: [{ path, content }] — a data-pile template checkout (e.g. from a one-time git-enough clone).
// Returns a NEW [{ path, content }] with pile.yml filled and keys/pile.age.pub set to the recipient; every
// other template file passes through untouched. This is exactly what git-enough buildRepo turns into the
// pile repo. Throws if the template carries no pile.yml (it is not a data-pile template). The input is not
// mutated — the caller keeps its pristine template for the next pile (every pile is a clone of the original).
export function assemblePile(template, opts = {}) {
  if (!Array.isArray(template)) throw new Error("provision: template must be an array of { path, content }");
  const files = template.map((f) => ({ path: f.path, content: f.content }));
  const pile = files.find((f) => f.path === "pile.yml");
  if (!pile) throw new Error("provision: template has no pile.yml (not a data-pile template?)");
  const { pileYaml, keyPub } = fillPile(pile.content, opts);
  pile.content = pileYaml;
  const key = files.find((f) => f.path === "keys/pile.age.pub");
  if (key) key.content = keyPub;
  else files.push({ path: "keys/pile.age.pub", content: keyPub });
  return files;
}
