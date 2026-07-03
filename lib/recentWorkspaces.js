// Tracks recently created/joined workspace codes in this browser only
// (localStorage — there's no account system to sync this across
// devices). Purely a convenience shortcut; it grants no access on its
// own since joining still requires the workspace to actually exist.
const STORAGE_KEY = "neverNoteRecentWorkspaces";
const MAX_ENTRIES = 8;

export function getRecentWorkspaces() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    // Private browsing or storage disabled — degrade gracefully.
    return [];
  }
}

export function addRecentWorkspace(code) {
  if (typeof window === "undefined") return;
  try {
    const deduped = getRecentWorkspaces().filter((c) => c !== code);
    const next = [code, ...deduped].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore — this is a convenience feature, not critical functionality.
  }
}

export function clearRecentWorkspaces() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
