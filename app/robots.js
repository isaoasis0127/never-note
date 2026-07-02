const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Workspace pages hold private, unauthenticated user content
        // addressable only by knowing the invite code — they should
        // never be crawled or cached by search engines.
        disallow: "/workspace/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
