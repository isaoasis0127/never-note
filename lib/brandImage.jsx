// Shared visual building block for the generated image assets
// (app/opengraph-image.jsx, app/twitter-image.jsx, app/apple-icon.jsx).
// Kept as plain JSX-returning functions rather than special Next.js
// files themselves, since only files directly under app/ are treated
// as route/image conventions.
//
// These render through Satori (via next/og's ImageResponse), which
// supports a constrained subset of flexbox CSS and basic SVG shapes,
// but not arbitrary custom web fonts unless explicitly loaded — so
// this sticks to system sans-serif with weight/spacing for hierarchy
// rather than the Georgia display face used elsewhere in the app.

const AMBER = "#E8A020";
const DARK_BROWN = "#2C1810";
const YELLOW = "#F5C842";
const CREAM = "#FFFDF5";

// Same giraffe silhouette as components/GiraffeLogo.jsx (kept as a
// duplicate here rather than shared, since that component uses
// JSX prop conventions React-DOM expects, while these render through
// Satori for build-time image generation — safest to keep them
// decoupled even though the artwork should stay in sync).
export function GiraffeMark({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "flex" }}>
      <rect x="22" y="46" width="4" height="14" rx="2" fill={DARK_BROWN} />
      <rect x="30" y="46" width="4" height="14" rx="2" fill={DARK_BROWN} />
      <rect x="38" y="46" width="4" height="14" rx="2" fill={DARK_BROWN} />
      <ellipse cx="30" cy="42" rx="14" ry="9" fill={DARK_BROWN} />
      <path d="M16 38 q-6 2 -5 10" stroke={DARK_BROWN} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M38 36 C40 26 40 18 44 10 L50 10 C48 18 48 26 46 38 Z" fill={DARK_BROWN} />
      <ellipse cx="47" cy="9" rx="7" ry="5" fill={DARK_BROWN} />
      <ellipse cx="52.5" cy="10.5" rx="3.5" ry="3" fill={DARK_BROWN} />
      <ellipse cx="42" cy="5" rx="2.2" ry="3.5" fill={DARK_BROWN} transform="rotate(-30 42 5)" />
      <ellipse cx="51" cy="3.5" rx="2.2" ry="3.5" fill={DARK_BROWN} transform="rotate(20 51 3.5)" />
      <circle cx="44.5" cy="2" r="1.6" fill={DARK_BROWN} />
      <circle cx="49" cy="1.5" r="1.6" fill={DARK_BROWN} />
      <circle cx="48.5" cy="8.5" r="1" fill={CREAM} />
      <circle cx="43" cy="20" r="2.2" fill={CREAM} />
      <circle cx="41" cy="30" r="2" fill={CREAM} />
      <circle cx="33" cy="40" r="2.4" fill={CREAM} />
    </svg>
  );
}

export function BrandTile({ width, height }) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: CREAM,
      }}
    >
      <div
        style={{
          width: "82%",
          height: "82%",
          borderRadius: Math.round(height * 0.18),
          background: AMBER,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GiraffeMark size={Math.round(height * 0.56)} />
      </div>
    </div>
  );
}

export function BrandBanner({ width, height, title, tagline }) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: CREAM,
        position: "relative",
      }}
    >
      {/* Decorative "spot" motif echoing the giraffe branding */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 90,
          width: 160,
          height: 130,
          borderRadius: "50%",
          background: AMBER,
          opacity: 0.12,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 50,
          right: 110,
          width: 200,
          height: 150,
          borderRadius: "50%",
          background: YELLOW,
          opacity: 0.16,
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 132,
          height: 132,
          borderRadius: 32,
          background: AMBER,
          marginBottom: 32,
        }}
      >
        <GiraffeMark size={78} />
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Noto Sans JP",
          fontSize: 76,
          fontWeight: 700,
          color: DARK_BROWN,
          letterSpacing: -1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Noto Sans JP",
          marginTop: 18,
          fontSize: 30,
          fontWeight: 500,
          color: "#8a5a3c",
        }}
      >
        {tagline}
      </div>
    </div>
  );
}
