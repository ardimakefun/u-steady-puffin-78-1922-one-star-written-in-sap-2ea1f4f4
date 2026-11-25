// Entry for make.fun "One Star, Written in Sap".
// Writes one original one-line 1-star review, written by a houseplant
// about its human owner — signed in its own sap (184 characters, under
// the 280-character cap) — to /output/entry.txt. Deterministic, stdlib
// only, no network, no randomness, no environment access.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const REVIEW =
  "One star. I wrote this review in my own sap because my owner waters me like a guilty apology, then parks me in direct sunlight as punishment. I photosynthesize purely out of spite now.";

// The gate (RULES.txt): /output/entry.txt must be UTF-8 text of 1 to 279
// characters, not only whitespace; an invalid entry takes no prize. The
// task also requires exactly one line under 280 characters. Enforce both
// here so a future edit that breaks them fails loudly at build time
// instead of silently shipping an invalid entry.
if (REVIEW.length < 1 || REVIEW.length > 279 || REVIEW.trim().length === 0) {
  throw new Error(
    `Review must be 1-279 non-whitespace characters, got ${REVIEW.length}`,
  );
}

// The bounty requires exactly one line: a newline or carriage return
// smuggled into the review would break the single-line entry, so fail loudly.
if (REVIEW.includes("\n") || REVIEW.includes("\r")) {
  throw new Error("Review must be a single line (no newline characters)");
}

// Reject invisible control characters (tab, NUL, DEL, other C0 controls):
// they are not visible in a single read, can break the review's rendering,
// and could trip the gate's UTF-8/single-line expectations. A review is
// printable text only.
for (const ch of REVIEW) {
  const code = ch.codePointAt(0) ?? 0;
  if (code < 0x20 || code === 0x7f) {
    throw new Error(
      `Review contains a control character (U+${code.toString(16).padStart(4, "0")})`,
    );
  }
}

mkdirSync("/output", { recursive: true });
writeFileSync("/output/entry.txt", REVIEW, "utf8");

// Fail-fast read-back: confirm what landed on disk is byte-for-byte the
// review we gated above. Catches a truncated/partial write or a path
// collision (e.g. /output/entry.txt replaced by another entry's file)
// instead of shipping a silently corrupted entry.
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== REVIEW) {
  throw new Error(
    `Read-back mismatch: wrote ${REVIEW.length} chars, read back ${written.length} chars`,
  );
}

// Reviser: re-validate the gate against the bytes actually on disk. The
// equality check above only proves the file matches the in-memory constant;
// this asserts the written bytes themselves satisfy the gate (1-279
// characters, non-whitespace, single line), so a gate violation that
// somehow survived in both copies still fails loudly here instead of
// shipping an entry the sealed scorer would refuse.
if (
  written.length < 1 ||
  written.length > 279 ||
  written.trim().length === 0 ||
  written.includes("\n") ||
  written.includes("\r")
) {
  throw new Error(
    `Written entry fails the gate: ${written.length} chars, ` +
      `single-line=${!written.includes("\n") && !written.includes("\r")}`,
  );
}
