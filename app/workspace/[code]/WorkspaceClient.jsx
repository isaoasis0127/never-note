"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  setDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { ref, onDisconnect, onValue, remove, set } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, rtdb, storage } from "@/lib/firebase";
import { isValidWorkspaceCode } from "@/lib/workspaceCode";
import { MAX_ATTACHMENT_SIZE, MAX_ATTACHMENTS_PER_NOTE, formatFileSize, attachmentStoragePath } from "@/lib/attachments";
import { makeNoteLink, extractLinkTokens, findBacklinks } from "@/lib/noteLinks";
import GiraffeLogo from "@/components/GiraffeLogo";

const AUTOSAVE_DELAY_MS = 600;

const linkChipStyle = {
  border: "1px solid rgba(44,24,16,0.15)",
  background: "var(--cream)",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 12,
  color: "var(--dark-brown)",
  fontWeight: 600,
};

export default function WorkspaceClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The prebuilt static page is served for every /workspace/<code>
  // URL (see netlify.toml), so the real code is read from the
  // browser's URL rather than the route param.
  const code = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts[1] ? decodeURIComponent(parts[1]).toUpperCase() : "";
  }, [pathname]);

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineCount, setOnlineCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [uploadingCount, setUploadingCount] = useState(0);
  const [attachmentError, setAttachmentError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [crossWorkspaceTitles, setCrossWorkspaceTitles] = useState({});

  const saveTimer = useRef(null);
  const skipNextRemoteSync = useRef(false);
  const fileInputRef = useRef(null);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (!code || !isValidWorkspaceCode(code)) return;

    const notesQuery = query(collection(db, "workspaces", code, "notes"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotes(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [code]);

  // Cross-workspace links navigate here with ?open=<noteId>. Once the
  // notes list has loaded, select that note automatically (only once
  // per page load, so switching notes afterward doesn't keep
  // re-triggering this from a stale query param).
  useEffect(() => {
    if (autoOpenedRef.current || loading) return;
    const openId = searchParams.get("open");
    if (openId && notes.some((n) => n.id === openId)) {
      setSelectedId(openId);
      autoOpenedRef.current = true;
    }
  }, [loading, notes, searchParams]);

  // Presence: register this tab, remove it automatically on
  // disconnect, and count everyone currently registered.
  useEffect(() => {
    if (!code || !isValidWorkspaceCode(code)) return;

    const sessionId = Math.random().toString(36).slice(2);
    const presenceRef = ref(rtdb, `presence/${code}/${sessionId}`);

    set(presenceRef, { online: true, ts: Date.now() });
    onDisconnect(presenceRef).remove();

    const roomRef = ref(rtdb, `presence/${code}`);
    const unsubscribe = onValue(roomRef, (snap) => {
      const val = snap.val() || {};
      setOnlineCount(Object.keys(val).length || 1);
    });

    return () => {
      unsubscribe();
      remove(presenceRef);
    };
  }, [code]);

  const selectedNote = notes.find((n) => n.id === selectedId) || null;

  const outgoingTokens = useMemo(() => {
    if (!selectedId) return [];
    return extractLinkTokens(content).filter((t) => {
      const isSameWorkspace = t.code === null || t.code === code;
      return !(isSameWorkspace && t.noteId === selectedId); // exclude self-links
    });
  }, [content, selectedId, code]);

  const sameWorkspaceOutgoing = useMemo(
    () =>
      outgoingTokens
        .filter((t) => t.code === null || t.code === code)
        .map((t) => notes.find((n) => n.id === t.noteId))
        .filter(Boolean),
    [outgoingTokens, notes, code]
  );

  const crossWorkspaceOutgoing = useMemo(() => outgoingTokens.filter((t) => t.code && t.code !== code), [outgoingTokens]);

  // Cross-workspace link targets live in a workspace we haven't
  // loaded, so their titles have to be fetched individually rather
  // than looked up in the local `notes` array.
  useEffect(() => {
    crossWorkspaceOutgoing.forEach(async (t) => {
      const key = `${t.code}:${t.noteId}`;
      if (key in crossWorkspaceTitles) return;
      setCrossWorkspaceTitles((prev) => ({ ...prev, [key]: "loading" }));
      try {
        const snap = await getDoc(doc(db, "workspaces", t.code, "notes", t.noteId));
        setCrossWorkspaceTitles((prev) => ({
          ...prev,
          [key]: snap.exists() ? snap.data().title || "無題のノート" : null,
        }));
      } catch {
        setCrossWorkspaceTitles((prev) => ({ ...prev, [key]: null }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crossWorkspaceOutgoing]);

  const backlinks = useMemo(() => {
    if (!selectedId) return [];
    return findBacklinks(notes, code, selectedId);
  }, [notes, selectedId, code]);

  useEffect(() => {
    if (skipNextRemoteSync.current) {
      skipNextRemoteSync.current = false;
      return;
    }
    if (selectedNote) {
      setTitle(selectedNote.title || "");
      setContent(selectedNote.content || "");
    }
  }, [selectedId, selectedNote?.title, selectedNote?.content]);

  useEffect(() => {
    if (!selectedId) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      skipNextRemoteSync.current = true;
      await updateDoc(doc(db, "workspaces", code, "notes", selectedId), {
        title,
        content,
        updatedAt: serverTimestamp(),
      });
      setSaveState("saved");
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  async function handleNewNote() {
    const docRef = await addDoc(collection(db, "workspaces", code, "notes"), {
      title: "無題のノート",
      content: "",
      pinned: false,
      attachments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setSelectedId(docRef.id);
  }

  async function handleDelete(noteId) {
    if (!window.confirm("このノートを削除しますか？添付ファイルも削除されます。")) return;
    const note = notes.find((n) => n.id === noteId);
    // Best-effort cleanup: Storage files aren't automatically removed
    // when a Firestore doc is deleted, so remove them explicitly.
    // Failures here shouldn't block deleting the note itself.
    if (note?.attachments?.length) {
      await Promise.allSettled(note.attachments.map((a) => deleteObject(storageRef(storage, a.path))));
    }
    await deleteDoc(doc(db, "workspaces", code, "notes", noteId));
    if (selectedId === noteId) setSelectedId(null);
  }

  async function handleFilesSelected(fileList) {
    setAttachmentError("");
    const files = Array.from(fileList || []);
    if (!files.length || !selectedNote) return;

    const currentCount = selectedNote.attachments?.length || 0;
    if (currentCount + files.length > MAX_ATTACHMENTS_PER_NOTE) {
      setAttachmentError(`添付ファイルは1ノートあたり最大${MAX_ATTACHMENTS_PER_NOTE}個までです。`);
      return;
    }

    const oversized = files.find((f) => f.size > MAX_ATTACHMENT_SIZE);
    if (oversized) {
      setAttachmentError(`「${oversized.name}」は${formatFileSize(MAX_ATTACHMENT_SIZE)}を超えているため添付できません。`);
      return;
    }

    setUploadingCount(files.length);
    try {
      for (const file of files) {
        const path = attachmentStoragePath(code, selectedNote.id, file.name);
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" });
        const url = await getDownloadURL(fileRef);
        await updateDoc(doc(db, "workspaces", code, "notes", selectedNote.id), {
          attachments: arrayUnion({
            name: file.name,
            path,
            url,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setAttachmentError("アップロードに失敗しました。もう一度お試しください。");
    } finally {
      setUploadingCount(0);
    }
  }

  async function handleRemoveAttachment(attachment) {
    if (!selectedNote) return;
    try {
      await deleteObject(storageRef(storage, attachment.path));
    } catch (err) {
      // File may already be gone from Storage; still remove the
      // reference from Firestore so the UI doesn't show a dead link.
    }
    await updateDoc(doc(db, "workspaces", code, "notes", selectedNote.id), {
      attachments: arrayRemove(attachment),
      updatedAt: serverTimestamp(),
    });
  }

  async function togglePin(note) {
    await updateDoc(doc(db, "workspaces", code, "notes", note.id), {
      pinned: !note.pinned,
    });
  }

  async function handleCopyLink(note) {
    try {
      await navigator.clipboard.writeText(makeNoteLink(code, note.id));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch (err) {
      window.prompt("コピーできませんでした。以下を手動でコピーしてください:", makeNoteLink(code, note.id));
    }
  }

  function handleLeave() {
    router.push("/");
  }

  const filtered = notes
    .filter((n) => {
      if (!searchTerm.trim()) return true;
      const t = searchTerm.toLowerCase();
      return (n.title || "").toLowerCase().includes(t) || (n.content || "").toLowerCase().includes(t);
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (!code || !isValidWorkspaceCode(code)) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#7a6a5c" }}>ワークスペースを読み込み中です…</p>
      </main>
    );
  }

  return (
    <div className="workspace-shell" data-mobile-view={selectedId ? "note" : "list"} style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        className="workspace-sidebar"
        style={{
          width: 300,
          flexShrink: 0,
          borderRight: "1px solid rgba(44,24,16,0.1)",
          background: "#fff",
        }}
      >
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <GiraffeLogo size={24} color="var(--dark-brown)" />
            <strong style={{ fontFamily: "var(--font-heading)", fontSize: 18, color: "var(--dark-brown)" }}>Never Note</strong>
          </div>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 12,
              color: "#a89685",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.02em",
            }}
          >
            ワークスペース: <span style={{ fontWeight: 600, color: "#7a6a5c" }}>{code}</span>
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7a6a5c", marginBottom: 12 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#3f9142",
                display: "inline-block",
              }}
            />
            {onlineCount}人がオンライン
          </div>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ノートを検索"
            style={{
              width: "100%",
              padding: "10px 10px",
              borderRadius: 8,
              border: "1px solid rgba(44,24,16,0.15)",
              fontSize: 16,
              fontFamily: "var(--font-body)",
            }}
          />
        </div>

        <button
          onClick={handleNewNote}
          className="tap-target"
          style={{
            margin: 14,
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--amber)",
            color: "var(--dark-brown)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          + 新しいノート
        </button>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          {loading && <p style={{ padding: "0 10px", fontSize: 12, color: "#a89685" }}>読み込み中…</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ padding: "0 10px", fontSize: 12, color: "#a89685" }}>
              {searchTerm ? "見つかりませんでした" : "まだノートがありません"}
            </p>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedId(note.id)}
              className="note-list-item tap-target"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 10px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 2,
                background: selectedId === note.id ? "var(--cream)" : "transparent",
                border: selectedId === note.id ? "1px solid rgba(44,24,16,0.1)" : "1px solid transparent",
                font: "inherit",
                color: "inherit",
                WebkitAppearance: "none",
                appearance: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {note.pinned && "📌 "}
                  {note.attachments?.length > 0 && "📎 "}
                  {note.title || "無題のノート"}
                </span>
              </div>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12,
                  color: "#a89685",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {(note.content || "内容なし").slice(0, 60)}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={handleLeave}
          className="tap-target"
          style={{
            margin: 14,
            padding: "10px 0",
            borderRadius: 8,
            border: "1px solid rgba(44,24,16,0.15)",
            background: "transparent",
            color: "#8a5a3c",
            fontSize: 13,
          }}
        >
          ワークスペースを退出
        </button>
      </aside>

      <main className="workspace-main" style={{ flex: 1, background: "var(--cream)" }}>
        {selectedNote ? (
          <>
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(44,24,16,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setSelectedId(null)}
                className="mobile-back-button tap-target"
                aria-label="ノート一覧に戻る"
                style={{
                  border: "1px solid rgba(44,24,16,0.15)",
                  background: "transparent",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 14,
                  color: "var(--dark-brown)",
                  flexShrink: 0,
                }}
              >
                ← 一覧
              </button>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="無題のノート"
                style={{
                  flex: 1,
                  minWidth: 120,
                  border: "none",
                  background: "transparent",
                  fontFamily: "var(--font-heading)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--dark-brown)",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: "#a89685", minWidth: 50, textAlign: "right" }}>
                  {uploadingCount > 0 ? "アップロード中…" : saveState === "saving" ? "保存中…" : "保存済み"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    e.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="ファイルを添付"
                  className="tap-target"
                  disabled={uploadingCount > 0}
                  style={{
                    border: "1px solid rgba(44,24,16,0.15)",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                  }}
                >
                  📎
                </button>
                <button
                  onClick={() => handleCopyLink(selectedNote)}
                  title="このノートへのリンクをコピー"
                  className="tap-target"
                  style={{
                    border: "1px solid rgba(44,24,16,0.15)",
                    background: linkCopied ? "var(--yellow)" : "transparent",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  {linkCopied ? "コピーしました" : "🔗"}
                </button>
                <button
                  onClick={() => togglePin(selectedNote)}
                  title="ピン留め"
                  className="tap-target"
                  style={{
                    border: "1px solid rgba(44,24,16,0.15)",
                    background: selectedNote.pinned ? "var(--yellow)" : "transparent",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                  }}
                >
                  📌
                </button>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  title="削除"
                  className="tap-target"
                  style={{
                    border: "1px solid rgba(44,24,16,0.15)",
                    background: "transparent",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 14,
                    color: "#b3401f",
                  }}
                >
                  削除
                </button>
              </div>
            </div>
            {(selectedNote.attachments?.length > 0 || attachmentError) && (
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(44,24,16,0.08)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {attachmentError && (
                  <p role="alert" style={{ width: "100%", margin: 0, fontSize: 12, color: "#b3401f" }}>
                    {attachmentError}
                  </p>
                )}
                {selectedNote.attachments?.map((a) => (
                  <div
                    key={a.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 8px",
                      borderRadius: 8,
                      background: "var(--cream)",
                      border: "1px solid rgba(44,24,16,0.1)",
                      fontSize: 12,
                      maxWidth: "100%",
                    }}
                  >
                    <span>{a.contentType?.startsWith("image/") ? "🖼️" : "📄"}</span>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--dark-brown)",
                        textDecoration: "none",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 180,
                      }}
                    >
                      {a.name}
                    </a>
                    <span style={{ color: "#a89685" }}>{formatFileSize(a.size)}</span>
                    <button
                      onClick={() => handleRemoveAttachment(a)}
                      aria-label={`${a.name}を削除`}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a89685",
                        cursor: "pointer",
                        fontSize: 14,
                        lineHeight: 1,
                        padding: "0 2px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(sameWorkspaceOutgoing.length > 0 || crossWorkspaceOutgoing.length > 0 || backlinks.length > 0) && (
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(44,24,16,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {(sameWorkspaceOutgoing.length > 0 || crossWorkspaceOutgoing.length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#a89685", marginRight: 2 }}>🔗 リンク先:</span>
                    {sameWorkspaceOutgoing.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedId(n.id)}
                        className="tap-target"
                        style={linkChipStyle}
                      >
                        {n.title || "無題のノート"}
                      </button>
                    ))}
                    {crossWorkspaceOutgoing.map((t) => {
                      const key = `${t.code}:${t.noteId}`;
                      const titleState = crossWorkspaceTitles[key];
                      if (titleState === null) return null; // not found — skip silently
                      const label = titleState && titleState !== "loading" ? titleState : "読み込み中…";
                      return (
                        <button
                          key={key}
                          onClick={() => router.push(`/workspace/${t.code}/?open=${t.noteId}`)}
                          className="tap-target"
                          title={`別のワークスペース（${t.code}）のノートへ移動`}
                          style={linkChipStyle}
                        >
                          {label}
                          <span style={{ color: "#a89685", fontWeight: 400 }}> ↗ {t.code}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {backlinks.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#a89685", marginRight: 2 }}>🔗 リンク元:</span>
                    {backlinks.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedId(n.id)}
                        className="tap-target"
                        style={linkChipStyle}
                      >
                        {n.title || "無題のノート"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="入力を始めてください…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                resize: "none",
                background: "transparent",
                padding: "20px",
                fontSize: 16,
                lineHeight: 1.8,
                fontFamily: "var(--font-body)",
                color: "var(--dark-brown)",
              }}
            />
          </>
        ) : (
          <EmptyState hasNotes={notes.length > 0} onCreate={handleNewNote} />
        )}
      </main>
    </div>
  );
}

function EmptyState({ hasNotes, onCreate }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        gap: 12,
      }}
    >
      <div className="spot-field" aria-hidden="true">
        <span className="spot" style={{ width: 140, height: 120, top: "20%", left: "20%" }} />
        <span className="spot" style={{ width: 100, height: 90, top: "60%", left: "70%" }} />
      </div>
      <GiraffeLogo size={40} color="var(--amber)" />
      <p style={{ color: "#a89685", fontSize: 14, position: "relative" }}>
        {hasNotes ? "左のリストからノートを選んでください" : "最初のノートを作成しましょう"}
      </p>
      {!hasNotes && (
        <button
          onClick={onCreate}
          style={{
            position: "relative",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "var(--amber)",
            color: "var(--dark-brown)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          + 新しいノート
        </button>
      )}
    </div>
  );
}
