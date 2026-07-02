"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { ref, onDisconnect, onValue, remove, set } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { isValidWorkspaceCode } from "@/lib/workspaceCode";
import GiraffeLogo from "@/components/GiraffeLogo";

const AUTOSAVE_DELAY_MS = 600;

export default function WorkspaceClient() {
  const pathname = usePathname();
  const router = useRouter();

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

  const saveTimer = useRef(null);
  const skipNextRemoteSync = useRef(false);

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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setSelectedId(docRef.id);
  }

  async function handleDelete(noteId) {
    if (!window.confirm("このノートを削除しますか？")) return;
    await deleteDoc(doc(db, "workspaces", code, "notes", noteId));
    if (selectedId === noteId) setSelectedId(null);
  }

  async function togglePin(note) {
    await updateDoc(doc(db, "workspaces", code, "notes", note.id), {
      pinned: !note.pinned,
    });
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
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid rgba(44,24,16,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <GiraffeLogo size={22} color="var(--dark-brown)" />
            <strong style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{code}</strong>
          </div>
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
            <div
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className="note-list-item"
              style={{
                padding: "12px 10px",
                borderRadius: 8,
                cursor: "pointer",
                marginBottom: 2,
                background: selectedId === note.id ? "var(--cream)" : "transparent",
                border: selectedId === note.id ? "1px solid rgba(44,24,16,0.1)" : "1px solid transparent",
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
            </div>
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

      <main className="workspace-main" style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--cream)" }}>
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
                  {saveState === "saving" ? "保存中…" : "保存済み"}
                </span>
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
