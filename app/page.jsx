"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateWorkspaceCode, isValidWorkspaceCode, normalizeWorkspaceCode } from "@/lib/workspaceCode";
import GiraffeLogo from "@/components/GiraffeLogo";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  async function handleCreate() {
    setBusy(true);
    setError("");
    try {
      // Regenerate on the rare chance of a collision with an existing workspace.
      let code = generateWorkspaceCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const snap = await getDoc(doc(db, "workspaces", code));
        if (!snap.exists()) break;
        code = generateWorkspaceCode();
      }
      await setDoc(doc(db, "workspaces", code), {
        createdAt: serverTimestamp(),
      });
      router.push(`/workspace/${code}/`);
    } catch (err) {
      setError("ワークスペースを作成できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();

    const remainingLockMs = lockedUntil - Date.now();
    if (remainingLockMs > 0) {
      setError(`試行回数が多いため、あと${Math.ceil(remainingLockMs / 1000)}秒お待ちください。`);
      return;
    }

    const code = normalizeWorkspaceCode(joinCode);
    if (!isValidWorkspaceCode(code)) {
      setError("招待コードの形式が正しくありません（例: GIRAFFE-K7XQ9P）");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const snap = await getDoc(doc(db, "workspaces", code));
      if (!snap.exists()) {
        // Client-side backoff only slows down casual guessing in this
        // browser tab — it's not a real defense on its own (a script can
        // just open a fresh tab/session). The real protection is Firebase
        // App Check plus the code's own entropy; this just buys time and
        // discourages manual guessing. See README "公開前に" section.
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 3) {
          const delayMs = Math.min(1000 * 2 ** (nextAttempts - 3), 60000);
          setLockedUntil(Date.now() + delayMs);
        }
        setError("そのコードのワークスペースは見つかりませんでした。");
        setBusy(false);
        return;
      }
      setFailedAttempts(0);
      router.push(`/workspace/${code}/`);
    } catch (err) {
      setError("接続できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: 24,
      }}
    >
      <div className="spot-field" aria-hidden="true">
        <span className="spot" style={{ width: 180, height: 160, top: "8%", left: "6%" }} />
        <span className="spot" style={{ width: 120, height: 100, top: "60%", left: "80%" }} />
        <span className="spot" style={{ width: 90, height: 80, top: "78%", left: "12%" }} />
        <span className="spot" style={{ width: 140, height: 130, top: "5%", left: "78%" }} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid rgba(44,24,16,0.08)",
          borderRadius: 16,
          boxShadow: "var(--shadow-lift)",
          padding: "clamp(24px, 8vw, 40px) clamp(18px, 6vw, 32px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <GiraffeLogo size={44} color="var(--dark-brown)" />
          <h1 style={{ fontSize: 28, margin: "12px 0 4px", color: "var(--dark-brown)" }}>Never Note</h1>
          <p style={{ margin: 0, color: "#7a6a5c", fontSize: 14 }}>招待コードで参加する共同ノート</p>
        </div>

        <div
          role="tablist"
          style={{
            display: "flex",
            background: "var(--cream)",
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
            border: "1px solid rgba(44,24,16,0.08)",
          }}
        >
          <TabButton active={mode === "create"} onClick={() => { setMode("create"); setError(""); }}>
            新規作成
          </TabButton>
          <TabButton active={mode === "join"} onClick={() => { setMode("join"); setError(""); }}>
            参加する
          </TabButton>
        </div>

        {mode === "create" ? (
          <div>
            <p style={{ fontSize: 14, color: "#5a4a3c", lineHeight: 1.7, marginTop: 0 }}>
              新しいワークスペースを作成すると、招待コードが発行されます。そのコードを知っている人だけが参加できます。
            </p>
            <button
              onClick={handleCreate}
              disabled={busy}
              className="tap-target"
              style={primaryButtonStyle}
            >
              {busy ? "作成中…" : "ワークスペースを作成"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin}>
            <label htmlFor="code" style={{ fontSize: 13, fontWeight: 600, color: "#5a4a3c" }}>
              招待コード
            </label>
            <input
              id="code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="GIRAFFE-K7XQ9P"
              autoComplete="off"
              style={inputStyle}
            />
            <button type="submit" disabled={busy} className="tap-target" style={primaryButtonStyle}>
              {busy ? "確認中…" : "参加する"}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" style={{ color: "#b3401f", fontSize: 13, marginTop: 14, marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>

      <p
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 20,
          fontSize: 12,
          color: "#a89685",
        }}
      >
        <Link href="/terms" style={{ color: "#a89685", textDecoration: "underline" }}>
          利用規約
        </Link>
      </p>
    </main>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="tap-target"
      style={{
        flex: 1,
        padding: "10px 0",
        border: "none",
        borderRadius: 8,
        background: active ? "var(--dark-brown)" : "transparent",
        color: active ? "var(--cream)" : "#5a4a3c",
        fontWeight: 600,
        fontSize: 14,
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

const primaryButtonStyle = {
  width: "100%",
  marginTop: 16,
  padding: "12px 0",
  borderRadius: 10,
  border: "none",
  background: "var(--amber)",
  color: "var(--dark-brown)",
  fontWeight: 700,
  fontSize: 15,
  boxShadow: "var(--shadow-soft)",
};

const inputStyle = {
  width: "100%",
  marginTop: 6,
  marginBottom: 4,
  padding: "12px 12px",
  borderRadius: 8,
  border: "1px solid rgba(44,24,16,0.18)",
  fontSize: 16,
  fontFamily: "var(--font-body)",
  letterSpacing: "0.02em",
};
