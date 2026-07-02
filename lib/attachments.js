// Keep in sync with the size limit enforced server-side in storage.rules.
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_NOTE = 20;

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Storage paths are namespaced by workspace code and note ID so
// deleting a note's attachments (or auditing storage usage per
// workspace) is straightforward. A timestamp prefix avoids filename
// collisions when the same file is uploaded twice.
export function attachmentStoragePath(code, noteId, fileName) {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  return `workspaces/${code}/attachments/${noteId}/${Date.now()}-${safeName}`;
}
