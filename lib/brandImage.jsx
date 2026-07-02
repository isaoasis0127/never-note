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

// Simplified giraffe silhouette, redrawn as a handful of SVG shapes
// (rather than the detailed path used in components/GiraffeLogo.jsx)
// so it stays crisp and legible at small render sizes.
export function GiraffeMark({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "flex" }}>
      <rect x="46" y="38" width="8" height="34" rx="3" fill={DARK_BROWN} />
      <rect x="40" y="14" width="9" height="30" rx="4" fill={DARK_BROWN} transform="rotate(-8 44 30)" />
      <circle cx="43" cy="14" r="9" fill={DARK_BROWN} />
      <circle cx="40" cy="10" r="2.4" fill={CREAM} />
      <rect x="30" y="66" width="9" height="20" rx="3" fill={DARK_BROWN} />
      <rect x="52" y="66" width="9" height="20" rx="3" fill={DARK_BROWN} />
      <circle cx="60" cy="30" r="4" fill={AMBER} />
      <circle cx="34" cy="50" r="3.4" fill={AMBER} />
      <circle cx="52" cy="55" r="3" fill={AMBER} />
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
