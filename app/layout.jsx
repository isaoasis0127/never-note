import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Never Note";
const description = "招待コードを知っている人だけが参加できる、キリンのしるしの共同編集ノートアプリ。";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  applicationName: title,
  keywords: ["Never Note", "共同ノート", "コラボレーション", "招待コード", "リアルタイム編集"],
  // The marketing/landing page is fine to index; workspace pages hold
  // private user content and override this to noindex individually
  // (see app/workspace/[code]/page.jsx).
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: title,
    title,
    description,
    // og:image is supplied automatically by app/opengraph-image.jsx
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    // twitter:image is supplied automatically by app/twitter-image.jsx
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8a020",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
