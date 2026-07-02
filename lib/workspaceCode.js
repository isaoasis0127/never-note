// Generates workspace codes like "GIRAFFE-K7XQ9P": a savanna-themed
// word (nods to the giraffe branding) plus 6 random characters from
// a 32-symbol alphabet with visually ambiguous characters removed
// (no 0/O, 1/I/L). That gives roughly 10 * 32^6 ≈ 10.7 billion
// possible codes per word — enough that guessing a live code by
// brute force is not practical, while the word prefix keeps codes
// easy to read aloud and recognize at a glance.
//
// This code is the *only* access control for a workspace (there is
// no login), so its length is a real security parameter, not just
// cosmetic. Do not shrink it without re-checking the guessability
// math above, and pair it with Firebase App Check + the join-attempt
// throttling in app/page.jsx so brute forcing isn't just slow, it's
// actively blocked.
const WORDS = [
  "GIRAFFE",
  "SAVANNA",
  "ACACIA",
  "AMBER",
  "HORIZON",
  "OKAPI",
  "BAOBAB",
  "SAFARI",
  "DAPPLE",
  "OCHRE",
];

const SUFFIX_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L
const SUFFIX_LENGTH = 6;

function randomSuffix() {
  const bytes = new Uint32Array(SUFFIX_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < SUFFIX_LENGTH; i++) bytes[i] = Math.floor(Math.random() * 4294967296);
  }
  let out = "";
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    out += SUFFIX_ALPHABET[bytes[i] % SUFFIX_ALPHABET.length];
  }
  return out;
}

export function generateWorkspaceCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${word}-${randomSuffix()}`;
}

export function isValidWorkspaceCode(code) {
  return new RegExp(`^[A-Z]+-[${SUFFIX_ALPHABET}]{${SUFFIX_LENGTH}}$`).test(code);
}

export function normalizeWorkspaceCode(input) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
