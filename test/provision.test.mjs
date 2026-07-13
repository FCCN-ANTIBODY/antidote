// Unit: provision/pile.mjs — the "empty wallet". fillPile byte-mirrors data-pile bin/pile-new.mjs, and
// assemblePile turns the data-pile template file-set + a label into a pile's ready-to-commit files (the tree
// git-enough buildRepo makes into the pile repo). Run: node test/provision.test.mjs
import { fillPile, assemblePile } from "../provision/pile.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

const RECIP = "age1586sf5fgqv0cxt2xgyyl4p2s6f7x4eaneg28rhkpaj4sm8e5x92qtqwy8l";
// A minimal data-pile pile.yml template — exactly the fields fillPile edits (id, scope, sources[0].url/signer,
// age_recipient, repo_url).
const TEMPLATE_YAML =
  'id: ""\nscope: ""\nsources:\n  - name: tell\n    url: ""\n    branch: feed/tell\n    signer: ""\nage_recipient: ""\nrepo_url: ""\n';

// 1. fillPile (the mirror) sets each field and stamps the attestation.
{
  const { pileYaml, keyPub } = fillPile(TEMPLATE_YAML, {
    id: "cd04-q1", scope: "colorado", recipient: RECIP, owner: "acme", name: "tank",
    sourceUrl: "https://tell.anecdote.channel/piles/cd04-q1/feed/", signer: "SHA256:abc", provisioner: "acme/host",
  });
  ok(/^id: "cd04-q1"$/m.test(pileYaml), "id set");
  ok(/^scope: "colorado"$/m.test(pileYaml), "scope set");
  ok(new RegExp('^age_recipient: "' + RECIP + '"$', "m").test(pileYaml), "recipient set");
  ok(/^repo_url: "https:\/\/github\.com\/acme\/tank"$/m.test(pileYaml), "repo_url set from owner/name");
  ok(/^    url: "https:\/\/tell\.anecdote\.channel\/piles\/cd04-q1\/feed\/"$/m.test(pileYaml), "sources[0].url set");
  ok(/^    signer: "SHA256:abc"$/m.test(pileYaml), "sources[0].signer set");
  ok(/^provisioner: "acme\/host"$/m.test(pileYaml) && /^provisioner_spec: "data-pile\/pile-new\/v1"$/m.test(pileYaml), "attestation stamped");
  ok(keyPub === RECIP + "\n", "keys/pile.age.pub is the recipient");
}

// 2. Idempotent: a second fill does not double-stamp the attestation (the on-disk fill's invariant).
{
  const once = fillPile(TEMPLATE_YAML, { id: "p", scope: "s", recipient: RECIP, provisioner: "acme/host" }).pileYaml;
  const twice = fillPile(once, { id: "p", scope: "s", recipient: RECIP, provisioner: "acme/host" }).pileYaml;
  ok((twice.match(/^provisioner:/gm) || []).length === 1, "attestation not double-stamped on re-fill");
}

// 3. assemblePile: pile.yml filled, keys added, every other template file passes through untouched, and the
//    input template is not mutated (so the pristine clone survives for the next pile).
{
  const template = [
    { path: "pile.yml", content: TEMPLATE_YAML },
    { path: "README.md", content: "# data-pile\n" },
    { path: "CONSTITUTION.md", content: "the whole law\n" },
  ];
  const files = assemblePile(template, { id: "fc-q2", scope: "colorado", recipient: RECIP });
  const byPath = Object.fromEntries(files.map((f) => [f.path, f.content]));
  ok(/^id: "fc-q2"$/m.test(byPath["pile.yml"]), "assembled pile.yml is filled");
  ok(byPath["keys/pile.age.pub"] === RECIP + "\n", "assembled keys/pile.age.pub added");
  ok(byPath["README.md"] === "# data-pile\n" && byPath["CONSTITUTION.md"] === "the whole law\n", "other template files pass through untouched");
  ok(template[0].content === TEMPLATE_YAML, "input template not mutated (assemble returns a new set)");
}

// 4. an existing keys/pile.age.pub in the template is REPLACED, not duplicated.
{
  const template = [{ path: "pile.yml", content: TEMPLATE_YAML }, { path: "keys/pile.age.pub", content: "age1old\n" }];
  const files = assemblePile(template, { id: "p", scope: "s", recipient: RECIP });
  ok(files.filter((f) => f.path === "keys/pile.age.pub").length === 1, "keys not duplicated");
  ok(files.find((f) => f.path === "keys/pile.age.pub").content === RECIP + "\n", "keys replaced with the recipient");
}

// 5. a template with no pile.yml is refused — it is not a data-pile template.
{
  let threw = false;
  try { assemblePile([{ path: "README.md", content: "x" }], { id: "p", scope: "s", recipient: RECIP }); } catch { threw = true; }
  ok(threw, "template without pile.yml is refused");
}

console.log(fails ? `\nFAILED (${fails})` : "\nok: provision — fillPile mirrors data-pile; assemblePile builds the pile file-set");
process.exit(fails ? 1 : 0);
