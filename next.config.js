/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Firestore doc IDs (workspace codes) are used as dynamic route
  // segments. Static export needs every possible value pre-declared,
  // so the [code] route uses generateStaticParams + client-side
  // fetching (see app/workspace/[code]/page.jsx) instead of
  // server-rendering each workspace at build time.
  trailingSlash: true,
};

module.exports = nextConfig;
