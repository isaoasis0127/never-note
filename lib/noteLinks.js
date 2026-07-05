// Lightweight wiki-style note linking. Since note content is plain
// text (no rich text editor), a link is just the literal string
// "[[noteId]]" typed or pasted into a note's content. There's no
// live-clickable rendering inside the <textarea> itself (browsers
// don't support that for form textareas) — instead:
//   - "outgoing links": [[id]] patterns found in the note currently
//     being viewed, resolved to their current titles and shown as a
//     jump-to chip below the editor.
//   - "backlinks": every other note in the workspace whose content
//     contains "[[thisNoteId]]", shown the same way.
// Together these give round-trip navigation without needing an
// in-place rich text editor.
const LINK_PATTERN = /\[\[([A-Za-z0-9]+)\]\]/g;

export function makeNoteLink(noteId) {
  return `[[${noteId}]]`;
}

export function extractLinkedNoteIds(content) {
  if (!content) return [];
  const ids = new Set();
  for (const match of content.matchAll(LINK_PATTERN)) {
    ids.add(match[1]);
  }
  return [...ids];
}

export function findBacklinks(notes, targetNoteId) {
  if (!targetNoteId) return [];
  const needle = makeNoteLink(targetNoteId);
  return notes.filter((n) => n.id !== targetNoteId && n.content?.includes(needle));
}
