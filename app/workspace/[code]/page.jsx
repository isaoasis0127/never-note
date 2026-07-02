import WorkspaceClient from "./WorkspaceClient";

// Workspace pages are private (gated only by knowledge of the invite
// code, not by auth), so they must never be indexed — this overrides
// the site-wide robots default set in app/layout.jsx.
export const metadata = {
  title: "ワークスペース",
  robots: { index: false, follow: false },
};

// Static export can't know every workspace code at build time, so we
// pre-render a single placeholder path ("_"). netlify.toml rewrites
// every real /workspace/<code> URL to this same file; the client
// component then reads the real code from the browser URL.
export async function generateStaticParams() {
  return [{ code: "_" }];
}

export const dynamicParams = false;

export default function WorkspacePage() {
  return <WorkspaceClient />;
}
