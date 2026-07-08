// Unit: bin/constitution-shape.mjs — READING a constitution's fill/limit shape from its EXACT bytes,
// and the advisory it lends a QUEUED entry. It is never a verdict: it emits no admit/refuse, and an
// un-annotated lattice yields a null opinion (the queue reads exactly as before). Run: node test/constitution-shape.test.mjs
import { classifyConstitution, shapeOpinion, WOVEN_MARKER } from "../bin/constitution-shape.mjs";

let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL: " + m); fails++; } else console.log("  ok: " + m); };

// 1. Open by default: prose with no woven marker is "open" — the honest absence of a closed set,
//    NOT a claim of compatibility.
{
  const open = "Answers may be aggregated into public tallies.\nThey may never be sold.\n";
  const c = classifyConstitution(open);
  ok(c.shape === "open" && c.questions.length === 0, "no marker -> open, no questions");
}

// 2. Byte-for-byte parity with what bottle.html welds in. If this marker ever drifts, a limiting
//    bottle silently reads as open — so we build the block the SAME way the page does and read it back.
{
  const questions = ["Cut or keep the dog park?", "Fund the pool?"];
  const wovenBlock = "\n\n" + WOVEN_MARKER + "\n" + questions.map((q) => `- ${q}`).join("\n") + "\n";
  const terms = "These terms bind every answer." + wovenBlock;
  const c = classifyConstitution(terms);
  ok(c.shape === "limiting", "the woven marker -> limiting");
  ok(JSON.stringify(c.questions) === JSON.stringify(questions), "the exact closed list reads back: " + JSON.stringify(c.questions));
  // And bottle.html's literal marker string is the one we detect.
  ok(WOVEN_MARKER === "QUESTIONS — this constitution governs ONLY the following questions:", "marker text is the bottle's exact phrase");
}

// 3. The list closes at the first non-item line — trailing prose after the questions is not swallowed.
{
  const terms = WOVEN_MARKER + "\n- Only this one?\n\nAnd nothing after the blank line is a question.";
  const c = classifyConstitution(terms);
  ok(c.shape === "limiting" && c.questions.length === 1 && c.questions[0] === "Only this one?", "a blank line closes the list");
}

// 4. A marker with no items is still a declared limit (empty list) — honest, and the human must read on.
{
  const c = classifyConstitution(WOVEN_MARKER + "\n\nsome prose, no bullets");
  ok(c.shape === "limiting" && c.questions.length === 0, "marker without bullets -> limiting, empty list");
}

// 5. The advisory: an un-annotated lattice says NOTHING (null) — the honest default that leaves the
//    queue's opinion exactly as it was before annotations existed.
{
  ok(shapeOpinion({ answer: "sha256:" + "9".repeat(64), server: "sha256:" + "5".repeat(64) }) === null,
    "no lattice.shapes -> null opinion (nothing fired)");
  ok(shapeOpinion({ answer: "a", server: "b", lattice: { shapes: {} } }) === null, "empty shapes -> null");
}

// 6. A known limiting server + an unread arrival: the advisory names the closed set and CARRIES the
//    list for the human — and says nothing it doesn't know about the arrival.
{
  const S = "sha256:" + "5".repeat(64), novel = "sha256:" + "9".repeat(64);
  const lattice = { shapes: { [S]: { shape: "limiting", questions: ["Cut or keep?", "Fund the pool?"] } } };
  const op = shapeOpinion({ answer: novel, server: S, lattice });
  ok(op && /limits to a closed set of 2 questions/.test(op.advisory), "advisory names the server's closed count: " + (op && op.advisory));
  ok(!/arrival/.test(op.advisory), "an unread arrival is not described — no reading we don't have");
  ok(JSON.stringify(op.questions) === JSON.stringify(["Cut or keep?", "Fund the pool?"]), "the closed list rides for the human to check");
  ok(!/admit|refuse/.test(op.advisory), "the advisory is never a verdict");
}

// 7. Both sides known: an open server and a limiting arrival — both described, the arrival's list surfaced.
{
  const S = "sha256:" + "5".repeat(64), A = "sha256:" + "1".repeat(64);
  const lattice = { shapes: { [S]: { shape: "open", questions: [] }, [A]: { shape: "limiting", questions: ["Only Q?"] } } };
  const op = shapeOpinion({ answer: A, server: S, lattice });
  ok(/this server's constitution is open/.test(op.advisory) && /the arrival's constitution limits to a closed set of 1 question\b/.test(op.advisory),
    "both shapes described, singular grammar right: " + op.advisory);
  ok(JSON.stringify(op.questions) === JSON.stringify(["Only Q?"]), "the limiting side's list is the one surfaced");
}

if (fails) { console.error(`\n${fails} FAILED`); process.exit(1); }
console.log("\nall constitution-shape tests passed");
