// Lightweight wiki-style note linking, now spanning workspaces.
//
// A link is the literal text "[[CODE:noteId]]" (or the older
// "[[noteId]]" with no workspace prefix, kept working for notes that
// already used it — implicitly meaning "same workspace").
//
// There's no live-clickable rendering inside the <textarea> itself
// (browsers don't support that for form textareas) — instead, links
// found in a note's content are resolved and shown as jump-to chips
// below the editor:
//   - same-workspace links jump instantly (just select the note)
//   - cross-workspace links navigate to /workspace/<code>/?open=<id>
// Backlinks (which notes link TO the one you're viewing) only make
// sense within the current workspace, since that's the only set of
// notes this page has loaded.
const LINK_PATTERN = /\[\[(?:([A-Z]+-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}):)?([A-Za-z0-9]+)\]\]/g;

export function makeNoteLink(code, noteId) {
  return `[[${code}:${noteId}]]`;
}

// Returns a de-duplicated list of { code, noteId }. `code` is null
// for the older no-prefix format — callers should treat that as
// "this same workspace".
export function extractLinkTokens(content) {
  if (!content) return [];
  const seen = new Set();
  const tokens = [];
  for (const match of content.matchAll(LINK_PATTERN)) {
    const code = match[1] || null;
    const noteId = match[2];
    const key = `${code || ""}:${noteId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push({ code, noteId });
  }
  return tokens;
}

// A note is linked-to by `content` if it contains either the
// no-prefix form, or the explicit-code form naming `currentCode`.
export function findBacklinks(notes, currentCode, targetNoteId) {
  if (!targetNoteId) return [];
  return notes.filter((n) => {
    if (n.id === targetNoteId) return false;
    return extractLinkTokens(n.content).some(
      (t) => t.noteId === targetNoteId && (t.code === null || t.code === currentCode)
    );
  });
}
