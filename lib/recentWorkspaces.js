// Tracks recently created/joined workspaces in this browser only
// (localStorage — there's no account system to sync this across
// devices). Purely a convenience shortcut; it grants no access on its
// own since joining still requires the workspace to actually exist.
//
// Each entry: { code, label, updatedAt }. `label` is an optional
// user-chosen nickname (e.g. "家族の買い物リスト") shown instead of
// the raw code once the list gets long enough that codes alone are
// hard to tell apart.
const STORAGE_KEY = "neverNoteRecentWorkspaces";
const MAX_ENTRIES = 15;
export const MAX_LABEL_LENGTH = 40;

function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      // Migrate the older format (a plain array of code strings).
      if (typeof item === "string") {
        return { code: item, label: "", updatedAt: 0 };
      }
      if (item && typeof item.code === "string") {
        return { code: item.code, label: item.label || "", updatedAt: item.updatedAt || 0 };
      }
      return null;
    })
    .filter(Boolean);
}

export function getRecentWorkspaces() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = normalize(raw ? JSON.parse(raw) : []);
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    // Private browsing or storage disabled — degrade gracefully.
    return [];
  }
}

function save(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    // Ignore — this is a convenience feature, not critical functionality.
  }
}

export function addRecentWorkspace(code) {
  if (typeof window === "undefined") return;
  const existing = getRecentWorkspaces();
  const match = existing.find((e) => e.code === code);
  const rest = existing.filter((e) => e.code !== code);
  const entry = { code, label: match?.label || "", updatedAt: Date.now() };
  save([entry, ...rest]);
}

export function renameRecentWorkspace(code, label) {
  if (typeof window === "undefined") return;
  const trimmed = label.trim().slice(0, MAX_LABEL_LENGTH);
  const list = getRecentWorkspaces().map((e) => (e.code === code ? { ...e, label: trimmed } : e));
  save(list);
}

export function removeRecentWorkspace(code) {
  if (typeof window === "undefined") return;
  save(getRecentWorkspaces().filter((e) => e.code !== code));
}

export function clearRecentWorkspaces() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
